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
        const leads = await dbService.getLeads("acc-super-admin", id);
        return NextResponse.json({ leads });
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await hasPermission(user.role, "/dashboard/leads", "view"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const bot = await dbService.getBotById(id);
    if (!bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }

    if (user.role !== "super_admin" && bot.accountId !== user.accountId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const leads = await dbService.getLeads(user.accountId || "acc-super-admin", id);
    return NextResponse.json({ leads });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch leads" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const bot = await dbService.getBotById(id);
    if (!bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }

    const lead = await dbService.createLead(bot.accountId, id, body);

    // Audit lead creation/conversion
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
    await logAction(lead.email || "visitor@anonymous.com", "CONVERT_LEAD", "lead", lead.id, ip);

    return NextResponse.json({ success: true, lead });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to save lead" }, { status: 500 });
  }
}
