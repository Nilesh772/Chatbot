"use client";

import { useEffect, useState } from "react";
import { Users, MessageSquare, Bot, BarChart3, TrendingUp, Sparkles } from "lucide-react";

interface AnalyticsSummary {
  visitors: number;
  chats: number;
  leads: number;
  conversionRate: number;
}

interface BotPerformance {
  id: string;
  name: string;
  visitors: number;
  chats: number;
  leads: number;
  conversionRate: number;
}

export default function GlobalAnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [performers, setPerformers] = useState<BotPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/dashboard/summary");
        const data = await res.json();
        if (!data.error) {
          setSummary(data.summary);
          
          // Let's create dummy bot performances for the demo view based on summary
          const botsRes = await fetch("/api/bots");
          const botsData = await botsRes.json();
          if (!botsData.error) {
            const list = botsData.bots.map((b: any, idx: number) => {
              const baseV = 100 + (idx * 150);
              const baseC = Math.round(baseV * 0.6);
              const baseL = Math.round(baseC * 0.25);
              return {
                id: b.id,
                name: b.name,
                visitors: baseV,
                chats: baseC,
                leads: baseL,
                conversionRate: baseV > 0 ? parseFloat(((baseL / baseV) * 100).toFixed(1)) : 0
              };
            });
            setPerformers(list);
          }
        }
      } catch (e) {
        console.error("Failed to load analytics data:", e);
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

  // Draw aggregate SVG chart coordinates
  const width = 600;
  const height = 160;
  const padding = 15;
  const dummyChartData = [
    { date: "W1", visitors: 45 },
    { date: "W2", visitors: 80 },
    { date: "W3", visitors: 150 },
    { date: "W4", visitors: 290 },
  ];
  const maxVal = 320;
  const points = dummyChartData.map((item, idx) => {
    const x = padding + (idx / (dummyChartData.length - 1)) * (width - padding * 2);
    const y = height - padding - (item.visitors / maxVal) * (height - padding * 2);
    return { x, y };
  });
  const visitorsPath = points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = points.length > 0 
    ? `${visitorsPath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z` 
    : "";

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Global Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Aggregated visual trends and funnel performance across all web widgets.</p>
      </div>

      {/* Mini metrics cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Visitors</span>
            <Users className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="mt-2 text-2xl font-extrabold tracking-tight">{summary?.visitors.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Chats Started</span>
            <MessageSquare className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="mt-2 text-2xl font-extrabold tracking-tight">{summary?.chats.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Leads Captured</span>
            <Bot className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="mt-2 text-2xl font-extrabold tracking-tight">{summary?.leads.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Average Conversion</span>
            <BarChart3 className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="mt-2 text-2xl font-extrabold tracking-tight">{summary?.conversionRate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* SVG Chart card */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs">Aggregated Growth Funnel</h4>
            <span className="text-[10px] font-bold text-indigo-650 bg-indigo-50 dark:bg-indigo-950/45 px-2.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" />
              Traffic rising
            </span>
          </div>

          <div className="relative w-full overflow-hidden">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
              <defs>
                <linearGradient id="globalChartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#f1f5f9" strokeDasharray="3,3" className="dark:stroke-slate-800" />
              <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#cbd5e1" strokeWidth="1" className="dark:stroke-slate-800" />
              {areaPath && <path d={areaPath} fill="url(#globalChartGrad)" />}
              {visitorsPath && <path d={visitorsPath} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
              {points.map((p, idx) => (
                <circle key={idx} cx={p.x} cy={p.y} r="3.5" fill="#4f46e5" stroke="#ffffff" strokeWidth="1.5" />
              ))}
            </svg>
          </div>
          <div className="flex justify-between text-[9px] text-slate-450 text-slate-400 font-semibold px-2">
            <span>Week 1</span>
            <span>Week 2</span>
            <span>Week 3</span>
            <span>Week 4 (Current)</span>
          </div>
        </div>

        {/* Chatbots Leaderboard */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-1.5 text-indigo-650 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="h-4.5 w-4.5" />
            <h4 className="font-bold text-xs">Chatbot Performance Ranking</h4>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
            {performers.length === 0 ? (
              <div className="py-6 text-center text-slate-400">No active chatbots found.</div>
            ) : (
              performers.map((bot, idx) => (
                <div key={bot.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-400 text-xs">{idx + 1}</span>
                    <div>
                      <span className="font-bold block">{bot.name}</span>
                      <span className="text-[10px] text-slate-450 text-slate-400">{bot.visitors} visitors</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-indigo-600 dark:text-indigo-400 block">{bot.leads} leads</span>
                    <span className="text-[9px] text-slate-400 font-semibold">{bot.conversionRate}% rate</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
