"use client";

import React, { useState, useEffect } from "react";
import {
  Edit2 as EditIcon,
  Trash2 as DeleteIcon,
  Plus,
  RefreshCw,
  Search,
  Users,
  Building2,
  CheckCircle,
  X,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

interface Agent {
  id: string;
  name: string;
  email: string;
  password?: string;
  department?: string;
  createdAt: string;
}

const DEPT_COLORS: Record<string, string> = {
  "Technical Support": "bg-red-50 text-red-600 border-red-100",
  "Billing": "bg-amber-50 text-amber-600 border-amber-100",
  "Sales": "bg-emerald-50 text-emerald-600 border-emerald-100",
  "General Support": "bg-slate-100 text-slate-600 border-slate-200",
};

function getDeptColor(dept: string) {
  return DEPT_COLORS[dept] || "bg-indigo-50 text-indigo-600 border-indigo-100";
}

// ── Input component ─────────────────────────────────────────────────────────
function Field({
  label, type = "text", value, onChange, placeholder, required, disabled,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  required?: boolean; disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-600">
        {label}{required && <span className="text-indigo-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none
          focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white
          disabled:opacity-60 transition-all text-slate-700 placeholder:text-slate-400"
      />
    </div>
  );
}

// ── Select component ─────────────────────────────────────────────────────────
function SelectField({
  label, value, onChange, children, required,
}: {
  label: string; value: string; onChange: (v: string) => void;
  children: React.ReactNode; required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-600">
        {label}{required && <span className="text-indigo-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none pl-3.5 pr-9 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl
            outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white
            transition-all text-slate-700 cursor-pointer"
        >
          {children}
        </select>
        <svg className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  );
}

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, accent }: {
  label: string; value: React.ReactNode;
  icon: React.ReactNode; accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <div className="mt-1.5 text-2xl font-bold text-slate-800">{value}</div>
      </div>
      <div className={`h-11 w-11 rounded-2xl flex items-center justify-center ${accent}`}>
        {icon}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function AgentMasterPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  // Form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("General Support");
  const [customDepartment, setCustomDepartment] = useState("");
  const [isCustomDept, setIsCustomDept] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      if (data.success) setAgents(data.agents || []);
      else showToast(data.error || "Failed to load agents", "error");
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAgents(); }, []);

  const openAdd = () => {
    setEditingAgent(null); setName(""); setEmail(""); setPassword("");
    setDepartment("General Support"); setCustomDepartment(""); setIsCustomDept(false);
    setOpenDialog(true);
  };

  const openEdit = (agent: Agent) => {
    setEditingAgent(agent); setName(agent.name); setEmail(agent.email); setPassword("");
    const std = ["General Support", "Sales", "Billing", "Technical Support"];
    if (agent.department && !std.includes(agent.department)) {
      setDepartment("Custom"); setCustomDepartment(agent.department); setIsCustomDept(true);
    } else {
      setDepartment(agent.department || "General Support"); setCustomDepartment(""); setIsCustomDept(false);
    }
    setOpenDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) { showToast("Please fill name and email.", "error"); return; }
    const finalDept = isCustomDept ? customDepartment.trim() : department;
    if (isCustomDept && !customDepartment.trim()) { showToast("Please specify custom department.", "error"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/agents", {
        method: editingAgent ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingAgent?.id, name: name.trim(),
          email: email.trim().toLowerCase(),
          password: password || undefined, department: finalDept || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(editingAgent ? "Agent updated!" : "Agent added!", "success");
        setOpenDialog(false); fetchAgents();
      } else { showToast(data.error || "Failed to save agent", "error"); }
    } catch { showToast("Something went wrong.", "error"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this agent?")) return;
    try {
      const res = await fetch(`/api/agents?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) { showToast("Agent deleted!", "success"); fetchAgents(); }
      else showToast(data.error || "Failed to delete", "error");
    } catch { showToast("Network error.", "error"); }
  };

  const filtered = agents.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.department || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeDepts = new Set(agents.map(a => a.department).filter(Boolean)).size;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 min-h-0">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
              <Users className="h-4 w-4 text-white" />
            </div>
            Agent Master
          </h1>
          <p className="text-xs text-slate-500 mt-1 ml-10.5">
            Manage your support representatives and their departments for live agent handovers.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchAgents}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600
              bg-white border border-slate-200 hover:bg-slate-50 transition-all duration-150 shadow-sm active:scale-95"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white
              bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all duration-150 active:scale-95"
          >
            <Plus className="h-4 w-4" /> Add Agent
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Agents" value={agents.length}
          icon={<Users className="h-5 w-5 text-indigo-600" />}
          accent="bg-indigo-50"
        />
        <StatCard
          label="Active Departments" value={activeDepts}
          icon={<Building2 className="h-5 w-5 text-blue-600" />}
          accent="bg-blue-50"
        />
        <StatCard
          label="Default Routing"
          value={<span className="text-base font-bold text-emerald-600">Auto Transfer</span>}
          icon={<CheckCircle className="h-5 w-5 text-emerald-600" />}
          accent="bg-emerald-50"
        />
      </div>

      {/* ── Table Card ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Search bar */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl
                outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all
                text-slate-700 placeholder:text-slate-400"
            />
          </div>
          <span className="text-xs font-semibold text-slate-400 shrink-0">
            {filtered.length} agent{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
            <p className="text-xs font-medium">Fetching agents…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Users className="h-6 w-6 text-slate-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-600">No agents found</p>
              <p className="text-xs text-slate-400 mt-1">Add a new agent or change your search query.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Agent Details", "Email Address", "Department", "Joined Date", ""].map((h, i) => (
                    <th key={i} className={`px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 ${i === 4 ? "text-right" : ""}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((agent) => (
                  <tr key={agent.id} className="hover:bg-slate-50/60 transition-colors group">
                    {/* Agent Details */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                          {agent.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-800">{agent.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                            ID: {agent.id.substring(0, 8)}…
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-slate-600 font-medium">{agent.email}</span>
                    </td>

                    {/* Department badge */}
                    <td className="px-5 py-3.5">
                      {agent.department ? (
                        <span className={`inline-flex text-[10px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wide ${getDeptColor(agent.department)}`}>
                          {agent.department}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">None</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3.5">
                      <span className="text-[11px] text-slate-400 font-medium">
                        {new Date(agent.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(agent)}
                          title="Edit Agent"
                          className="p-2 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition-all duration-150"
                        >
                          <EditIcon className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(agent.id)}
                          title="Delete Agent"
                          className="p-2 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-all duration-150"
                        >
                          <DeleteIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add / Edit Dialog ── */}
      {openDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl border border-slate-100 overflow-hidden">
            {/* Dialog header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <h3 className="font-bold text-sm text-slate-800">
                  {editingAgent ? "Edit Agent" : "Add Support Representative"}
                </h3>
              </div>
              <button
                onClick={() => setOpenDialog(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <Field label="Full Name" value={name} onChange={setName} placeholder="e.g. John Doe" required />
              <Field label="Email Address" type="email" value={email} onChange={setEmail} placeholder="e.g. john@company.com" required />
              <Field
                label={editingAgent ? "Password (leave blank to keep current)" : "Password"}
                type="password" value={password} onChange={setPassword}
                placeholder="••••••••" required={!editingAgent}
              />
              <SelectField
                label="Assigned Department"
                value={department}
                onChange={(v) => { setDepartment(v); setIsCustomDept(v === "Custom"); }}
              >
                <option value="General Support">General Support</option>
                <option value="Sales">Sales</option>
                <option value="Billing">Billing</option>
                <option value="Technical Support">Technical Support</option>
                <option value="Custom">Custom…</option>
              </SelectField>

              {isCustomDept && (
                <Field label="Custom Department Name" value={customDepartment} onChange={setCustomDepartment} placeholder="e.g. Customer Success" required />
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 mt-4">
                <button
                  type="button"
                  onClick={() => setOpenDialog(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white
                    bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all duration-150 disabled:opacity-60 active:scale-95"
                >
                  {submitting ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>
                  ) : editingAgent ? (
                    <><CheckCircle2 className="h-3.5 w-3.5" /> Save Changes</>
                  ) : (
                    <><Plus className="h-3.5 w-3.5" /> Create Agent</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-lg border text-xs font-semibold bg-white ${toast.type === "success"
            ? "text-emerald-700 border-emerald-100"
            : toast.type === "error"
              ? "text-red-600 border-red-100"
              : "text-indigo-600 border-indigo-100"
            }`}>
            {toast.type === "success"
              ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              : toast.type === "error"
                ? <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                : <CheckCircle className="h-4 w-4 text-indigo-500 shrink-0" />
            }
            <span>{toast.msg}</span>
            <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-slate-600">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
