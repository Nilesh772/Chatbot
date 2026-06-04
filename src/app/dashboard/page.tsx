"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Users, Bot, BarChart3, MessageSquare, Plus, ArrowRight, 
  Search, Mail, Calendar, Settings, ChevronRight 
} from "lucide-react";

interface DashboardSummary {
  visitors: number;
  chats: number;
  leads: number;
  conversionRate: number;
}

interface DashboardBot {
  id: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
}

interface RecentLead {
  id: string;
  botId: string;
  botName: string;
  name?: string;
  email?: string;
  mobile?: string;
  source?: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [bots, setBots] = useState<DashboardBot[]>([]);
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/dashboard/summary");
        const data = await res.json();
        if (!data.error) {
          setSummary(data.summary);
          setBots(data.bots);
          setRecentLeads(data.recentLeads);
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Here is how your chatbots are performing overall.</p>
        </div>
        <Link
          href="/dashboard/bots/create"
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-500 hover:shadow-indigo-500/35 transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          Create Chatbot
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Visitors</span>
            <Users className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight">{summary?.visitors.toLocaleString()}</p>
          <span className="text-[10px] text-green-500 font-semibold mt-1 block">Past 30 days</span>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Chats Started</span>
            <MessageSquare className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight">{summary?.chats.toLocaleString()}</p>
          <span className="text-[10px] text-slate-400 font-semibold mt-1 block">Engagement active</span>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Leads Captured</span>
            <Bot className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight">{summary?.leads.toLocaleString()}</p>
          <span className="text-[10px] text-green-500 font-semibold mt-1 block">Contact info captured</span>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Lead Conv. Rate</span>
            <BarChart3 className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight">{summary?.conversionRate}%</p>
          <span className="text-[10px] text-slate-400 font-semibold mt-1 block">Avg conversion speed</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bots List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Your Chatbots</h2>
            <Link href="/dashboard/bots" className="text-xs font-semibold text-indigo-600 hover:underline">
              Manage Bots
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {bots.map((bot) => (
              <div
                key={bot.id}
                className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="flex items-center gap-3">
                  {bot.avatarUrl ? (
                    <img src={bot.avatarUrl} alt={bot.name} className="h-11 w-11 rounded-full object-cover border border-slate-100 dark:border-slate-850" />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                      <Bot className="h-6 w-6" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-sm truncate max-w-[160px]">{bot.name}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Created: {new Date(bot.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-100 dark:border-slate-850 pt-4 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Manage Bot</span>
                  <Link
                    href={`/dashboard/bots/${bot.id}`}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white dark:bg-slate-800 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}

            {/* Empty state creation card */}
            <Link
              href="/dashboard/bots/create"
              className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-5 flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-all min-h-[130px] group"
            >
              <Plus className="h-6 w-6 text-slate-400 group-hover:scale-110 transition-transform duration-250 mb-2" />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Create New Bot</span>
            </Link>
          </div>
        </div>

        {/* Recent Leads */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Recent Leads</h2>
            <Link href="/dashboard/leads" className="text-xs font-semibold text-indigo-600 hover:underline">
              See All
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-850 overflow-hidden">
            {recentLeads.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No leads captured yet. Install widget to begin.
              </div>
            ) : (
              recentLeads.map((lead) => (
                <div key={lead.id} className="p-4.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs truncate max-w-[120px]">{lead.name || "Anonymous Visitor"}</h4>
                    <span className="rounded bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-600 dark:text-indigo-400">
                      {lead.botName}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">{lead.email || "No email provided"}</p>
                  {lead.mobile && <p className="text-[10px] text-slate-500 font-medium">{lead.mobile}</p>}
                  <p className="text-[9px] text-slate-400 mt-1 block">Date: {new Date(lead.createdAt).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
