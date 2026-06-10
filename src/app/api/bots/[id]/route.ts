import { NextResponse } from "next/server";
import { dbService } from "@/lib/dbService";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { logAction } from "@/lib/auditLog";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
      const isSandbox = await dbService.isSandboxMode();
      if (isSandbox) {
        const bot = await dbService.getBotById(id);
        if (!bot) return NextResponse.json({ error: "Bot not found" }, { status: 404 });
        return NextResponse.json({ bot });
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await hasPermission(user.role, "/dashboard/bots", "view"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const bot = await dbService.getBotById(id);
    if (!bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }

    // Account isolation guard
    if (user.role !== "super_admin" && bot.accountId !== user.accountId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ bot });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch bot" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
      const isSandbox = await dbService.isSandboxMode();
      if (isSandbox) {
        const updates = await request.json();
        let bot;
        if (updates.isActive === true) {
          bot = await dbService.setActiveBot("acc-super-admin", id);
        } else {
          bot = await dbService.updateBot(id, updates);
        }
        return NextResponse.json({ success: true, bot });
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await hasPermission(user.role, "/dashboard/bots", "edit"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const bot = await dbService.getBotById(id);
    if (!bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }

    // Account isolation guard
    if (user.role !== "super_admin" && bot.accountId !== user.accountId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updates = await request.json();
    let updatedBot;

    if (updates.isActive === true) {
      updatedBot = await dbService.setActiveBot(user.accountId || "acc-super-admin", id);
    } else {
      updatedBot = await dbService.updateBot(id, updates);
    }

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
    await logAction(user.email, "UPDATE_BOT", "bot", id, ip);

    return NextResponse.json({ success: true, bot: updatedBot });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update bot" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
      const isSandbox = await dbService.isSandboxMode();
      if (isSandbox) {
        await dbService.deleteBot(id);
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await hasPermission(user.role, "/dashboard/bots", "delete"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const bot = await dbService.getBotById(id);
    if (!bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }

    // Account isolation guard
    if (user.role !== "super_admin" && bot.accountId !== user.accountId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbService.deleteBot(id);

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
    await logAction(user.email, "DELETE_BOT", "bot", id, ip);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete bot" }, { status: 500 });
  }
}
