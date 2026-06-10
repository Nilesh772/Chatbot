import { NextResponse } from "next/server";
import { dbService } from "@/lib/dbService";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentName = searchParams.get("department") || "General Support";

    const user = await getCurrentUser();
    const accountId = user?.accountId || "acc-super-admin";

    const result = await dbService.getDepartmentAgents(accountId, departmentName);

    return NextResponse.json({
      success: true,
      department: departmentName,
      total: result.total,
      online: result.online,
      agents: result.agents.map((a: any) => ({
        id: a.id,
        name: a.name,
        agentStatus: a.agentStatus,
        department: a.department || null
      }))
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch department agents" },
      { status: 500 }
    );
  }
}
