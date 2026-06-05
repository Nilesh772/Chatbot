"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bot, Plus, Trash2, Edit2, Code, Sliders, ExternalLink } from "lucide-react";
import { getImageUrl } from "@/lib/imageHelper";

interface BotData {
  id: string;
  name: string;
  avatarUrl?: string;
  welcomeMessage?: string;
  isActive: boolean;
  createdAt: string;
}

export default function BotsListPage() {
  const [bots, setBots] = useState<BotData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBots = async () => {
    try {
      const res = await fetch("/api/bots");
      const data = await res.json();
      if (!data.error) {
        setBots(data.bots);
      }
    } catch (e) {
      console.error("Failed to load bots:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBots();
  }, []);

  const handleDeleteBot = async (id: string) => {
    if (!confirm("Are you sure you want to delete this chatbot? All conversation history and settings will be permanently lost.")) return;
    try {
      const res = await fetch(`/api/bots/${id}`, { method: "DELETE" });
      if (res.ok) {
        setBots(bots.filter(b => b.id !== id));
      }
    } catch (e) {
      console.error("Failed to delete bot:", e);
    }
  };

  const handleSetActiveBot = async (id: string) => {
    try {
      const res = await fetch(`/api/bots/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true })
      });
      if (res.ok) {
        loadBots();
      }
    } catch (e) {
      console.error("Failed to set active bot:", e);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your Chatbots</h1>
          <p className="text-sm text-slate-500 mt-1">Create, style, and edit visual routing paths for your chatbots.</p>
        </div>
        <Link
          href="/dashboard/bots/create"
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-500 transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          Create Chatbot
        </Link>
      </div>

      {bots.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900/40 min-h-[300px] space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Bot className="h-8 w-8" />
          </div>
          <div>
            <h3 className="font-bold text-lg">No Chatbots Yet</h3>
            <p className="text-sm text-slate-400 max-w-sm mt-1">Start by creating your first chatbot using our quick step-by-step setup wizard.</p>
          </div>
          <Link
            href="/dashboard/bots/create"
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-500 transition-colors"
          >
            Create First Chatbot
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bots.map((bot) => (
            <div
              key={bot.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group relative overflow-hidden"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3.5">
                    {bot.avatarUrl ? (
                      <img src={getImageUrl(bot.avatarUrl)} alt={bot.name} className="h-12 w-12 rounded-full object-cover border border-slate-100 dark:border-slate-850" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                        <Bot className="h-7 w-7" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-bold text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{bot.name}</h2>
                        {bot.isActive ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 dark:bg-green-950/30 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900 shadow-sm">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSetActiveBot(bot.id)}
                            className="inline-flex items-center gap-1 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-650 hover:border-indigo-200 dark:bg-slate-800 dark:hover:bg-slate-750 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                            title="Set as Active/Default Bot"
                          >
                            Set Active
                          </button>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">ID: {bot.id.substring(0, 8)}...</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteBot(bot.id)}
                    className="text-slate-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors"
                    title="Delete Chatbot"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>

                {/* Info summary */}
                <div className="mt-6 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Welcome greeting:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-350 truncate max-w-[170px]">{bot.welcomeMessage || "None"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Created date:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-350">{new Date(bot.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-8 border-t border-slate-100 dark:border-slate-850 pt-5 flex gap-2">
                <Link
                  href={`/dashboard/bots/${bot.id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-850 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 transition-colors duration-200"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Configure Bot
                </Link>
                <a
                  href={`/widget/${bot.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-850 text-slate-500 hover:bg-indigo-100 hover:text-indigo-600 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-400 transition-colors"
                  title="Open live preview page"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
