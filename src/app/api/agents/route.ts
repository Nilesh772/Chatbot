import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { dbService } from "@/lib/dbService";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { logAction } from "@/lib/auditLog";
import { isUniqueConstraintError } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      const isSandbox = await dbService.isSandboxMode();
      if (isSandbox) {
        const agents = await dbService.getAgents("acc-super-admin");
        return NextResponse.json({ success: true, agents });
      }
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!(await hasPermission(user.role, "/dashboard/users", "view")) && !(await hasPermission(user.role, "/dashboard/inbox", "view"))) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const agents = await dbService.getAgents(user.accountId || "acc-super-admin");
    return NextResponse.json({ success: true, agents });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch agents" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      const isSandbox = await dbService.isSandboxMode();
      if (isSandbox) {
        const { name, email, password, department } = await request.json();
        const agent = await dbService.createAgent("acc-super-admin", name, email, password, department);
        return NextResponse.json({ success: true, agent });
      }
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!(await hasPermission(user.role, "/dashboard/users", "add"))) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { name, email, password, department } = await request.json();

    if (!name || !email) {
      return NextResponse.json({ success: false, error: "Name and email are required" }, { status: 400 });
    }

    const accountId = user.accountId || "acc-super-admin";
    try {
      const agent = await dbService.createAgent(accountId, name, email, password, department);
      
      const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
      await logAction(user.email, "CREATE_AGENT", "team_member", agent.id, ip);

      return NextResponse.json({ success: true, agent });
    } catch (dbErr: any) {
      if (isUniqueConstraintError(dbErr)) {
        return NextResponse.json({ success: false, error: "An agent with this email address already exists." }, { status: 400 });
      }
      throw dbErr;
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to create agent" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      const isSandbox = await dbService.isSandboxMode();
      if (isSandbox) {
        const { id, name, email, password, department } = await request.json();
        const updated = await dbService.updateAgent(id, { name, email, password, department });
        return NextResponse.json({ success: true, agent: updated });
      }
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!(await hasPermission(user.role, "/dashboard/users", "edit"))) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { id, name, email, password, department } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, error: "Agent ID is required" }, { status: 400 });
    }

    const existingAgent = await dbService.getAgentById(id);
    if (!existingAgent || (user.role !== "super_admin" && existingAgent.accountId !== user.accountId)) {
      return NextResponse.json({ success: false, error: "Agent not found or unauthorized" }, { status: 404 });
    }

    try {
      const updated = await dbService.updateAgent(id, { name, email, password, department });

      const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
      await logAction(user.email, "UPDATE_AGENT", "team_member", id, ip);

      return NextResponse.json({ success: true, agent: updated });
    } catch (dbErr: any) {
      if (isUniqueConstraintError(dbErr)) {
        return NextResponse.json({ success: false, error: "An agent with this email address already exists." }, { status: 400 });
      }
      throw dbErr;
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to update agent" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      const isSandbox = await dbService.isSandboxMode();
      if (isSandbox) {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        if (id) await dbService.deleteAgent(id);
        return NextResponse.json({ success: true, message: "Agent deleted successfully" });
      }
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!(await hasPermission(user.role, "/dashboard/users", "delete"))) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Agent ID is required" }, { status: 400 });
    }

    const existingAgent = await dbService.getAgentById(id);
    if (!existingAgent || (user.role !== "super_admin" && existingAgent.accountId !== user.accountId)) {
      return NextResponse.json({ success: false, error: "Agent not found or unauthorized" }, { status: 404 });
    }

    await dbService.deleteAgent(id);

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
    await logAction(user.email, "DELETE_AGENT", "team_member", id, ip);

    return NextResponse.json({ success: true, message: "Agent deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to delete agent" }, { status: 500 });
  }
}
