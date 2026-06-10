import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { dbService } from "@/lib/dbService";
import { hasPermission } from "@/lib/permissions";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      // Fallback for local sandbox if no session is active
      const isSandbox = await dbService.isSandboxMode();
      if (isSandbox) {
        const allModules = await dbService.getModules();
        const modulesWithPerms = allModules.map(mod => ({
          ...mod,
          permissions: { view: true, add: true, edit: true, delete: true }
        }));
        return NextResponse.json({ modules: modulesWithPerms });
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allModules = await dbService.getModules();
    const isSuperAdmin = user.role.toLowerCase() === "super_admin" || user.role.toLowerCase() === "super admin";
    
    const allowedModules = [];
    for (const mod of allModules) {
      if (isSuperAdmin) {
        allowedModules.push({
          ...mod,
          permissions: { view: true, add: true, edit: true, delete: true }
        });
      } else {
        const perm = await dbService.getRolePermission(user.role, mod.slug);
        if (perm && perm.canView) {
          allowedModules.push({
            ...mod,
            permissions: {
              view: perm.canView || false,
              add: perm.canAdd || false,
              edit: perm.canEdit || false,
              delete: perm.canDelete || false
            }
          });
        }
      }
    }

    return NextResponse.json({ modules: allowedModules });
  } catch (error: any) {
    console.error("API error fetching modules:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch modules" }, { status: 500 });
  }
}
