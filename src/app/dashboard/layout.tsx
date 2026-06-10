"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import NotificationDropdown from "@/components/NotificationDropdown";
import {
  Bot, LayoutDashboard, Database, LogOut,
  Settings, CreditCard, BarChart2, Users, FileCode, MessageSquare, UserCheck, ShieldAlert, Shield, KeyRound, Building,
  ChevronDown, ChevronRight
} from "lucide-react";

const iconMap: Record<string, any> = {
  "LayoutDashboard": LayoutDashboard,
  "Bot": Bot,
  "MessageSquare": MessageSquare,
  "UserCheck": UserCheck,
  "FileCode": FileCode,
  "Users": Users,
  "BarChart2": BarChart2,
  "CreditCard": CreditCard,
  "Settings": Settings,
  "ShieldAlert": ShieldAlert,
  "Shield": Shield,
  "KeyRound": KeyRound,
  "Building": Building
};

const menuGroups = [
  {
    id: "overview",
    name: "Overview",
    isStandalone: true,
    children: [
      { slug: "/dashboard", name: "Dashboard", icon: "LayoutDashboard" },
      { slug: "/dashboard/analytics", name: "Analytics", icon: "BarChart2" }
    ]
  },
  {
    id: "ai_bots",
    name: "AI & Bots",
    icon: "Bot",
    children: [
      { slug: "/dashboard/bots", name: "Bots", icon: "Bot" },
      { slug: "/dashboard/templates", name: "Templates", icon: "FileCode" }
    ]
  },
  {
    id: "engagement",
    name: "Engagement",
    icon: "MessageSquare",
    children: [
      { slug: "/dashboard/inbox", name: "Live Chat", icon: "MessageSquare" },
      { slug: "/dashboard/leads", name: "Leads", icon: "Users" }
    ]
  },
  {
    id: "user_management",
    name: "User Management",
    icon: "UserCheck",
    children: [
      { slug: "/dashboard/users", name: "Users", icon: "Users" },
      { slug: "/dashboard/departments", name: "Departments", icon: "Building" },
      { slug: "/dashboard/roles", name: "Roles", icon: "Shield" },
      { slug: "/dashboard/permissions", name: "Permissions", icon: "KeyRound" }
    ]
  },
  {
    id: "administration",
    name: "Administration",
    icon: "Settings",
    children: [
      { slug: "/dashboard/settings", name: "Settings", icon: "Settings" },
      { slug: "/dashboard/billing", name: "Billing", icon: "CreditCard" }
    ]
  }
];


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isSandbox, modules, loadingModules, logout } = useAuth();

  const [agentStatus, setAgentStatus] = useState<string>("offline");
  const [showStatusDropdown, setShowStatusDropdown] = useState<boolean>(false);

  useEffect(() => {
    if (!user) return;
    
    let isInitial = true;

    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/agents/status");
        const data = await res.json();
        if (data.success) {
          const currentStatus = data.agentStatus || "offline";
          
          // Automatically set status to online on initial load for Agents
          if (isInitial && user.role && user.role.toLowerCase() === "agent" && currentStatus !== "online") {
            isInitial = false;
            try {
              const updateRes = await fetch("/api/agents/status", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ agentStatus: "online" })
              });
              const updateData = await updateRes.json();
              if (updateData.success) {
                setAgentStatus("online");
                return;
              }
            } catch (err) {
              console.error("Failed to auto-set agent status to online:", err);
            }
          }
          
          isInitial = false;
          setAgentStatus(currentStatus);
        }
      } catch (err) {
        console.error("Failed to fetch agent status:", err);
      }
    };

    fetchStatus();

    // Poll status every 5 seconds to keep sidebar UI updated
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const handleStatusChange = async (status: string) => {
    try {
      const res = await fetch("/api/agents/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentStatus: status })
      });
      const data = await res.json();
      if (data.success) {
        setAgentStatus(status);
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
    setShowStatusDropdown(false);
  };

  // Authorization Page Guard Redirection
  useEffect(() => {
    if (loadingModules || !user) return;

    // Super Admin bypass
    const isSuperAdmin = user.role && (user.role.toLowerCase() === "super_admin" || user.role.toLowerCase() === "super admin");
    if (isSuperAdmin) return;

    if (pathname.startsWith("/dashboard")) {
      // Check if current path matches any of the allowed modules
      // e.g. /dashboard/bots/create starts with /dashboard/bots
      // But /dashboard is a prefix of /dashboard/bots, so we check carefully
      const isAllowed = modules.some(mod => {
        if (mod.slug === "/dashboard") {
          return pathname === "/dashboard";
        }
        return pathname === mod.slug || pathname.startsWith(mod.slug + "/");
      });

      if (!isAllowed) {
        // Find first allowed module, or default back to dashboard if they have access to it
        const dashboardModule = modules.find(m => m.slug === "/dashboard");
        const fallback = dashboardModule ? "/dashboard" : (modules[0]?.slug || "/dashboard");
        if (pathname !== fallback) {
          router.push(fallback);
        }
      }
    }
  }, [pathname, modules, loadingModules, user]);

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  const activeSlugs = new Set(modules.map(mod => mod.slug));

  const visibleGroups = menuGroups.map(group => {
    const visibleChildren = group.children.filter(child => activeSlugs.has(child.slug));
    return {
      ...group,
      children: visibleChildren
    };
  }).filter(group => group.children.length > 0);

  // Auto-expand active group
  useEffect(() => {
    const newExpanded = { ...expandedGroups };
    let changed = false;
    visibleGroups.forEach(group => {
      if (!group.isStandalone && !expandedGroups[group.id]) {
        const hasActiveChild = group.children.some(child => isActive(child.slug));
        if (hasActiveChild) {
          newExpanded[group.id] = true;
          changed = true;
        }
      }
    });
    if (changed) {
      setExpandedGroups(newExpanded);
    }
  }, [pathname, modules]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex h-full w-64 shrink-0 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        {/* Sidebar Logo Header */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 dark:border-slate-800 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg">
            <Bot className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              AgentFlow AI
            </h1>
            <p className="text-xs text-slate-500">
              AI Chatbot Builder
            </p>
          </div>
        </div>
        {/* Sidebar Links */}
        <nav className="flex-1 space-y-3 px-4 py-6 overflow-y-auto">
          {visibleGroups.map((group) => {
            if (group.isStandalone) {
              return (
                <div key={group.id} className="space-y-1.5">
                  {group.children.map((child) => {
                    const active = isActive(child.slug);
                    const ChildIcon = iconMap[child.icon || ""] || LayoutDashboard;
                    return (
                      <Link
                        key={child.slug}
                        href={child.slug}
                        className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                          active
                            ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-850 dark:hover:text-white"
                        }`}
                      >
                        <ChildIcon className="h-5 w-5 shrink-0" />
                        {child.name}
                      </Link>
                    );
                  })}
                </div>
              );
            }

            const isExpanded = !!expandedGroups[group.id];
            const groupHasActiveChild = group.children.some(child => isActive(child.slug));
            const GroupIcon = iconMap[group.icon || ""] || LayoutDashboard;

            return (
              <div key={group.id} className="space-y-1">
                {/* Parent Dropdown Header */}
                <button
                  type="button"
                  onClick={() => setExpandedGroups(prev => ({ ...prev, [group.id]: !prev[group.id] }))}
                  className={`w-full flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    groupHasActiveChild
                      ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/10"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-850 dark:hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <GroupIcon className="h-5 w-5 shrink-0" />
                    <span>{group.name}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200" />
                  )}
                </button>

                {/* Child List */}
                {isExpanded && (
                  <div className="pl-6 space-y-1 border-l border-slate-200 dark:border-slate-800 ml-6 mt-1 transition-all duration-300">
                    {group.children.map((child) => {
                      const childActive = isActive(child.slug);
                      const ChildIcon = iconMap[child.icon || ""] || LayoutDashboard;
                      return (
                        <Link
                          key={child.slug}
                          href={child.slug}
                          className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 ${
                            childActive
                              ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
                              : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-850 dark:hover:text-white"
                          }`}
                        >
                          <ChildIcon className="h-4 w-4 shrink-0" />
                          {child.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Sidebar User Footer */}
        <div className="border-t border-slate-200 dark:border-slate-800 p-4 space-y-2.5">
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-full bg-indigo-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-indigo-600 shrink-0">
              {user?.name ? user.name.substring(0, 2).toUpperCase() : "US"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate leading-tight">{user?.name || "Sandbox User"}</p>
              <p className="text-[10px] text-slate-400 truncate leading-none mt-0.5 font-semibold">
                {user?.role ? `${user.role.replace("_", " ").toUpperCase()}` : "User"}
              </p>
            </div>
          </div>

          {/* Status Dropdown */}
          {user && user.role && user.role.toLowerCase() === "agent" && (
            <div className="relative px-2">
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="w-full flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs font-semibold bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${
                    agentStatus === "online" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" :
                    agentStatus === "busy" ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" :
                    agentStatus === "away" ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" :
                    "bg-slate-400"
                  }`} />
                  <span className="capitalize">{agentStatus}</span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {showStatusDropdown && (
                <div className="absolute bottom-full left-2 right-2 mb-1.5 z-50 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-lg">
                  {(["online", "busy", "away", "offline"] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => handleStatusChange(status)}
                      className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors ${
                        agentStatus === status ? "bg-slate-50 dark:bg-slate-850 font-bold text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-350"
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${
                        status === "online" ? "bg-emerald-500" :
                        status === "busy" ? "bg-rose-500" :
                        status === "away" ? "bg-amber-500" :
                        "bg-slate-400"
                      }`} />
                      <span className="capitalize">{status}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/20 dark:hover:text-red-400 transition-colors"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Sandbox Banner */}
        {isSandbox && (
          <div className="bg-amber-500/10 border-b border-amber-500/25 px-4 py-2.5 text-xs text-amber-700 dark:text-amber-400 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Database className="h-4.5 w-4.5 animate-pulse" />
              <span>
                <strong>Sandbox Active:</strong> Local MySQL database is not connected. ChatBot is running in persistence fallback mode (saved to <code className="bg-amber-500/10 px-1 py-0.5 rounded font-mono">db-sandbox.json</code>).
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 px-2 py-0.5 rounded">
              Mock fallback active
            </span>
          </div>
        )}

        {/* Premium Dashboard Header Bar */}
        <header className="h-16 shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between z-20 shadow-sm transition-colors duration-200">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white capitalize tracking-wide">
              {pathname === "/dashboard"
                ? "Overview"
                : pathname.split("/").filter(Boolean).pop()?.replace("-", " ") || "Dashboard"}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Real-time Notification system */}
            <NotificationDropdown />

            {/* Separator */}
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />

            {/* User Profile */}
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-tight">
                  {user?.name || "User"}
                </span>
                <span className="text-[9px] text-slate-400 font-semibold capitalize mt-0.5">
                  {user?.role?.replace("_", " ") || "Member"}
                </span>
              </div>
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold flex items-center justify-center text-xs shadow-md border border-white/10 dark:border-slate-800">
                {user?.name ? user.name.substring(0, 2).toUpperCase() : "US"}
              </div>
            </div>
          </div>
        </header>

        {/* Workspace content */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/50">
          {children}
        </main>
      </div>
    </div>
  );
}
