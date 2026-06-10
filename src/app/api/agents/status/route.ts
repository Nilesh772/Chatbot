import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { dbService } from "@/lib/dbService";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      const isSandbox = await dbService.isSandboxMode();
      if (isSandbox) {
        // Fallback for sandbox superadmin
        return NextResponse.json({ success: true, agentStatus: "online", schedule: null });
      }
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const member = await dbService.getTeamMemberById(user.id);
    if (!member) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      agentStatus: (member as any).agentStatus || "offline",
      schedule: (member as any).schedule || null
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch status" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    
    // Sandbox handling without user session
    if (!user) {
      const isSandbox = await dbService.isSandboxMode();
      if (isSandbox) {
        const { agentStatus, schedule } = await request.json();
        // Just mock success
        return NextResponse.json({ success: true, agentStatus, schedule });
      }
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { agentStatus, schedule } = await request.json();
    
    // We can update using updateTeamMember which maps fields
    const updates: any = {};
    if (agentStatus !== undefined) updates.agentStatus = agentStatus;
    if (schedule !== undefined) updates.schedule = schedule;

    const updated = await dbService.updateTeamMember(user.id, updates);
    if (!updated && user.role === "agent") {
      // Try updateAgent directly
      await dbService.updateAgent(user.id, updates);
    }

    return NextResponse.json({ success: true, agentStatus, schedule });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to update status" }, { status: 500 });
  }
}
