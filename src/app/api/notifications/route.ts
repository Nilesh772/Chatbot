import { NextResponse } from "next/server";
import { dbService } from "@/lib/dbService";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      // In sandbox mode without a logged-in user, we can fall back to acc-super-admin
      const isSandbox = await dbService.isSandboxMode();
      if (isSandbox) {
        const conversations = await dbService.getConversations("acc-super-admin");
        const notifications = getNotificationsFromConversations(conversations, {
          id: "usr-admin",
          role: "super_admin",
          accountId: "acc-super-admin",
          name: "Admin User",
          email: "admin@chatbot.com",
          permissions: [],
          department: null,
          departmentId: null
        });
        return NextResponse.json({ success: true, notifications });
      }
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const accountId = user.accountId || "acc-super-admin";
    let conversations = await dbService.getConversations(accountId);

    // Apply exact visibility filtering based on roles (same logic as conversations route)
    if (user.role.toLowerCase() === "agent" || user.role === "Agent") {
      const agentMember = await dbService.getTeamMemberById(user.id);
      const agentDeptId = agentMember?.departmentId;
      const depts = await dbService.getDepartments(accountId);
      const generalSupportDept = depts.find(d => d.name.toLowerCase() === "general support");
      const generalSupportDeptId = generalSupportDept?.id;

      conversations = conversations.filter((c: any) => {
        if (c.assignedAgentId === user.id) return true;

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

        if (c.status !== "waiting_agent") return false;

        const isAgentGeneral = !agentDeptId || agentDeptId === generalSupportDeptId;
        if (isAgentGeneral) {
          return !c.departmentId || c.departmentId === generalSupportDeptId;
        } else {
          return c.departmentId === agentDeptId;
        }
      });
    }

    const notifications = getNotificationsFromConversations(conversations, user);
    return NextResponse.json({ success: true, notifications });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

function getNotificationsFromConversations(conversations: any[], user: any) {
  const notifications: any[] = [];
  const isAdmin =
    user.role.toLowerCase() === "admin" ||
    user.role.toLowerCase() === "super_admin" ||
    user.role.toLowerCase() === "super admin";

  for (const c of conversations) {
    const lastMessage = c.messages?.[0];

    // Case 1: Unassigned chat waiting for agent (new connection request)
    if (c.status === "waiting_agent" && !c.assignedAgentId) {
      const deptLabel = c.department ? ` · ${c.department}` : "";
      notifications.push({
        id: `wait-${c.id}-${c.updatedAt || c.createdAt}`,
        conversationId: c.id,
        type: "new_chat",
        title: `New Chat Request${deptLabel}`,
        message: `${c.visitorName || "Anonymous Visitor"} is waiting for an agent. Click to accept.`,
        department: c.department || "General Support",
        createdAt: c.updatedAt || c.createdAt,
        link: `/dashboard/inbox?convId=${c.id}`
      });
    }

    // Case 2: Chat assigned to current agent
    if (c.status === "active" && c.assignedAgentId === user.id) {
      if (lastMessage && lastMessage.sender === "user") {
        notifications.push({
          id: `reply-${c.id}-${lastMessage.id || lastMessage.createdAt}`,
          conversationId: c.id,
          type: "new_message",
          title: `Reply from ${c.visitorName || "Visitor"}`,
          message: lastMessage.text,
          createdAt: lastMessage.createdAt,
          link: `/dashboard/inbox?convId=${c.id}`
        });
      } else {
        notifications.push({
          id: `assign-${c.id}-${c.updatedAt || c.createdAt}`,
          conversationId: c.id,
          type: "assigned",
          title: "Chat Assigned",
          message: `You are assigned to chat with ${c.visitorName || "Visitor"}.`,
          createdAt: c.updatedAt || c.createdAt,
          link: `/dashboard/inbox?convId=${c.id}`
        });
      }
    }

    // Case 3: Admin notifications for any reply in any active chat
    if (isAdmin && c.status === "active" && c.assignedAgentId !== user.id) {
      if (lastMessage && lastMessage.sender === "user") {
        notifications.push({
          id: `reply-admin-${c.id}-${lastMessage.id || lastMessage.createdAt}`,
          conversationId: c.id,
          type: "new_message",
          title: `Reply: ${c.visitorName || "Visitor"}`,
          message: lastMessage.text,
          createdAt: lastMessage.createdAt,
          link: `/dashboard/inbox?convId=${c.id}`
        });
      }
    }
  }

  // Sort by latest update and return up to 20 notifications
  notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return notifications.slice(0, 20);
}
