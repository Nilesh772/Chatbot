import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { dbService } from "@/lib/dbService";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { logAction } from "@/lib/auditLog";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      const isSandbox = await dbService.isSandboxMode();
      if (isSandbox) {
        const bots = await dbService.getBots("acc-super-admin");
        return NextResponse.json({ bots });
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowed = await hasPermission(user.role, "/dashboard/bots", "view") || 
                    await hasPermission(user.role, "/dashboard/inbox", "view");
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const bots = await dbService.getBots(user.accountId || "acc-super-admin");
    return NextResponse.json({ bots });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch bots" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      const isSandbox = await dbService.isSandboxMode();
      if (isSandbox) {
        const { name, avatarUrl, welcomeMessage } = await request.json();
        const bot = await dbService.createBot("acc-super-admin", name, avatarUrl, welcomeMessage, "usr-admin");
        return NextResponse.json({ success: true, bot });
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowed = await hasPermission(user.role, "/dashboard/bots", "add");
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, avatarUrl, welcomeMessage, template } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Bot name is required" }, { status: 400 });
    }

    const accountId = user.accountId || "acc-super-admin";
    const bot = await dbService.createBot(accountId, name, avatarUrl, welcomeMessage, user.id);

    // If template was selected, apply it immediately
    if (template && template !== "scratch") {
      const flow = await dbService.getFlowByBotId(bot.id);
      if (flow) {
        await dbService.applyFlowTemplate(flow.id, template);
      }
    }

    // Audit Log
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
    await logAction(user.email, "CREATE_BOT", "bot", bot.id, ip);

    return NextResponse.json({ success: true, bot });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create bot" }, { status: 500 });
  }
}
