"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { KeyRound, Save, CheckCircle, AlertTriangle, Shield, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

function PermissionsForm() {
  const { hasPagePermission, loadingModules } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialRoleId = searchParams.get("roleId") || "";

  const [roles, setRoles] = useState<any[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState(initialRoleId);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [matrix, setMatrix] = useState<Record<string, { view: boolean; add: boolean; edit: boolean; delete: boolean }>>({});

  // Fetch all roles & modules on startup
  useEffect(() => {
    async function loadData() {
      try {
        const [rolesRes, modulesRes] = await Promise.all([
          fetch("/api/roles"),
          fetch("/api/modules")
        ]);
        
        const rolesData = await rolesRes.json();
        const modulesData = await modulesRes.json();

        if (rolesData.success) {
          setRoles(rolesData.roles || []);
          // If no initial roleId is selected from search params, default to first role
          if (!initialRoleId && rolesData.roles && rolesData.roles.length > 0) {
            setSelectedRoleId(rolesData.roles[0].id);
          }
        }
        
        if (modulesData.modules) {
          setModules(modulesData.modules);
        }
      } catch (err) {
        console.error("Failed to load roles or modules:", err);
        setError("Failed to load configuration data.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [initialRoleId]);

  // Fetch permissions when selectedRoleId changes
  useEffect(() => {
    if (!selectedRoleId || modules.length === 0) return;

    async function loadPermissions() {
      try {
        setError(null);
        setSuccess(null);
        
        const res = await fetch(`/api/roles?roleId=${selectedRoleId}`);
        const data = await res.json();
        
        const initialMatrix: typeof matrix = {};
        modules.forEach((mod: any) => {
          initialMatrix[mod.id] = {
            view: false,
            add: false,
            edit: false,
            delete: false
          };
        });

        if (data.success && data.permissions) {
          data.permissions.forEach((perm: any) => {
            if (initialMatrix[perm.moduleId]) {
              initialMatrix[perm.moduleId] = {
                view: perm.canView || false,
                add: perm.canAdd || false,
                edit: perm.canEdit || false,
                delete: perm.canDelete || false
              };
            }
          });
        }
        
        setMatrix(initialMatrix);
      } catch (err) {
        console.error("Failed to load permissions for role:", err);
        setError("Failed to load permissions for selected role.");
      }
    }
    loadPermissions();
  }, [selectedRoleId, modules]);

  const handleCheckboxChange = (
    moduleId: string,
    action: "view" | "add" | "edit" | "delete",
    checked: boolean
  ) => {
    setMatrix((prev) => {
      const updatedModule = { ...prev[moduleId], [action]: checked };

      // Implicit permissions logic:
      // 1. If checking add, edit, or delete, auto-check view
      if (checked && action !== "view") {
        updatedModule.view = true;
      }
      // 2. If unchecking view, auto-uncheck add, edit, and delete
      if (!checked && action === "view") {
        updatedModule.add = false;
        updatedModule.edit = false;
        updatedModule.delete = false;
      }

      return {
        ...prev,
        [moduleId]: updatedModule
      };
    });
  };

  const handleToggleAllRow = (moduleId: string, checkAll: boolean) => {
    setMatrix((prev) => ({
      ...prev,
      [moduleId]: {
        view: checkAll,
        add: checkAll,
        edit: checkAll,
        delete: checkAll
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoleId) {
      setError("Please select a role first.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    const activeRoleName = roles.find(r => r.id === selectedRoleId)?.name || "";

    try {
      const formattedPermissions = Object.entries(matrix).map(([moduleId, actions]) => ({
        moduleId,
        canView: actions.view,
        canAdd: actions.add,
        canEdit: actions.edit,
        canDelete: actions.delete
      }));

      const res = await fetch("/api/roles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedRoleId,
          name: activeRoleName,
          permissions: formattedPermissions
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save permissions matrix");

      setSuccess(`Permissions for role "${activeRoleName}" updated successfully!`);
    } catch (err: any) {
      setError(err.message || "Failed to save permissions matrix");
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = (roleId: string) => {
    setSelectedRoleId(roleId);
    router.replace(`/dashboard/permissions?roleId=${roleId}`);
  };

  const canView = hasPagePermission("/dashboard/permissions", "view");
  const canEdit = hasPagePermission("/dashboard/permissions", "edit");

  if (loadingModules || loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-sm font-semibold">Loading Permissions Matrix…</p>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl text-center space-y-4 shadow-sm animate-fade-in">
        <div className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
          <Shield className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-850 dark:text-white font-sans">Access Forbidden</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          Your security role does not permit you to view the Permissions Matrix. Please contact your administrator.
        </p>
      </div>
    );
  }

  const selectedRole = roles.find(r => r.id === selectedRoleId);
  const isSuperAdmin = selectedRole?.name === "Super Admin";

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <KeyRound className="h-7 w-7" />
            </span>
            Roles & Permissions Matrix
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm max-w-2xl">
            Manage granular access control policies. Select a role and specify which modules they can view and perform CRUD actions on.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Role Selector Card */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5 flex-1 max-w-md">
            <label htmlFor="role-select" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Active Security Role
            </label>
            <div className="relative">
              <select
                id="role-select"
                value={selectedRoleId}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm appearance-none cursor-pointer font-bold"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1 flex-1">
            <span className="text-xs font-semibold text-slate-400">Role Description:</span>
            <span className="text-xs text-slate-650 dark:text-slate-355 font-medium italic">
              {selectedRole?.description || "No role description set."}
            </span>
          </div>

          <button
            type="submit"
            disabled={saving || isSuperAdmin || !canEdit}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all hover:shadow-lg hover:shadow-indigo-500/10 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none shrink-0 self-end md:self-center"
          >
            <Save className="h-4.5 w-4.5" />
            {saving ? "Saving Matrix..." : "Save Matrix Permissions"}
          </button>
        </div>

        {/* Notifications */}
        {success && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30 text-emerald-800 dark:text-emerald-400 text-xs flex items-start gap-2.5">
            <CheckCircle className="h-4.5 w-4.5 shrink-0 text-emerald-500 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-800/30 text-rose-800 dark:text-rose-400 text-xs flex items-start gap-2.5">
            <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-rose-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Super Admin Notice */}
        {isSuperAdmin ? (
          <div className="p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-850 dark:text-white">Super Admin Bypass Active</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Members with the "Super Admin" role bypass all dynamic modules permission checks and are granted full access to view, add, edit, and delete across the platform by default.
            </p>
          </div>
        ) : (
          /* Permission Matrix Table Card */
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-950 dark:text-white">
                Permissions Matrix
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-950 px-2.5 py-1 rounded-md border border-slate-100 dark:border-slate-800">
                Selected Role: {selectedRole?.name}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-950/20 text-slate-500 dark:text-slate-400 text-xs font-semibold border-b border-slate-200 dark:border-slate-800">
                    <th className="px-6 py-4">Module Name</th>
                    <th className="px-4 py-4 text-center">View</th>
                    <th className="px-4 py-4 text-center">Add</th>
                    <th className="px-4 py-4 text-center">Edit</th>
                    <th className="px-4 py-4 text-center">Delete</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {modules.map((mod) => {
                    const rowState = matrix[mod.id] || { view: false, add: false, edit: false, delete: false };
                    const isAllChecked = rowState.view && rowState.add && rowState.edit && rowState.delete;
                    
                    return (
                      <tr key={mod.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-850/10 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 dark:text-white text-sm">
                              {mod.name}
                            </span>
                            <span className="text-slate-400 dark:text-slate-500 text-[10px] font-mono mt-0.5">
                              {mod.slug}
                            </span>
                          </div>
                        </td>

                        {/* View Checkbox */}
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={rowState.view}
                              onChange={(e) => handleCheckboxChange(mod.id, "view", e.target.checked)}
                              className="h-4.5 w-4.5 rounded border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer accent-indigo-600"
                            />
                          </div>
                        </td>

                        {/* Add Checkbox */}
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={rowState.add}
                              onChange={(e) => handleCheckboxChange(mod.id, "add", e.target.checked)}
                              className="h-4.5 w-4.5 rounded border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer accent-indigo-600"
                            />
                          </div>
                        </td>

                        {/* Edit Checkbox */}
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={rowState.edit}
                              onChange={(e) => handleCheckboxChange(mod.id, "edit", e.target.checked)}
                              className="h-4.5 w-4.5 rounded border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer accent-indigo-600"
                            />
                          </div>
                        </td>

                        {/* Delete Checkbox */}
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={rowState.delete}
                              onChange={(e) => handleCheckboxChange(mod.id, "delete", e.target.checked)}
                              className="h-4.5 w-4.5 rounded border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer accent-indigo-600"
                            />
                          </div>
                        </td>

                        {/* Actions Quick-Toggles */}
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleToggleAllRow(mod.id, !isAllChecked)}
                            className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                          >
                            {isAllChecked ? "Clear All" : "Allow All"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {modules.length === 0 && (
              <div className="p-12 text-center text-slate-400 text-xs">
                No active modules found. Seeding the database first is highly recommended.
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}

export default function PermissionsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-sm font-semibold">Loading Permissions Matrix…</p>
      </div>
    }>
      <PermissionsForm />
    </Suspense>
  );
}
