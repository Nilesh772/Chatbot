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
    const settings = await dbService.getWidgetSettings(id);
    const bot = await dbService.getBotById(id);

    if (!settings || !bot) {
      return NextResponse.json({ error: "Bot or settings not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...settings,
      botName: bot.name,
      avatarUrl: bot.avatarUrl,
      welcomeMessage: bot.welcomeMessage,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch widget settings" }, { status: 500 });
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
      if (!isSandbox) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else {
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
    }

    const updates = await request.json();
    const { botName, welcomeMessage, avatarUrl, ...widgetUpdates } = updates;

    // Update bot properties
    await dbService.updateBot(id, {
      name: botName,
      welcomeMessage,
      avatarUrl,
    });

    // Update widget settings
    const settings = await dbService.updateWidgetSettings(id, widgetUpdates);

    // Audit settings change if user is logged in
    if (user) {
      const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
      await logAction(user.email, "UPDATE_WIDGET_SETTINGS", "bot", id, ip);
    }

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update widget settings" }, { status: 500 });
  }
}
