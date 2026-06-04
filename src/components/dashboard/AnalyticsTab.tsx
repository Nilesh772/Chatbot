"use client";

import { useEffect, useState } from "react";
import { Users, MessageSquare, Bot, BarChart3, AlertCircle, ArrowDown } from "lucide-react";

interface AnalyticsSummary {
  visitors: number;
  chats: number;
  leads: number;
  conversionRate: number;
  chartData: Array<{ date: string; visitors: number; chats: number; leads: number }>;
  popularFlows: Array<{ name: string; count: number; rate: number }>;
  dropOffPoints: Array<{ stage: string; drops: number }>;
}

export default function AnalyticsTab({ botId }: { botId: string }) {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch(`/api/bots/${botId}/analytics?period=${period}`);
        const result = await res.json();
        if (!result.error) {
          setData(result);
        }
      } catch (e) {
        console.error("Failed to load analytics:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [botId, period]);

  if (loading || !data) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  // Draw custom SVG chart coordinates
  const visitorsArray = data.chartData.map((d) => d.visitors);
  const maxVal = Math.max(...visitorsArray, 10); // safeguard division by zero

  const width = 600;
  const height = 180;
  const padding = 15;

  const points = data.chartData.map((item, idx) => {
    const x = padding + (idx / (data.chartData.length - 1)) * (width - padding * 2);
    // invert Y coordinates for SVG canvas
    const y = height - padding - (item.visitors / maxVal) * (height - padding * 2);
    const chatsY = height - padding - (item.chats / maxVal) * (height - padding * 2);
    return { x, y, chatsY };
  });

  const visitorsPath = points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const chatsPath = points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.chatsY}`).join(" ");

  // Create area fill path (closes path at bottom-right and bottom-left)
  const areaPath = points.length > 0 
    ? `${visitorsPath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z` 
    : "";

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm">Performance Analysis</h3>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs outline-none focus:border-indigo-500 text-slate-500 font-semibold"
        >
          <option value="7">Last 7 Days</option>
          <option value="15">Last 15 Days</option>
          <option value="30">Last 30 Days</option>
        </select>
      </div>

      {/* Mini metrics widgets */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Visitors</span>
          <p className="mt-1 text-2xl font-extrabold tracking-tight">{data.visitors}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Chats Started</span>
          <p className="mt-1 text-2xl font-extrabold tracking-tight">{data.chats}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Leads Captured</span>
          <p className="mt-1 text-2xl font-extrabold tracking-tight">{data.leads}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Conversion Rate</span>
          <p className="mt-1 text-2xl font-extrabold tracking-tight">{data.conversionRate}%</p>
        </div>
      </div>

      {/* SVG Daily Visitor Trend Chart */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-xs">Traffic & Interaction Daily Funnel</h4>
          <div className="flex items-center gap-4 text-[10px] font-semibold">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-indigo-500" /> Visitors</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-violet-400" /> Chats</span>
          </div>
        </div>

        {/* SVG Wrapper */}
        <div className="relative w-full overflow-hidden">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-h-[220px]">
            {/* Definitions for Gradients */}
            <defs>
              <linearGradient id="chartAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid coordinates */}
            <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#e2e8f0" strokeDasharray="3,3" className="dark:stroke-slate-800" />
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#cbd5e1" strokeWidth="1" className="dark:stroke-slate-850" />

            {/* Area under curve */}
            {areaPath && <path d={areaPath} fill="url(#chartAreaGradient)" />}

            {/* Line Paths */}
            {visitorsPath && <path d={visitorsPath} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
            {chatsPath && <path d={chatsPath} fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}

            {/* Render chart anchor points */}
            {points.map((p, idx) => {
              if (idx % Math.ceil(data.chartData.length / 5) !== 0) return null; // Show sparse dots
              return (
                <g key={idx}>
                  <circle cx={p.x} cy={p.y} r="3.5" fill="#4f46e5" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx={p.x} cy={p.chatsY} r="3" fill="#a78bfa" stroke="#ffffff" strokeWidth="1" />
                </g>
              );
            })}
          </svg>
        </div>

        {/* X Axis Date labels */}
        <div className="flex justify-between text-[9px] text-slate-400 font-semibold px-2">
          {data.chartData.map((item, idx) => {
            // Show every 6th item to avoid label overlaps
            if (idx % Math.ceil(data.chartData.length / 5) !== 0) return null;
            return <span key={idx}>{item.date}</span>;
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Popular Nodes table */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
          <h4 className="font-bold text-xs">Conversational Funnel Progression</h4>
          <div className="space-y-3">
            {data.popularFlows.map((flow, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-350">{flow.name}</span>
                  <span className="text-slate-400">{flow.count} calls ({flow.rate}%)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all duration-355"
                    style={{ width: `${flow.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Drop Off Points */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
          <h4 className="font-bold text-xs flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            Highest Drop-off Steps
          </h4>
          <div className="divide-y divide-slate-100 dark:divide-slate-850">
            {data.dropOffPoints.map((drop, idx) => (
              <div key={idx} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-lg bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-xs">
                    {idx + 1}
                  </div>
                  <div>
                    <span className="text-xs font-bold block">{drop.stage}</span>
                    <span className="text-[10px] text-slate-450 text-slate-400">Node interaction exit</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 font-bold text-xs">
                  <ArrowDown className="h-3.5 w-3.5 text-red-500" />
                  {drop.drops} drops
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
