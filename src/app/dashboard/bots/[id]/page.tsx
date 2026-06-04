"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bot, Workflow, Paintbrush, BarChart3, Users, Code, ChevronRight } from "lucide-react";

import FlowBuilderTab from "@/components/dashboard/FlowBuilderTab";
import ThemeBuilderTab from "@/components/dashboard/ThemeBuilderTab";
import AnalyticsTab from "@/components/dashboard/AnalyticsTab";
import LeadsTab from "@/components/dashboard/LeadsTab";
import EmbedTab from "@/components/dashboard/EmbedTab";

interface BotDetails {
  id: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
}

export default function BotConfigPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: botId } = use(params);
  const router = useRouter();
  
  const [bot, setBot] = useState<BotDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"flow" | "theme" | "analytics" | "leads" | "embed">("flow");

  useEffect(() => {
    async function loadBotDetails() {
      try {
        const res = await fetch(`/api/bots/${botId}`);
        const data = await res.json();
        if (data.error) {
          router.push("/dashboard/bots");
          return;
        }
        setBot(data.bot);
      } catch (err) {
        console.error("Failed to load bot details:", err);
        router.push("/dashboard/bots");
      } finally {
        setLoading(false);
      }
    }
    loadBotDetails();
  }, [botId, router]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!bot) return null;

  const tabs = [
    { id: "flow", name: "Visual Editor", icon: Workflow },
    { id: "theme", name: "Theme Settings", icon: Paintbrush },
    { id: "analytics", name: "Analytics", icon: BarChart3 },
    { id: "leads", name: "Captured Leads", icon: Users },
    { id: "embed", name: "Embed Code", icon: Code },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-40px)] overflow-hidden">
      {/* Bot Header Toolbar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/bots"
            className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
            title="Back to list"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            {bot.avatarUrl ? (
              <img
                src={bot.avatarUrl}
                alt={bot.name}
                className="h-10 w-10 rounded-full object-cover border border-slate-100 dark:border-slate-850"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                <Bot className="h-5.5 w-5.5" />
              </div>
            )}
            <div>
              <h1 className="font-bold text-sm leading-tight">{bot.name}</h1>
              <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">ID: {bot.id}</span>
            </div>
          </div>
        </div>

        {/* Action Link for Live Test Preview */}
        <a
          href={`/widget/${bot.id}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-xs font-bold px-3 py-1.5 text-slate-700 dark:text-slate-350 transition-colors"
        >
          Open Chat Widget Preview
          <ChevronRight className="h-4.5 w-4.5 text-slate-400" />
        </a>
      </div>

      {/* Tabs Menu bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-850 px-6 py-1 flex items-center gap-1.5 shrink-0">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all relative ${
                active
                  ? "text-indigo-600 dark:text-indigo-455 border-b-2 border-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <tab.icon className="h-4.5 w-4.5 shrink-0" />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* Content Viewport */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/30 dark:bg-slate-950/10">
        {activeTab === "flow" && <FlowBuilderTab botId={botId} />}
        {activeTab === "theme" && <ThemeBuilderTab botId={botId} />}
        {activeTab === "analytics" && <AnalyticsTab botId={botId} />}
        {activeTab === "leads" && <LeadsTab botId={botId} />}
        {activeTab === "embed" && <EmbedTab botId={botId} />}
      </div>
    </div>
  );
}
