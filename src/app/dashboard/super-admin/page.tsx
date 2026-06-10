"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Building,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  X,
  Trash2,
  Edit3,
  Loader2,
  FileSpreadsheet,
  Clock,
  User,
  Activity,
  Check,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface Account {
  id: string;
  company: string;
  owner: string;
  plan: string;
  status: "active" | "suspended";
  createdAt: string;
}

interface AuditLog {
  id: string;
  accountId?: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  ip?: string;
  createdAt: string;
}

export default function SuperAdminPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Search/Filters
  const [searchAccount, setSearchAccount] = useState("");
  const [searchLog, setSearchLog] = useState("");

  // Tabs
  const [activeTab, setActiveTab] = useState<"accounts" | "audit">("accounts");

  // Account Dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [company, setCompany] = useState("");
  const [owner, setOwner] = useState("");
  const [plan, setPlan] = useState("free");
  const [status, setStatus] = useState<"active" | "suspended">("active");

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const accRes = await fetch("/api/accounts");
      const accData = await accRes.json();
      if (accData.success) setAccounts(accData.accounts || []);

      const logRes = await fetch("/api/audit-logs");
      const logData = await logRes.json();
      if (logData.success) setLogs(logData.logs || []);
    } catch (e) {
      showToast("Network error. Could not retrieve console data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "super_admin") {
      fetchData();
    }
  }, [user]);

  const openAdd = () => {
    setEditingAccount(null);
    setCompany("");
    setOwner("");
    setPlan("free");
    setStatus("active");
    setOpenDialog(true);
  };

  const openEdit = (acc: Account) => {
    setEditingAccount(acc);
    setCompany(acc.company);
    setOwner(acc.owner);
    setPlan(acc.plan);
    setStatus(acc.status);
    setOpenDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !owner.trim()) {
      showToast("Please enter company and owner email.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/accounts", {
        method: editingAccount ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingAccount?.id,
          company: company.trim(),
          owner: owner.trim().toLowerCase(),
          plan,
          status,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(editingAccount ? "Workspace updated!" : "Workspace created!", "success");
        setOpenDialog(false);
        fetchData();
      } else {
        showToast(data.error || "Failed to update accounts database", "error");
      }
    } catch {
      showToast("Server request failed.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (accId: string) => {
    if (accId === "acc-super-admin") {
      showToast("Cannot delete primary system console account.", "error");
      return;
    }
    if (!confirm("Are you sure you want to permanently delete this workspace account and all its chatbots, leads, and analytics data?")) return;

    try {
      const res = await fetch(`/api/accounts?id=${accId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast("Account deleted successfully.", "success");
        fetchData();
      } else {
        showToast(data.error || "Failed to delete account", "error");
      }
    } catch {
      showToast("Network error.", "error");
    }
  };

  const filteredAccounts = accounts.filter(
    (a) =>
      a.company.toLowerCase().includes(searchAccount.toLowerCase()) ||
      a.owner.toLowerCase().includes(searchAccount.toLowerCase()) ||
      a.plan.toLowerCase().includes(searchAccount.toLowerCase())
  );

  const filteredLogs = logs.filter(
    (l) =>
      l.userId.toLowerCase().includes(searchLog.toLowerCase()) ||
      l.action.toLowerCase().includes(searchLog.toLowerCase()) ||
      (l.resource || "").toLowerCase().includes(searchLog.toLowerCase())
  );

  if (user?.role !== "super_admin") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
        <ShieldAlert className="h-12 w-12 text-red-500 animate-bounce" />
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Access Denied</h2>
        <p className="text-xs text-slate-500">Only platform Super Administrators are authorized to view this console.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/20 min-h-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white">
              <ShieldAlert className="h-4 w-4" />
            </div>
            SaaS Platform Console
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 ml-10.5">
            Super Administrator panel to oversee organization workspaces, billing subscriptions, and system audit logs.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-850 shadow-md transition-all active:scale-95 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200"
          >
            <Plus className="h-4 w-4" /> Create Workspace
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab("accounts")}
          className={`pb-3 text-xs font-bold transition-all relative ${
            activeTab === "accounts" ? "text-slate-850 dark:text-white border-b-2 border-slate-950 dark:border-white" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          Tenant Accounts ({accounts.length})
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`pb-3 text-xs font-bold transition-all relative ${
            activeTab === "audit" ? "text-slate-850 dark:text-white border-b-2 border-slate-950 dark:border-white" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          System Audit Logs ({logs.length})
        </button>
      </div>

      {/* TAB 1: ACCOUNTS LIST */}
      {activeTab === "accounts" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search workspaces..."
                value={searchAccount}
                onChange={(e) => setSearchAccount(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none
                  focus:border-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
              <p className="text-xs text-slate-400">Loading workspaces…</p>
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
              <Building className="h-8 w-8 text-slate-300" />
              <p className="text-xs font-bold">No workspaces registered.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-6 py-3.5 text-left">Company/Workspace</th>
                    <th className="px-6 py-3.5 text-left">Owner Address</th>
                    <th className="px-6 py-3.5 text-left">SaaS Plan</th>
                    <th className="px-6 py-3.5 text-left">Status</th>
                    <th className="px-6 py-3.5 text-left">Created At</th>
                    <th className="px-6 py-3.5 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                  {filteredAccounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/40 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold text-xs">
                            {acc.company.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{acc.company}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">ID: {acc.id.substring(0, 8)}…</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{acc.owner}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex text-[9px] font-extrabold px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 uppercase tracking-wide">
                          {acc.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold ${acc.status === "active" ? "text-emerald-600" : "text-amber-500"}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${acc.status === "active" ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                          {acc.status === "active" ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 font-medium">
                        {new Date(acc.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(acc)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          {acc.id !== "acc-super-admin" && (
                            <button
                              onClick={() => handleDelete(acc.id)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-all"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SYSTEM AUDIT LOGS */}
      {activeTab === "audit" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search audit actions or actor..."
                value={searchLog}
                onChange={(e) => setSearchLog(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none
                  focus:border-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
              <p className="text-xs text-slate-400">Loading audit log timeline…</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
              <FileSpreadsheet className="h-8 w-8 text-slate-300" />
              <p className="text-xs font-bold">No system actions logged yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-6 py-3.5 text-left">Action Triggered</th>
                    <th className="px-6 py-3.5 text-left">Actor (User)</th>
                    <th className="px-6 py-3.5 text-left">Target Resource</th>
                    <th className="px-6 py-3.5 text-left">IP Address</th>
                    <th className="px-6 py-3.5 text-left">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-850/30 transition-colors text-xs">
                      <td className="px-6 py-3">
                        <span className="inline-flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
                          <Activity className="h-3.5 w-3.5 text-indigo-500" />
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          {log.userId}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-slate-500 dark:text-slate-400 font-medium">
                        {log.resource} <span className="text-[10px] text-slate-400">({log.resourceId?.substring(0, 8)}…)</span>
                      </td>
                      <td className="px-6 py-3 font-mono text-[10px] text-slate-400">
                        {log.ip || "127.0.0.1"}
                      </td>
                      <td className="px-6 py-3 text-slate-450 dark:text-slate-500 font-medium inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Account Creation/Editing Dialog */}
      {openDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-slate-800 dark:text-white" />
                <h3 className="font-bold text-sm text-slate-800 dark:text-white">
                  {editingAccount ? "Edit Workspace settings" : "Create Workspace"}
                </h3>
              </div>
              <button
                onClick={() => setOpenDialog(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Company Name</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-slate-400 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Owner Email</label>
                <input
                  type="email"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  placeholder="owner@company.com"
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-slate-400 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Subscription Plan</label>
                  <select
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full pl-3 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setOpenDialog(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1 px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-850 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-950"
                >
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  {editingAccount ? "Save Settings" : "Create Workspace"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg border text-xs font-semibold bg-white dark:bg-slate-900 ${
            toast.type === "success" ? "text-emerald-700 border-emerald-100 dark:text-emerald-400 dark:border-emerald-900/30" : "text-red-750 border-red-100 dark:text-red-400 dark:border-red-900/30"
          }`}>
            {toast.type === "success" ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
            <span>{toast.msg}</span>
            <button onClick={() => setToast(null)} className="ml-2 text-slate-400">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
