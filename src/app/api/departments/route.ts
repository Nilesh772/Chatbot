import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { dbService } from "@/lib/dbService";
import { hasPermission } from "@/lib/permissions";
import { logAction } from "@/lib/auditLog";
import { isUniqueConstraintError } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      const isSandbox = await dbService.isSandboxMode();
      if (isSandbox) {
        const departments = await dbService.getDepartments("acc-super-admin");
        const agents = await dbService.getAgents("acc-super-admin");
        return NextResponse.json({ success: true, departments, agents });
      }
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!(await hasPermission(user.role, "/dashboard/departments", "view"))) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const accountId = user.accountId || "acc-super-admin";
    const departments = await dbService.getDepartments(accountId);
    const agents = await dbService.getAgents(accountId);

    return NextResponse.json({ success: true, departments, agents });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch departments" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    
    // Sandbox handling
    if (!user) {
      const isSandbox = await dbService.isSandboxMode();
      if (isSandbox) {
        const { name } = await request.json();
        if (!name) {
          return NextResponse.json({ success: false, error: "Department name is required" }, { status: 400 });
        }
        const department = await dbService.createDepartment("acc-super-admin", name);
        return NextResponse.json({ success: true, department });
      }
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!(await hasPermission(user.role, "/dashboard/departments", "add"))) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { name } = await request.json();
    if (!name) {
      return NextResponse.json({ success: false, error: "Department name is required" }, { status: 400 });
    }

    const accountId = user.accountId || "acc-super-admin";
    try {
      const department = await dbService.createDepartment(accountId, name);
      
      const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
      await logAction(user.email, "CREATE_DEPARTMENT", "department", department.id, ip);

      return NextResponse.json({ success: true, department });
    } catch (dbErr: any) {
      if (isUniqueConstraintError(dbErr)) {
        return NextResponse.json({ success: false, error: "A department with this name already exists." }, { status: 400 });
      }
      throw dbErr;
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create department" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    
    // Sandbox handling
    if (!user) {
      const isSandbox = await dbService.isSandboxMode();
      if (isSandbox) {
        const { id, name, agentIds } = await request.json();
        if (!id) {
          return NextResponse.json({ success: false, error: "Department ID is required" }, { status: 400 });
        }
        if (name) {
          await dbService.updateDepartment("acc-super-admin", id, name);
        }
        if (agentIds) {
          await dbService.assignAgentsToDepartment("acc-super-admin", id, agentIds);
        }
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!(await hasPermission(user.role, "/dashboard/departments", "edit"))) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { id, name, agentIds } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, error: "Department ID is required" }, { status: 400 });
    }

    const accountId = user.accountId || "acc-super-admin";
    
    if (name) {
      try {
        await dbService.updateDepartment(accountId, id, name);
      } catch (dbErr: any) {
        if (isUniqueConstraintError(dbErr)) {
          return NextResponse.json({ success: false, error: "A department with this name already exists." }, { status: 400 });
        }
        throw dbErr;
      }
    }

    if (agentIds) {
      await dbService.assignAgentsToDepartment(accountId, id, agentIds);
    }

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
    await logAction(user.email, "UPDATE_DEPARTMENT", "department", id, ip);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update department" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Department ID is required" }, { status: 400 });
    }

    // Sandbox handling
    if (!user) {
      const isSandbox = await dbService.isSandboxMode();
      if (isSandbox) {
        await dbService.deleteDepartment("acc-super-admin", id);
        return NextResponse.json({ success: true, message: "Department deleted successfully" });
      }
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!(await hasPermission(user.role, "/dashboard/departments", "delete"))) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const accountId = user.accountId || "acc-super-admin";
    await dbService.deleteDepartment(accountId, id);

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
    await logAction(user.email, "DELETE_DEPARTMENT", "department", id, ip);

    return NextResponse.json({ success: true, message: "Department deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete department" },
      { status: 500 }
    );
  }
}
