"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  Key,
  RefreshCw,
  Search,
  CheckCircle,
  AlertTriangle,
  X,
  Loader2,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

interface Role {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export default function RolesDirectoryPage() {
  const { hasPagePermission, loadingModules } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Add / Edit Modal state
  const [openModal, setOpenModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Notifications
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const canView = hasPagePermission("/dashboard/roles", "view");
  const canAdd = hasPagePermission("/dashboard/roles", "add");
  const canEdit = hasPagePermission("/dashboard/roles", "edit");
  const canDelete = hasPagePermission("/dashboard/roles", "delete");

  const fetchRoles = async () => {
    if (!canView) return;
    setLoading(true);
    try {
      const res = await fetch("/api/roles");
      const data = await res.json();
      if (data.success) {
        setRoles(data.roles || []);
      } else {
        showToast(data.error || "Failed to load roles", "error");
      }
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleOpenAdd = () => {
    setEditingRole(null);
    setName("");
    setDescription("");
    setOpenModal(true);
  };

  const handleOpenEdit = (role: Role) => {
    setEditingRole(role);
    setName(role.name);
    setDescription(role.description || "");
    setOpenModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Role name is required", "error");
      return;
    }

    setSubmitting(true);
    try {
      const url = "/api/roles";
      const method = editingRole ? "PUT" : "POST";
      const body = editingRole 
        ? { id: editingRole.id, name: name.trim(), description: description.trim() }
        : { name: name.trim(), description: description.trim(), permissions: [] };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(editingRole ? "Role updated successfully!" : "Role created successfully!");
        setOpenModal(false);
        fetchRoles();
      } else {
        showToast(data.error || "Failed to save role", "error");
      }
    } catch {
      showToast("Something went wrong.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (roleId: string, roleName: string) => {
    if (["Super Admin", "Admin", "Staff", "Agent"].includes(roleName)) {
      showToast("Default system roles cannot be deleted.", "error");
      return;
    }

    if (!confirm(`Are you sure you want to delete the role "${roleName}"? This will clear all permissions mapped to it.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/roles?id=${roleId}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Role deleted successfully!");
        fetchRoles();
      } else {
        showToast(data.error || "Failed to delete role", "error");
      }
    } catch {
      showToast("Network error.", "error");
    }
  };

  const filteredRoles = roles.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loadingModules) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-sm font-semibold">Loading system roles directory…</p>
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
          Your security role does not permit you to view the Roles Directory. Please contact your administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Shield className="h-7 w-7" />
            </span>
            Roles Directory
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm max-w-2xl">
            Configure system roles for your multi-tenant workspace. Create roles, manage descriptions, and map dynamic module access.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchRoles}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-650 bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-850"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          {canAdd && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all active:scale-95 dark:shadow-none animate-pulse-slow"
            >
              <Plus className="h-4.5 w-4.5" /> Add New Role
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-405" />
          <input
            type="text"
            placeholder="Search roles by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 transition-all placeholder:text-slate-400"
          />
        </div>
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 hidden sm:inline">
          {filteredRoles.length} role{filteredRoles.length !== 1 ? "s" : ""} configured
        </span>
      </div>

      {/* Directory Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-sm font-semibold">Loading system roles directory…</p>
        </div>
      ) : filteredRoles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 border border-dashed border-slate-250 dark:border-slate-800 rounded-2xl gap-3">
          <Shield className="h-12 w-12 text-slate-300" />
          <div className="text-center">
            <p className="text-base font-bold text-slate-650 dark:text-slate-400">No roles match your search</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Try updating your query or add a brand new role.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoles.map((role) => {
            const isDefault = ["Super Admin", "Admin", "Staff", "Agent"].includes(role.name);
            return (
              <div 
                key={role.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:shadow-lg transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
                      <Shield className="h-4.5 w-4.5 text-indigo-500" />
                      {role.name}
                    </span>
                    {isDefault && (
                      <span className="text-[9px] font-extrabold uppercase bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-md dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 min-h-[36px] line-clamp-2">
                    {role.description || "No description provided."}
                  </p>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400">
                    ID: {role.id.substring(0, 10)}...
                  </span>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/permissions?roleId=${role.id}`}
                      className="p-2 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 dark:bg-slate-950 dark:hover:bg-indigo-950/40 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors flex items-center gap-1 text-[11px] font-semibold"
                      title="Manage Permissions Matrix"
                    >
                      <Key className="h-3.5 w-3.5" />
                      Permissions
                    </Link>
                    
                    {canEdit && (
                      <button
                        onClick={() => handleOpenEdit(role)}
                        className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-850 dark:bg-slate-950 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
                        title="Edit Role Details"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    )}

                    {!isDefault && canDelete && (
                      <button
                        onClick={() => handleDelete(role.id, role.name)}
                        className="p-2 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-550 hover:text-rose-600 dark:bg-slate-950 dark:hover:bg-rose-950/40 dark:text-slate-400 dark:hover:text-rose-450 transition-colors"
                        title="Delete Role"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal Dialog */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-650">
                  <Shield className="h-4.5 w-4.5" />
                </div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-white">
                  {editingRole ? "Modify Role Details" : "Create Brand New Role"}
                </h3>
              </div>
              <button
                onClick={() => setOpenModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-650 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">
                  Role Name <span className="text-indigo-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Content Writer, Support Lead"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">
                  Role Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summarize the core access levels mapped to this role..."
                  rows={4}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 transition-all placeholder:text-slate-400 resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setOpenModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition-all duration-150 active:scale-95"
                >
                  {submitting ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>
                  ) : (
                    "Save Role Details"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className={`flex items-center gap-2.5 px-4.5 py-3.5 rounded-2xl shadow-xl border text-xs font-semibold bg-white dark:bg-slate-900 ${
            toast.type === "success" ? "text-emerald-700 border-emerald-100 dark:text-emerald-400 dark:border-emerald-900/30" : "text-red-700 border-red-100 dark:text-red-400 dark:border-red-900/30"
          }`}>
            {toast.type === "success" ? <CheckCircle className="h-4.5 w-4.5 text-emerald-500 shrink-0" /> : <AlertTriangle className="h-4.5 w-4.5 text-red-500 shrink-0" />}
            <span>{toast.msg}</span>
            <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-slate-605">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
