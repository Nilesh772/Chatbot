"use client";

import React, { useState, useEffect } from "react";
import { Building, Plus, Pencil, Trash2, Users, Save, CheckCircle, AlertTriangle, Loader2, Shield, Search, X, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function DepartmentsPage() {
  const { hasPagePermission, loadingModules } = useAuth();
  
  const [departments, setDepartments] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [newDeptName, setNewDeptName] = useState<string>("");
  const [editingDeptId, setEditingDeptId] = useState<string>("");
  const [editingDeptName, setEditingDeptName] = useState<string>("");
  
  // Assignment mapping
  const [assignedAgentIds, setAssignedAgentIds] = useState<string[]>([]);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Schedule Modal State
  const [openSchedule, setOpenSchedule] = useState(false);
  const [schedulingAgent, setSchedulingAgent] = useState<any | null>(null);
  const [weeklySchedule, setWeeklySchedule] = useState<Record<string, { active: boolean; startTime: string; endTime: string }>>({});

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/departments");
      const data = await res.json();
      if (data.success) {
        setDepartments(data.departments || []);
        setAgents(data.agents || []);
        
        // Default select first department if exists and none selected
        if (data.departments && data.departments.length > 0 && !selectedDeptId) {
          setSelectedDeptId(data.departments[0].id);
        }
      } else {
        setError(data.error || "Failed to load departments.");
      }
    } catch (err) {
      console.error("Fetch departments error:", err);
      setError("An unexpected error occurred while fetching data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Sync assignedAgentIds when selectedDeptId or agents list changes
  useEffect(() => {
    if (!selectedDeptId) {
      setAssignedAgentIds([]);
      return;
    }
    
    // Find agents belonging to this department
    // Check local agents state where departmentId matches selectedDeptId
    const matchedAgents = agents
      .filter((a) => a.departmentId === selectedDeptId)
      .map((a) => a.id);
      
    setAssignedAgentIds(matchedAgents);
  }, [selectedDeptId, agents]);

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newDeptName.trim() }),
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setSuccess(`Department "${newDeptName}" created successfully!`);
        setNewDeptName("");
        // Reload data
        await fetchData();
        // Select new department
        if (data.department) {
          setSelectedDeptId(data.department.id);
        }
      } else {
        setError(data.error || "Failed to create department.");
      }
    } catch (err) {
      setError("Failed to create department.");
    } finally {
      setSaving(false);
    }
  };

  const handleRenameDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDeptName.trim() || !editingDeptId) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/departments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingDeptId, name: editingDeptName.trim() }),
      });
      
      if (res.ok) {
        setSuccess("Department renamed successfully!");
        setEditingDeptId("");
        setEditingDeptName("");
        await fetchData();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to rename department.");
      }
    } catch (err) {
      setError("Failed to rename department.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDepartment = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the department "${name}"? Agents assigned to this department will be unassigned.`)) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/departments?id=${id}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        setSuccess(`Department "${name}" deleted successfully.`);
        if (selectedDeptId === id) {
          setSelectedDeptId("");
        }
        await fetchData();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete department.");
      }
    } catch (err) {
      setError("Failed to delete department.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAgentAssignment = (agentId: string) => {
    setAssignedAgentIds((prev) =>
      prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId]
    );
  };

  const handleSaveAssignments = async () => {
    if (!selectedDeptId) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    const activeDeptName = departments.find((d) => d.id === selectedDeptId)?.name || "";

    try {
      const res = await fetch("/api/departments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedDeptId, agentIds: assignedAgentIds }),
      });
      
      if (res.ok) {
        setSuccess(`Agents mapped to department "${activeDeptName}" successfully!`);
        // Update local agents list to reflect mapping immediately
        setAgents((prevAgents) =>
          prevAgents.map((agent) => {
            if (assignedAgentIds.includes(agent.id)) {
              return { ...agent, departmentId: selectedDeptId };
            } else if (agent.departmentId === selectedDeptId) {
              return { ...agent, departmentId: null };
            }
            return agent;
          })
        );
        await fetchData();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save department assignments.");
      }
    } catch (err) {
      setError("Failed to save department assignments.");
    } finally {
      setSaving(false);
    }
  };

  const openScheduleModal = (agent: any) => {
    setSchedulingAgent(agent);
    
    let initialSchedule: Record<string, { active: boolean; startTime: string; endTime: string }> = {
      Sunday: { active: false, startTime: "09:00", endTime: "17:00" },
      Monday: { active: false, startTime: "09:00", endTime: "17:00" },
      Tuesday: { active: false, startTime: "09:00", endTime: "17:00" },
      Wednesday: { active: false, startTime: "09:00", endTime: "17:00" },
      Thursday: { active: false, startTime: "09:00", endTime: "17:00" },
      Friday: { active: false, startTime: "09:00", endTime: "17:00" },
      Saturday: { active: false, startTime: "09:00", endTime: "17:00" }
    };
    
    if (agent.schedule) {
      try {
        const parsed = typeof agent.schedule === "string" ? JSON.parse(agent.schedule) : agent.schedule;
        if (parsed && typeof parsed === "object") {
          initialSchedule = { ...initialSchedule, ...parsed };
        }
      } catch (e) {
        console.error("Failed to parse agent schedule:", e);
      }
    }
    
    setWeeklySchedule(initialSchedule);
    setOpenSchedule(true);
  };

  const handleSaveSchedule = async () => {
    if (!schedulingAgent) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/team", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: schedulingAgent.id,
          schedule: weeklySchedule
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(`Updated schedule for ${schedulingAgent.name}!`);
        // Update local agents state immediately
        setAgents((prev) =>
          prev.map((a) => (a.id === schedulingAgent.id ? { ...a, schedule: weeklySchedule } : a))
        );
        setOpenSchedule(false);
        setSchedulingAgent(null);
      } else {
        setError(data.error || "Failed to update schedule.");
      }
    } catch (err) {
      setError("Network error updating schedule.");
    } finally {
      setSaving(false);
    }
  };

  const canView = hasPagePermission("/dashboard/departments", "view");
  const canAdd = hasPagePermission("/dashboard/departments", "add");
  const canEdit = hasPagePermission("/dashboard/departments", "edit");
  const canDelete = hasPagePermission("/dashboard/departments", "delete");

  if (loadingModules || loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-sm font-semibold">Loading departments manager…</p>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl text-center space-y-4 shadow-sm">
        <div className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
          <Shield className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-850 dark:text-white">Access Forbidden</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          Your security role does not permit you to view the Departments Master Page. Please contact your administrator.
        </p>
      </div>
    );
  }

  const activeDept = departments.find((d) => d.id === selectedDeptId);
  
  // Filter agents for mapping display by search term
  const filteredAgents = agents.filter((agent) =>
    agent.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Building className="h-7 w-7" />
            </span>
            Departments Setup
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm max-w-2xl">
            Configure agent departments (e.g. Sales, Technical Support) and set up routing assignments to control live chat inbox queues.
          </p>
        </div>
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

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Department List */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Add Department Card */}
          {canAdd && (
            <div className="p-5 rounded-2xl border border-slate-200/60 dark:border-slate-850 bg-white dark:bg-slate-900 shadow-md shadow-slate-100/70 dark:shadow-none transition-shadow hover:shadow-lg hover:shadow-slate-100/60">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Create New Department</h3>
              <form onSubmit={handleAddDepartment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Sales Support"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                />
                <button
                  type="submit"
                  disabled={saving || !newDeptName.trim()}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  <Plus className="h-4.5 w-4.5" />
                  Add
                </button>
              </form>
            </div>
          )}

          {/* Department Selection Card */}
          <div className="rounded-2xl border border-slate-200/60 dark:border-slate-850 bg-white dark:bg-slate-900 shadow-md shadow-slate-100/70 dark:shadow-none overflow-hidden">
            <div className="p-5 border-b border-slate-150 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Departments</h3>
            </div>
            
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[400px] overflow-y-auto">
              {departments.map((dept) => {
                const isSelected = selectedDeptId === dept.id;
                const isEditing = editingDeptId === dept.id;
                
                // Count agents in department
                const agentCount = agents.filter((a) => a.departmentId === dept.id).length;

                return (
                  <div
                    key={dept.id}
                    onClick={() => !isEditing && setSelectedDeptId(dept.id)}
                    className={`p-4.5 flex items-center justify-between transition-all duration-150 cursor-pointer border-l-4 ${
                      isSelected
                        ? "bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-600 font-bold"
                        : "hover:bg-slate-50/60 dark:hover:bg-slate-850/10 border-transparent text-slate-650 dark:text-slate-350"
                    }`}
                  >
                    {isEditing ? (
                      <form
                        onSubmit={handleRenameDepartment}
                        className="flex-1 flex gap-2 items-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={editingDeptName}
                          onChange={(e) => setEditingDeptName(e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-bold"
                          autoFocus
                        />
                        <button
                          type="submit"
                          disabled={saving || !editingDeptName.trim()}
                          className="px-2.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingDeptId("");
                            setEditingDeptName("");
                          }}
                          className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs hover:bg-slate-200"
                        >
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">
                            {dept.name}
                          </span>
                          <span className="text-slate-400 text-xs flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5" />
                            {agentCount} {agentCount === 1 ? "agent mapped" : "agents mapped"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {canEdit && (
                            <button
                              onClick={() => {
                                setEditingDeptId(dept.id);
                                setEditingDeptName(dept.name);
                              }}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              title="Rename Department"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteDepartment(dept.id, dept.name)}
                              className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-red-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              title="Delete Department"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}

              {departments.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No departments found. Create one above to get started.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Agent-to-Department Mapping */}
        <div className="lg:col-span-7">
          {selectedDeptId ? (
            <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md shadow-slate-100/70 dark:shadow-none overflow-hidden flex flex-col h-full">
              
              {/* Card Header */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Map Agents to: <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{activeDept?.name}</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Select agents below to assign them to this department. Unchecked agents will lose department mapping.
                  </p>
                </div>
                
                {canEdit && (
                  <button
                    onClick={handleSaveAssignments}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-1.5 px-4.5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 hover:shadow-lg hover:shadow-indigo-500/10 active:scale-95 transition-all self-end sm:self-auto shrink-0"
                  >
                    <Save className="h-4 w-4" />
                    Save Mapping
                  </button>
                )}
              </div>

              {/* Agent Filter Search */}
              <div className="p-3 bg-slate-50/40 dark:bg-slate-950/10 border-b border-slate-200/60 dark:border-slate-800 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search agents by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>              {/* List of Agents */}
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 overflow-y-auto max-h-[500px]">
                {filteredAgents.map((agent) => {
                  const isChecked = assignedAgentIds.includes(agent.id);
                  const isAssignedToOtherDept = agent.departmentId && agent.departmentId !== selectedDeptId;
                  const otherDeptName = isAssignedToOtherDept
                    ? departments.find((d) => d.id === agent.departmentId)?.name || "another department"
                    : "";

                  return (
                    <div
                      key={agent.id}
                      onClick={() => canEdit && handleToggleAgentAssignment(agent.id)}
                      className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all duration-200 cursor-pointer ${
                        isChecked
                          ? "bg-indigo-50/20 dark:bg-indigo-950/10 border-indigo-500 shadow-sm"
                          : "bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-900 hover:shadow-sm"
                      }`}
                    >
                      {/* Top Row: Checkbox & Agent Info */}
                      <div className="flex items-start gap-2.5">
                        {canEdit && (
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // Controlled by card onClick
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-indigo-650 focus:ring-indigo-500/20 cursor-pointer accent-indigo-600 shrink-0"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-slate-800 dark:text-white text-xs block truncate" title={agent.name || "Agent User"}>
                            {agent.name || "Agent User"}
                          </span>
                          <span className="text-slate-400 dark:text-slate-500 text-[10px] truncate block mt-0.5" title={agent.email}>
                            {agent.email}
                          </span>
                        </div>
                      </div>

                      {/* Middle Badge Row */}
                      <div className="mt-2.5 flex items-center justify-between gap-1.5 flex-wrap">
                        {isChecked ? (
                          <span className="text-[9px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30 px-2 py-0.5 rounded-md shrink-0">
                            Selected
                          </span>
                        ) : isAssignedToOtherDept ? (
                          <span className="text-[9px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-100/50 dark:border-amber-900/30 px-2 py-0.5 rounded-md shrink-0 truncate max-w-full" title={`Assigned to ${otherDeptName}`}>
                            In: {otherDeptName}
                          </span>
                        ) : (
                          <span className="text-[9px] font-extrabold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md shrink-0">
                            General
                          </span>
                        )}
                      </div>

                      {/* Shifts Preview */}
                      {agent.schedule && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                          <div className="text-[9px] text-slate-400 dark:text-slate-505 font-bold block mb-1">📅 Shifts:</div>
                          <div className="flex flex-wrap gap-1 max-h-[55px] overflow-y-auto pr-0.5">
                            {Object.entries(agent.schedule)
                              .filter(([_, details]: any) => details.active)
                              .map(([day, details]: any) => (
                                <span key={day} className="bg-slate-50 dark:bg-slate-850 border border-slate-200/45 dark:border-slate-800 px-1 py-0.5 rounded text-[8px] text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                  {day.substring(0, 3)}: {details.startTime}-{details.endTime}
                                </span>
                              ))
                            }
                          </div>
                        </div>
                      )}

                      {/* Action Button at bottom */}
                      {isChecked && canEdit && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openScheduleModal(agent);
                          }}
                          className="mt-3 w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-sm hover:shadow active:scale-[0.98]"
                        >
                          Edit Schedule
                        </button>
                      )}
                    </div>
                  );
                })}

                {filteredAgents.length === 0 && (
                  <div className="col-span-full p-12 text-center text-slate-400 text-xs">
                    No matching agents found. Ensure you have registered agents under the "Users" or "Roles" module.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center p-8 text-center text-slate-400 gap-3">
              <Building className="h-10 w-10 text-slate-300" />
              <p className="text-sm font-semibold">Select a department from the left column to configure agent mapping.</p>
            </div>
          )}
        </div>

      </div>

      {/* ── SCHEDULE MODAL ── */}
      {openSchedule && schedulingAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-650">
                  <Clock className="h-4.5 w-4.5" />
                </div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-white">
                  Work Schedule: {schedulingAgent.name}
                </h3>
              </div>
              <button
                onClick={() => {
                  setOpenSchedule(false);
                  setSchedulingAgent(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Content Form */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <p className="text-xs text-slate-550 dark:text-slate-400">
                Specify active workdays and customized morning/evening shift timings for this agent. Unchecked days mean the agent is off-duty.
              </p>

              <div className="space-y-3">
                {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => {
                  const dayData = weeklySchedule[day] || { active: false, startTime: "09:00", endTime: "17:00" };
                  return (
                    <div
                      key={day}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                        dayData.active
                          ? "bg-indigo-50/20 dark:bg-indigo-950/10 border-indigo-100 dark:border-indigo-900/40"
                          : "bg-slate-50/50 dark:bg-slate-950/10 border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      {/* Checkbox and Day Label */}
                      <label className="flex items-center gap-3 cursor-pointer select-none font-bold text-xs text-slate-700 dark:text-slate-300 w-32 shrink-0">
                        <input
                          type="checkbox"
                          checked={dayData.active}
                          onChange={(e) => {
                            const active = e.target.checked;
                            setWeeklySchedule(prev => ({
                              ...prev,
                              [day]: { ...prev[day] || { startTime: "09:00", endTime: "17:00" }, active }
                            }));
                          }}
                          className="h-4.5 w-4.5 rounded border-slate-300 dark:border-slate-800 text-indigo-650 focus:ring-indigo-500/20 cursor-pointer accent-indigo-600"
                        />
                        {day}
                      </label>

                      {/* Time Inputs */}
                      {dayData.active && (
                        <div className="flex items-center gap-2 flex-1 sm:justify-end">
                          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-950 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] text-slate-400 font-medium">Start:</span>
                            <input
                              type="time"
                              value={dayData.startTime}
                              onChange={(e) => {
                                const startTime = e.target.value;
                                setWeeklySchedule(prev => ({
                                  ...prev,
                                  [day]: { ...prev[day], startTime }
                                }));
                              }}
                              className="text-xs bg-transparent outline-none text-slate-800 dark:text-slate-200 w-20"
                            />
                          </div>

                          <span className="text-slate-400 text-xs font-semibold">to</span>

                          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-950 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] text-slate-400 font-medium">End:</span>
                            <input
                              type="time"
                              value={dayData.endTime}
                              onChange={(e) => {
                                const endTime = e.target.value;
                                setWeeklySchedule(prev => ({
                                  ...prev,
                                  [day]: { ...prev[day], endTime }
                                }));
                              }}
                              className="text-xs bg-transparent outline-none text-slate-800 dark:text-slate-200 w-20"
                            />
                          </div>
                        </div>
                      )}
                      
                      {!dayData.active && (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 italic flex-1 sm:text-right py-1">
                          Off-Duty
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setOpenSchedule(false);
                  setSchedulingAgent(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSchedule}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition-all duration-150 active:scale-95"
              >
                {saving ? "Saving…" : "Save Schedule"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
