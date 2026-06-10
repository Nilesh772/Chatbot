"use client";

import React, { useState, useEffect } from "react";
import {
  Edit2 as EditIcon,
  Trash2 as DeleteIcon,
  Plus,
  RefreshCw,
  Search,
  Users,
  Shield,
  CheckCircle,
  X,
  CheckCircle2,
  XCircle,
  Loader2,
  Lock,
  Clock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  department?: string;
  status: "active" | "inactive";
  schedule?: {
    startDay: string;
    endDay: string;
    startTime: string;
    endTime: string;
  } | null;
  createdAt: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
}

function Field({
  label, type = "text", value, onChange, placeholder, required, disabled,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  required?: boolean; disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
        {label}{required && <span className="text-indigo-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none
          focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200
          disabled:opacity-60 transition-all placeholder:text-slate-400"
      />
    </div>
  );
}

function SelectField({
  label, value, onChange, children, required,
}: {
  label: string; value: string; onChange: (v: string) => void;
  children: React.ReactNode; required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
        {label}{required && <span className="text-indigo-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-4 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl
            outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200
            transition-all cursor-pointer appearance-none"
        >
          {children}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-405">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

const getRoleBadge = (roleName: string) => {
  const norm = roleName.toLowerCase();
  if (norm === "super admin" || norm === "super_admin") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 shadow-sm shadow-rose-100/30 dark:shadow-none">
        <Shield className="h-3.5 w-3.5 shrink-0 text-rose-500" />
        {roleName}
      </span>
    );
  }
  if (norm === "admin") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 shadow-sm shadow-indigo-100/30 dark:shadow-none">
        <Shield className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
        {roleName}
      </span>
    );
  }
  if (norm === "agent") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-405 border border-emerald-100 dark:border-emerald-900/30 shadow-sm shadow-emerald-100/30 dark:shadow-none">
        <Shield className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
        {roleName}
      </span>
    );
  }
  // Default or Staff
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-350 border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-100/10 dark:shadow-none">
      <Shield className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      {roleName}
    </span>
  );
};

const getFormattedSchedule = (schedule: any) => {
  if (!schedule) return [];
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const activeDays = days.filter((d) => schedule[d]?.active);
  if (activeDays.length === 0) return [];

  const groups: Record<string, string[]> = {};
  activeDays.forEach((day) => {
    const time = `${schedule[day].startTime} - ${schedule[day].endTime}`;
    if (!groups[time]) groups[time] = [];
    groups[time].push(day);
  });

  return Object.entries(groups).map(([time, grpDays]) => {
    const abbrs = grpDays.map((d) => d.substring(0, 3));
    const indices = grpDays.map((d) => days.indexOf(d)).sort((a, b) => a - b);
    let consecutive = true;
    for (let i = 1; i < indices.length; i++) {
      if (indices[i] !== indices[i - 1] + 1) {
        consecutive = false;
        break;
      }
    }
    if (consecutive && grpDays.length >= 3) {
      return `${abbrs[0]} - ${abbrs[abbrs.length - 1]}: ${time}`;
    }
    return `${abbrs.join(", ")}: ${time}`;
  });
};

