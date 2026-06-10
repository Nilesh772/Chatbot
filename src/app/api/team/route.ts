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
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!(await hasPermission(user.role, "/dashboard/users", "view"))) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const members = await dbService.getTeamMembers(user.accountId || "acc-super-admin");
    return NextResponse.json({ success: true, team: members });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch team members" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!(await hasPermission(user.role, "/dashboard/users", "add"))) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const data = await request.json();
    const { name, email, password, role, permissions, department, schedule } = data;

    if (!name || !email || !role) {
      return NextResponse.json({ success: false, error: "Name, email and role are required" }, { status: 400 });
    }

    const accountId = user.accountId || "acc-super-admin";
    try {
      const member = await dbService.createTeamMember(accountId, {
        name,
        email,
        password,
        role,
        permissions: permissions || [],
        department: department || null,
        status: "active",
        schedule: schedule || null
      });

      const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
      await logAction(user.email, `CREATE_TEAM_MEMBER`, "team_member", member?.id, ip);

      return NextResponse.json({ success: true, member });
    } catch (dbErr: any) {
      if (isUniqueConstraintError(dbErr)) {
        return NextResponse.json({ success: false, error: "A team member with this email already exists." }, { status: 400 });
      }
      throw dbErr;
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to create team member" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!(await hasPermission(user.role, "/dashboard/users", "edit"))) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const data = await request.json();
    const { id, name, email, password, role, permissions, department, status, schedule } = data;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });
    }

    const existingMember = await dbService.getTeamMemberById(id);
    if (!existingMember || (user.role !== "super_admin" && existingMember.accountId !== user.accountId)) {
      return NextResponse.json({ success: false, error: "Team member not found or unauthorized" }, { status: 404 });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (password !== undefined && password !== "") updates.password = password;
    if (role !== undefined) updates.role = role;
    if (permissions !== undefined) updates.permissions = permissions;
    if (department !== undefined) updates.department = department;
    if (status !== undefined) updates.status = status;
    if (schedule !== undefined) updates.schedule = schedule;

    try {
      const updated = await dbService.updateTeamMember(id, updates);

      const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
      await logAction(user.email, `UPDATE_TEAM_MEMBER`, "team_member", id, ip);

      return NextResponse.json({ success: true, member: updated });
    } catch (dbErr: any) {
      if (isUniqueConstraintError(dbErr)) {
        return NextResponse.json({ success: false, error: "A team member with this email already exists." }, { status: 400 });
      }
      throw dbErr;
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to update team member" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!(await hasPermission(user.role, "/dashboard/users", "delete"))) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });
    }

    const existingMember = await dbService.getTeamMemberById(id);
    if (!existingMember || (user.role !== "super_admin" && existingMember.accountId !== user.accountId)) {
      return NextResponse.json({ success: false, error: "Team member not found or unauthorized" }, { status: 404 });
    }

    // Protect account owner from deletion if deleting themselves, or add safety checks
    if (id === user.id) {
      return NextResponse.json({ success: false, error: "You cannot delete yourself." }, { status: 400 });
    }

    await dbService.deleteTeamMember(id);

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
    await logAction(user.email, `DELETE_TEAM_MEMBER`, "team_member", id, ip);

    return NextResponse.json({ success: true, message: "Team member removed successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to delete team member" }, { status: 500 });
  }
}
