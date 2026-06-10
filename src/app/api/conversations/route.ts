import { NextResponse } from "next/server";
import { dbService } from "@/lib/dbService";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const botId = searchParams.get("botId") || undefined;

    const user = await getCurrentUser();
    if (!user) {
      const isSandbox = await dbService.isSandboxMode();
      if (isSandbox) {
        const conversations = await dbService.getConversations("acc-super-admin", botId);
        return NextResponse.json({ success: true, conversations });
      }
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!(await hasPermission(user.role, "/dashboard/inbox", "view"))) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const accountId = user.accountId || "acc-super-admin";
    let conversations = await dbService.getConversations(accountId, botId);

    if (user.role.toLowerCase() === "agent" || user.role === "Agent") {
      const agentMember = await dbService.getTeamMemberById(user.id);
      const agentDeptId = agentMember?.departmentId;

      const depts = await dbService.getDepartments(accountId);
      const generalSupportDept = depts.find(d => d.name.toLowerCase() === "general support");
      const generalSupportDeptId = generalSupportDept?.id;

      conversations = conversations.filter((c: any) => {
        // Always show if assigned to this agent
        if (c.assignedAgentId === user.id) return true;

        // Show if collaborator
        let collaboratorIds: string[] = [];
        if (c.collaboratorIds) {
          try {
            if (typeof c.collaboratorIds === "string") {
              collaboratorIds = JSON.parse(c.collaboratorIds);
            } else if (Array.isArray(c.collaboratorIds)) {
              collaboratorIds = c.collaboratorIds;
            }
          } catch (e) {}
        }
        if (collaboratorIds.includes(user.id)) return true;

        // Only show unassigned conversations if they are waiting for an agent or closed
        if (c.status !== "waiting_agent" && c.status !== "closed") return false;

        // Route based on agent's department
        const isAgentGeneral = !agentDeptId || agentDeptId === generalSupportDeptId;
        if (isAgentGeneral) {
          return !c.departmentId || c.departmentId === generalSupportDeptId;
        } else {
          return c.departmentId === agentDeptId;
        }
      });
    }

    return NextResponse.json({ success: true, conversations });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}
