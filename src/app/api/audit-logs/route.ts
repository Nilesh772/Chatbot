import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { dbService } from "@/lib/dbService";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Only allow admin, staff, or super_admin to view logs
    if (user.role === "agent") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // If super admin, fetch all logs. Otherwise, scope by their accountId.
    const accountId = user.role === "super_admin" ? undefined : (user.accountId || "acc-super-admin");
    const logs = await dbService.getAuditLogs(accountId);

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch audit logs" }, { status: 500 });
  }
}
