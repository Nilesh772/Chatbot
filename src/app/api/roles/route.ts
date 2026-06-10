import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { dbService } from "@/lib/dbService";
import { hasPermission } from "@/lib/permissions";
import { logAction } from "@/lib/auditLog";
import { isUniqueConstraintError } from "@/lib/db";

// Auth validation helper
async function checkRoleAdminAuth(action: "view" | "add" | "edit" | "delete", moduleSlug: string = "/dashboard/roles") {
  const user = await getCurrentUser();
  if (!user) {
    const isSandbox = await dbService.isSandboxMode();
    if (!isSandbox) {
      return { authenticated: false, forbidden: false, user: null };
    }
    return { authenticated: true, forbidden: false, user: null };
  }
  const allowed = await hasPermission(user.role, moduleSlug, action);
  if (!allowed) {
    return { authenticated: true, forbidden: true, user };
  }
  return { authenticated: true, forbidden: false, user };
}

// GET: List all roles OR get permissions for a role if roleId query param is provided
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get("roleId");

    const targetModule = roleId ? "/dashboard/permissions" : "/dashboard/roles";
    const { authenticated, forbidden } = await checkRoleAdminAuth("view", targetModule);
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (forbidden) {
      return NextResponse.json({ error: "Forbidden: Insufficient Permissions" }, { status: 403 });
    }

    if (roleId) {
      const permissions = await dbService.getRolePermissions(roleId);
      return NextResponse.json({ success: true, permissions });
    }

    const roles = await dbService.getRoles();
    return NextResponse.json({ success: true, roles });
  } catch (error: any) {
    console.error("API error fetching roles:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch roles" },
      { status: 500 }
    );
  }
}

// POST: Create a new role
export async function POST(request: Request) {
  try {
    const { authenticated, forbidden, user } = await checkRoleAdminAuth("add", "/dashboard/roles");
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (forbidden) {
      return NextResponse.json({ error: "Forbidden: Insufficient Permissions" }, { status: 403 });
    }

    const { name, description, permissions } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 });
    }

    // Call transactional create in dbService
    const role = await dbService.createRole(name, description, permissions);

    // Audit log
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
    await logAction(
      user?.email || "sandbox@chatbot.com",
      "CREATE_ROLE",
      "role",
      role.id,
      ip
    );

    return NextResponse.json({ success: true, role });
  } catch (error: any) {
    console.error("API error creating role:", error);
    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        { error: "A role with this name already exists." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to create role" },
      { status: 500 }
    );
  }
}

// PUT: Update an existing role
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, description, permissions } = body;

    if (!id || !name) {
      return NextResponse.json({ error: "ID and role name are required" }, { status: 400 });
    }

    const targetModule = permissions ? "/dashboard/permissions" : "/dashboard/roles";
    const { authenticated, forbidden, user } = await checkRoleAdminAuth("edit", targetModule);
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (forbidden) {
      return NextResponse.json({ error: "Forbidden: Insufficient Permissions" }, { status: 403 });
    }

    // Update role details
    const role = await dbService.updateRole(id, name, description);

    // Update permissions if provided
    if (permissions) {
      await dbService.updateRolePermissions(id, permissions);
    }

    // Audit log
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
    await logAction(
      user?.email || "sandbox@chatbot.com",
      "UPDATE_ROLE",
      "role",
      id,
      ip
    );

    return NextResponse.json({ success: true, role });
  } catch (error: any) {
    console.error("API error updating role:", error);
    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        { error: "Another role with this name already exists." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to update role" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a role
export async function DELETE(request: Request) {
  try {
    const { authenticated, forbidden, user } = await checkRoleAdminAuth("delete", "/dashboard/roles");
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (forbidden) {
      return NextResponse.json({ error: "Forbidden: Insufficient Permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await dbService.deleteRole(id);

    // Audit log
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
    await logAction(
      user?.email || "sandbox@chatbot.com",
      "DELETE_ROLE",
      "role",
      id,
      ip
    );

    return NextResponse.json({ success: true, message: "Role deleted successfully" });
  } catch (error: any) {
    console.error("API error deleting role:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete role" },
      { status: 500 }
    );
  }
}
