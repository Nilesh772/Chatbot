import { NextResponse } from "next/server";
import { dbService } from "@/lib/dbService";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { logAction } from "@/lib/auditLog";

async function isAgentAllowed(userId: string, accountId: string, conversation: any) {
  if (conversation.assignedAgentId === userId) return true;

  let collaboratorIds: string[] = [];
  if (conversation.collaboratorIds) {
    try {
      if (typeof conversation.collaboratorIds === "string") {
        collaboratorIds = JSON.parse(conversation.collaboratorIds);
      } else if (Array.isArray(conversation.collaboratorIds)) {
        collaboratorIds = conversation.collaboratorIds;
      }
    } catch (e) {}
  }
  if (collaboratorIds.includes(userId)) return true;

  // Department match
  const agentMember = await dbService.getTeamMemberById(userId);
  const agentDeptId = agentMember?.departmentId;
  const depts = await dbService.getDepartments(accountId || "acc-super-admin");
  const generalSupportDept = depts.find(d => d.name.toLowerCase() === "general support");
  const generalSupportDeptId = generalSupportDept?.id;

  const isAgentGeneral = !agentDeptId || agentDeptId === generalSupportDeptId;
  if (isAgentGeneral) {
    return !conversation.departmentId || conversation.departmentId === generalSupportDeptId;
  } else {
    return conversation.departmentId === agentDeptId;
  }
}

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
        const conversation = await dbService.getConversation(id);
        if (!conversation) return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });
        return NextResponse.json({ success: true, conversation });
      }
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!(await hasPermission(user.role, "/dashboard/inbox", "view"))) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const conversation = await dbService.getConversation(id);
    if (!conversation) {
      return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });
    }

    // Account isolation guard
    if (user.role !== "super_admin" && conversation.accountId !== user.accountId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Agent assignment isolation
    if (user.role === "agent") {
      const allowed = await isAgentAllowed(user.id, user.accountId, conversation);
      if (!allowed) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json({ success: true, conversation });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch conversation" }, { status: 500 });
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
        const body = await request.json();
        const updated = await dbService.updateConversation(id, body);
        return NextResponse.json({ success: true, conversation: updated });
      }
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!(await hasPermission(user.role, "/dashboard/inbox", "edit"))) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const conversation = await dbService.getConversation(id);
    if (!conversation) {
      return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });
    }

    // Account isolation guard
    if (user.role !== "super_admin" && conversation.accountId !== user.accountId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Agent assignment/department/collaboration checks
    if (user.role === "agent") {
      const allowed = await isAgentAllowed(user.id, user.accountId, conversation);
      if (!allowed) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }
    }

    const body = await request.json();
    const { action, ...updates } = body;

    // Guard: Prevent hijacking a chat that is already accepted by another agent
    if (updates.status === "active" && updates.assignedAgentId) {
      if (conversation.status !== "closed" && conversation.assignedAgentId && conversation.assignedAgentId !== updates.assignedAgentId) {
        return NextResponse.json({
          success: false,
          error: "This chat has already been accepted by another agent."
        }, { status: 400 });
      }
    }

    let collaboratorIds: string[] = [];
    if (conversation.collaboratorIds) {
      try {
        if (typeof conversation.collaboratorIds === "string") {
          collaboratorIds = JSON.parse(conversation.collaboratorIds);
        } else if (Array.isArray(conversation.collaboratorIds)) {
          collaboratorIds = conversation.collaboratorIds;
        }
      } catch (e) {}
    }

    let updatedCollaborators = [...collaboratorIds];
    let assignedAgentIdUpdate = updates.assignedAgentId;
    let statusUpdate = updates.status;

    if (action === "join") {
      if (!updatedCollaborators.includes(user.id)) {
        updatedCollaborators.push(user.id);
      }
      if (!conversation.assignedAgentId) {
        assignedAgentIdUpdate = user.id;
      }
      statusUpdate = "active";
    } else if (action === "leave") {
      updatedCollaborators = updatedCollaborators.filter(uid => uid !== user.id);
      if (conversation.assignedAgentId === user.id) {
        assignedAgentIdUpdate = updatedCollaborators.length > 0 ? updatedCollaborators[0] : null;
        if (updatedCollaborators.length === 0) {
          statusUpdate = "waiting_agent";
        }
      }
    }

    const finalUpdates: any = { ...updates };
    finalUpdates.collaboratorIds = updatedCollaborators;
    if (assignedAgentIdUpdate !== undefined) {
      finalUpdates.assignedAgentId = assignedAgentIdUpdate;
    }
    if (statusUpdate !== undefined) {
      finalUpdates.status = statusUpdate;
    }

    const updated = await dbService.updateConversation(id, finalUpdates);

    if (finalUpdates.assignedAgentId === user.id && conversation.assignedAgentId !== user.id) {
      const statusUpdates = { agentStatus: "busy" };
      const updatedMember = await dbService.updateTeamMember(user.id, statusUpdates);
      if (!updatedMember && user.role === "agent") {
        await dbService.updateAgent(user.id, statusUpdates);
      }
    } else if (action === "leave" && conversation.assignedAgentId === user.id) {
      const statusUpdates = { agentStatus: "online" };
      const updatedMember = await dbService.updateTeamMember(user.id, statusUpdates);
      if (!updatedMember && user.role === "agent") {
        await dbService.updateAgent(user.id, statusUpdates);
      }
    }

    // Write system event messages
    if (action === "join") {
      await dbService.addMessage(id, "bot", "Agent Support joined the chat", { systemEvent: true });
    } else if (action === "leave") {
      await dbService.addMessage(id, "bot", "Agent Support left the chat", { systemEvent: true });
    }

    if (finalUpdates.status && finalUpdates.status !== conversation.status) {
      if (finalUpdates.status === "active" && action !== "join") {
        await dbService.addMessage(id, "bot", "Agent Support joined the chat", { systemEvent: true });
      } else if (finalUpdates.status === "closed") {
        await dbService.addMessage(id, "bot", "Conversation closed", { systemEvent: true });
      }
    }

    if (finalUpdates.assignedAgentId !== undefined && finalUpdates.assignedAgentId !== conversation.assignedAgentId) {
      if (finalUpdates.assignedAgentId) {
        await dbService.addMessage(id, "bot", "Conversation transferred to Agent Support", { systemEvent: true });
      }
    }

    if (finalUpdates.departmentId && finalUpdates.departmentId !== conversation.departmentId) {
      const depts = await dbService.getDepartments(user.accountId || "acc-super-admin");
      const targetDept = depts.find(d => d.id === finalUpdates.departmentId);
      const deptName = targetDept?.name || "another department";
      await dbService.addMessage(id, "bot", `Conversation transferred to ${deptName}`, { systemEvent: true });
    } else if (body.department && body.department !== conversation.department) {
      // legacy support
      await dbService.addMessage(id, "bot", `Conversation transferred to ${body.department}`, { systemEvent: true });
    }

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
    await logAction(user.email, "UPDATE_CONVERSATION", "conversation", id, ip);

    return NextResponse.json({ success: true, conversation: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to update conversation" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
      const isSandbox = await dbService.isSandboxMode();
      if (isSandbox) {
        const { sender, text, payload } = await request.json();
        const message = await dbService.addMessage(id, sender || "agent", text, payload);
        return NextResponse.json({ success: true, message });
      }
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!(await hasPermission(user.role, "/dashboard/inbox", "add"))) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const conversation = await dbService.getConversation(id);
    if (!conversation) {
      return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });
    }

    // Account isolation guard
    if (user.role !== "super_admin" && conversation.accountId !== user.accountId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Agent assignment/department/collaboration checks
    if (user.role === "agent") {
      const allowed = await isAgentAllowed(user.id, user.accountId, conversation);
      if (!allowed) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }
    }

    const { sender, text, payload } = await request.json();

    if (!text) {
      return NextResponse.json({ success: false, error: "Message text is required" }, { status: 400 });
    }

    const message = await dbService.addMessage(id, sender || "agent", text, payload);
    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to send message" }, { status: 500 });
  }
}
