"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  Bot, LayoutDashboard, Database, HelpCircle, LogOut, 
  Settings, CreditCard, BarChart2, Users, FileCode, CheckCircle2 
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isSandbox, logout } = useAuth();

  const sidebarLinks = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Bots", href: "/dashboard/bots", icon: Bot },
    { name: "Templates", href: "/dashboard/templates", icon: FileCode },
    { name: "Leads", href: "/dashboard/leads", icon: Users },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart2 },
    { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex h-full w-64 shrink-0 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        {/* Sidebar Logo Header */}
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 dark:border-slate-800 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Bot className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent dark:from-indigo-400 dark:to-indigo-400">
            ChetBot Workspace
          </span>
        </div>

        {/* Sidebar Links */}
        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
          {sidebarLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  active
                    ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-850 dark:hover:text-white"
                }`}
              >
                <link.icon className="h-5 w-5 shrink-0" />
                {link.name}
              </Link>
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
              <p className="text-[10px] text-slate-400 truncate leading-none mt-0.5">{user?.email || "sandbox@chetbot.com"}</p>
            </div>
          </div>
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
                <strong>Sandbox Active:</strong> Local MySQL database is not connected. ChetBot is running in persistence fallback mode (saved to <code className="bg-amber-500/10 px-1 py-0.5 rounded font-mono">db-sandbox.json</code>).
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 px-2 py-0.5 rounded">
              Mock fallback active
            </span>
          </div>
        )}

        {/* Workspace content */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/50">
          {children}
        </main>
      </div>
    </div>
  );
}
