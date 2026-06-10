import { dbService } from "./dbService";

export const PERMISSIONS = {
  BOTS_VIEW: "bots:view",
  BOTS_MANAGE: "bots:manage",
  CONVERSATIONS_VIEW: "conversations:view",
  CONVERSATIONS_MANAGE: "conversations:manage",
  LEADS_VIEW: "leads:view",
  LEADS_MANAGE: "leads:manage",
  TEAM_VIEW: "team:view",
  TEAM_MANAGE: "team:manage",
  ANALYTICS_VIEW: "analytics:view",
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export async function hasPermission(
  role: string,
  permissionOrModuleSlug: string,
  actionOrUserPermissions?: "view" | "add" | "edit" | "delete" | string[] | string,
  legacyPermissions?: string[]
): Promise<boolean> {
  // Check if we are running the new signature:
  // hasPermission(role, moduleSlug, action) where action is 'view'|'add'|'edit'|'delete'
  const isNewDynamicSignature = 
    typeof actionOrUserPermissions === "string" &&
    ["view", "add", "edit", "delete"].includes(actionOrUserPermissions);

  if (isNewDynamicSignature) {
    const userRoleName = role;
    const moduleSlug = permissionOrModuleSlug;
    const action = actionOrUserPermissions as "view" | "add" | "edit" | "delete";
    const normalizedRole = userRoleName.toLowerCase();

    // Super Admin bypass
    if (normalizedRole === "super admin" || normalizedRole === "super_admin") {
      return true;
    }

    try {
      const permissionRecord = await dbService.getRolePermission(userRoleName, moduleSlug);
      if (!permissionRecord) {
        return false;
      }

      switch (action) {
        case "view":
          return permissionRecord.canView || false;
        case "add":
          return permissionRecord.canAdd || false;
        case "edit":
          return permissionRecord.canEdit || false;
        case "delete":
          return permissionRecord.canDelete || false;
        default:
          return false;
      }
    } catch (error) {
      console.error("Error checking permissions in hasPermission:", error);
      return false;
    }
  } else {
    // Legacy static signature:
    // hasPermission(role, permission, userPermissions)
    const permission = permissionOrModuleSlug;
    const userPermissions = actionOrUserPermissions as string[] | undefined;
    const normalizedRole = role.toLowerCase();

    if (normalizedRole === "super_admin" || normalizedRole === "admin" || normalizedRole === "super admin" || normalizedRole === "admin") {
      return true;
    }
    if (normalizedRole === "agent") {
      const legacyAgentPermissions = [
        "conversations:view",
        "conversations:manage"
      ];
      return legacyAgentPermissions.includes(permission);
    }
    if (normalizedRole === "staff") {
      return userPermissions?.includes(permission) || false;
    }
    return false;
  }
}

export async function checkPageAccess(
  role: string,
  pathname: string
): Promise<boolean> {
  // Super admin exclusive page - only platform super admin allowed
  if (pathname.startsWith("/dashboard/super-admin")) {
    return role === "super_admin";
  }

  const normalizedRole = role.toLowerCase();
  if (normalizedRole === "super_admin" || normalizedRole === "super admin") {
    return true;
  }

  let moduleSlug = "";
  if (pathname.startsWith("/dashboard/bots")) {
    moduleSlug = "/dashboard/bots";
  } else if (pathname.startsWith("/dashboard/inbox")) {
    moduleSlug = "/dashboard/inbox";
  } else if (pathname.startsWith("/dashboard/team") || pathname.startsWith("/dashboard/agents") || pathname.startsWith("/dashboard/users")) {
    moduleSlug = "/dashboard/users";
  } else if (pathname.startsWith("/dashboard/templates")) {
    moduleSlug = "/dashboard/templates";
  } else if (pathname.startsWith("/dashboard/leads")) {
    moduleSlug = "/dashboard/leads";
  } else if (pathname.startsWith("/dashboard/analytics")) {
    moduleSlug = "/dashboard/analytics";
  } else if (pathname.startsWith("/dashboard/billing")) {
    moduleSlug = "/dashboard/billing";
  } else if (pathname.startsWith("/dashboard/settings")) {
    moduleSlug = "/dashboard/settings";
  } else if (pathname.startsWith("/dashboard/roles")) {
    moduleSlug = "/dashboard/roles";
  } else if (pathname.startsWith("/dashboard/permissions")) {
    moduleSlug = "/dashboard/permissions";
  } else if (pathname === "/dashboard") {
    // Default dashboard page: allow if they have view access to at least one module
    try {
      const activeModules = await dbService.getModules();
      for (const mod of activeModules) {
        if (await hasPermission(role, mod.slug, "view")) {
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  } else {
    // Other pages under dashboard
    return true;
  }

  return await hasPermission(role, moduleSlug, "view");
}