export default function UsersDirectoryPage() {
  const { user, hasPagePermission, loadingModules } = useAuth();
  
  // Data lists
  const [users, setUsers] = useState<TeamMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departmentsList, setDepartmentsList] = useState<any[]>([]);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog State
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<TeamMember | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [submitting, setSubmitting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const canView = hasPagePermission("/dashboard/users", "view");
  const canAdd = hasPagePermission("/dashboard/users", "add");
  const canEdit = hasPagePermission("/dashboard/users", "edit");
  const canDelete = hasPagePermission("/dashboard/users", "delete");

  // Fetch roles, users, and departments
  const loadData = async () => {
    if (!canView) return;
    setLoading(true);
    try {
      const [teamRes, rolesRes, deptsRes] = await Promise.all([
        fetch("/api/team"),
        fetch("/api/roles"),
        fetch("/api/departments")
      ]);
      
      const teamData = await teamRes.json();
      const rolesData = await rolesRes.json();
      const deptsData = await deptsRes.json();

      if (teamData.success) {
        setUsers(teamData.team || []);
      } else {
        showToast(teamData.error || "Failed to load users list", "error");
      }

      if (rolesData.success) {
        setRoles(rolesData.roles || []);
        if (rolesData.roles && rolesData.roles.length > 0) {
          // Find standard "Staff" role or select the first role as default
          const defaultRole = rolesData.roles.find((r: any) => r.name.toLowerCase() === "staff") || rolesData.roles[0];
          setRole(defaultRole.name);
        }
      } else {
        showToast(rolesData.error || "Failed to load roles dropdown list", "error");
      }

      if (deptsData.success) {
        setDepartmentsList(deptsData.departments || []);
      } else {
        showToast(deptsData.error || "Failed to load departments list", "error");
      }
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAdd = () => {
    setEditingUser(null);
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    if (roles.length > 0) {
      const defaultRole = roles.find((r) => r.name.toLowerCase() === "staff") || roles[0];
      setRole(defaultRole.name);
    }
    setDepartment("");
    setStatus("active");
    setOpenDialog(true);
  };

  const openEdit = (member: TeamMember) => {
    setEditingUser(member);
    setName(member.name);
    setEmail(member.email);
    setPassword("");
    setConfirmPassword("");
    setRole(member.role);
    setDepartment((member as any).departmentId || "");
    setStatus(member.status);
    setOpenDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      showToast("Please fill in name and email.", "error");
      return;
    }

    if (!editingUser && !password) {
      showToast("Password is required for new users.", "error");
      return;
    }

    if (password && password !== confirmPassword) {
      showToast("Passwords do not match.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/team", {
        method: editingUser ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingUser?.id,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: password || undefined,
          role,
          // Grant standard view permissions for modules (admins bypass check dynamically anyway)
          permissions: ["bots:view", "conversations:view", "leads:view"],
          department: department || null,
          status,
          schedule: editingUser ? undefined : null
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(editingUser ? "User updated successfully!" : "User created successfully!");
        setOpenDialog(false);
        loadData();
      } else {
        showToast(data.error || "Failed to save user", "error");
      }
    } catch {
      showToast("Something went wrong.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (memberId: string, memberName: string) => {
    if (memberId === user?.id) {
      showToast("You cannot delete yourself.", "error");
      return;
    }
    if (!confirm(`Are you sure you want to remove user "${memberName}"?`)) return;

    try {
      const res = await fetch(`/api/team?id=${memberId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast("User removed successfully!");
        loadData();
      } else {
        showToast(data.error || "Failed to delete user", "error");
      }
    } catch {
      showToast("Network error.", "error");
    }
  };

  const filteredUsers = users.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.department || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loadingModules) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-sm font-semibold">Loading users directory…</p>
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
          Your security role does not permit you to view the Users Directory. Please contact your administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl mx-auto py-4 md:py-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Users className="h-7 w-7" />
            </span>
            Users Directory
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm max-w-2xl">
            Manage organization members, assign security roles, and control active application access. All created users can log in dynamically.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-850"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          {canAdd && (
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all active:scale-95 dark:shadow-none"
            >
              <Plus className="h-4 w-4" /> Create User
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search users by name, email, department or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 transition-all placeholder:text-slate-400"
          />
        </div>
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 hidden sm:inline">
          {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""} found
        </span>
      </div>

      {/* Directory Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-550" />
            <p className="text-sm font-semibold">Loading users directory…</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <Users className="h-10 w-10 text-slate-300" />
            <div className="text-center">
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">No users found</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Create a user entry to invite members to this tenant workspace.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-205 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4 text-left">User Details</th>
                  <th className="px-6 py-4 text-left">Email Address</th>
                  <th className="px-6 py-4 text-left">Department</th>
                  <th className="px-6 py-4 text-left">Security Role</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredUsers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-850/10 transition-colors group">
                    {/* Name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold flex items-center justify-center text-xs shadow-md shadow-indigo-100 dark:shadow-none">
                          {member.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-205">{member.name}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">Created {new Date(member.createdAt).toLocaleDateString()}</p>
                          {member.schedule && Object.values(member.schedule).some((d: any) => d.active) && (
                            <div className="relative group/schedule inline-flex mt-1.5">
                              <span className="inline-flex items-center gap-1 bg-indigo-50/50 hover:bg-indigo-100/50 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md text-[9px] font-bold cursor-pointer transition-colors border border-indigo-100/30 dark:border-indigo-900/20">
                                <Clock className="h-3 w-3 text-indigo-500 shrink-0" />
                                View Shift Hours
                              </span>
                              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2.5 hidden group-hover/schedule:flex flex-col gap-1 bg-slate-900 dark:bg-slate-950 text-white p-2.5 rounded-xl shadow-xl border border-slate-800 dark:border-slate-850 z-30 min-w-[210px] pointer-events-none">
                                <span className="text-[10px] font-extrabold border-b border-slate-800 dark:border-slate-850 pb-1 mb-1 block">📅 Work Shift Hours</span>
                                {getFormattedSchedule(member.schedule).map((rangeLine, idx) => (
                                  <div key={idx} className="text-[9.5px] font-semibold leading-relaxed font-sans text-slate-200">
                                    {rangeLine}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-600 dark:text-slate-405 font-medium">{member.email}</span>
                    </td>

                    {/* Department */}
                    <td className="px-6 py-4">
                      {member.department ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-900 text-slate-655 dark:text-slate-300 border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-100/10 dark:shadow-none">
                          {member.department}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">General / None</span>
                      )}
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4">
                      {getRoleBadge(member.role)}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${member.status === "active" ? "text-emerald-600" : "text-slate-400"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${member.status === "active" ? "bg-emerald-500" : "bg-slate-405"}`}></span>
                        {member.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        {canEdit && (
                          <button
                            onClick={() => openEdit(member)}
                            className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 dark:bg-slate-950 dark:hover:bg-slate-800 dark:text-slate-405 hover:text-slate-800 transition-colors"
                          >
                            <EditIcon className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(member.id, member.name)}
                            className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-550 dark:bg-slate-950 dark:hover:bg-rose-950/40 dark:text-slate-405 hover:text-rose-600 transition-colors"
                          >
                            <DeleteIcon className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {!canEdit && !canDelete && (
                          <span className="text-[10px] text-slate-400 italic">No access</span>
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

      {/* Add / Edit Dialog Modal */}
      {openDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-650">
                  <Users className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-white">
                  {editingUser ? "Modify User Directory Account" : "Create Brand New User Account"}
                </h3>
              </div>
              <button
                onClick={() => setOpenDialog(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Full Name / Username" value={name} onChange={setName} placeholder="e.g. Alexis Smith" required />
                <Field label="Email Address" type="email" value={email} onChange={setEmail} placeholder="e.g. alexis@company.com" required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label={editingUser ? "New Password (Optional)" : "Password"}
                  type="password" value={password} onChange={setPassword}
                  placeholder="••••••••" required={!editingUser}
                />
                <Field
                  label={editingUser ? "Confirm New Password (Optional)" : "Confirm Password"}
                  type="password" value={confirmPassword} onChange={setConfirmPassword}
                  placeholder="••••••••" required={!editingUser}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField label="Department (Optional)" value={department} onChange={(v) => setDepartment(v)}>
                  <option value="">None / General</option>
                  {departmentsList.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </SelectField>
                
                <SelectField label="User Status" value={status} onChange={(v) => setStatus(v as any)}>
                  <option value="active">Active (Access Granted)</option>
                  <option value="inactive">Inactive (Access Suspended)</option>
                </SelectField>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <SelectField label="Security Role Dropdown" value={role} onChange={(v) => setRole(v)}>
                  {roles.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </SelectField>
              </div>

              {role.toLowerCase() === "agent" && (
                <div className="p-3 bg-indigo-50/20 dark:bg-slate-950/20 border border-indigo-100/30 rounded-xl text-[11px] text-slate-500">
                  ℹ️ Agent work schedules can be configured per active workday with shift timings inside the **Departments Setup** screen.
                </div>
              )}

              <div className="p-3 bg-indigo-50/40 dark:bg-slate-950/40 border border-indigo-100/50 dark:border-slate-800 rounded-xl text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
                <Lock className="h-4 w-4 shrink-0 mt-0.5 text-indigo-500" />
                <span>
                  <strong>Access Policy:</strong> When the user logs in with their email and password, their layout and API access will dynamically depend on the module permissions currently configured for their assigned role.
                </span>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setOpenDialog(false)}
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
                  ) : editingUser ? (
                    <><CheckCircle2 className="h-3.5 w-3.5" /> Save Changes</>
                  ) : (
                    <><Plus className="h-3.5 w-3.5" /> Create User Account</>
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
          <div className={`flex items-center gap-2 px-4.5 py-3 rounded-2xl shadow-lg border text-xs font-semibold bg-white dark:bg-slate-900 ${
            toast.type === "success" ? "text-emerald-700 border-emerald-100 dark:text-emerald-400 dark:border-emerald-900/30" : "text-red-700 border-red-100 dark:text-red-400 dark:border-red-900/30"
          }`}>
            {toast.type === "success" ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> : <XCircle className="h-4 w-4 text-red-500 shrink-0" />}
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
