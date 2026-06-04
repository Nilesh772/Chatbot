"use client";

import { useEffect, useState } from "react";
import { Search, Download, Calendar, Mail, Phone, ExternalLink, Bot } from "lucide-react";

interface Lead {
  id: string;
  botId: string;
  botName: string;
  name?: string;
  email?: string;
  mobile?: string;
  source?: string;
  createdAt: string;
}

interface BotData {
  id: string;
  name: string;
}

export default function GlobalLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [bots, setBots] = useState<BotData[]>([]);
  const [search, setSearch] = useState("");
  const [selectedBotId, setSelectedBotId] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch bots list
        const botsRes = await fetch("/api/bots");
        const botsData = await botsRes.json();
        
        // Fetch global summary to aggregate leads
        const summaryRes = await fetch("/api/dashboard/summary");
        const summaryData = await summaryRes.json();
        
        if (!botsData.error) setBots(botsData.bots);
        if (!summaryData.error) setLeads(summaryData.recentLeads || []);
      } catch (e) {
        console.error("Failed to load global leads:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter leads based on search name/email/phone and specific bot dropdown selection
  const filteredLeads = leads.filter((lead) => {
    const nameMatch = lead.name?.toLowerCase().includes(search.toLowerCase()) ?? false;
    const emailMatch = lead.email?.toLowerCase().includes(search.toLowerCase()) ?? false;
    const mobileMatch = lead.mobile?.toLowerCase().includes(search.toLowerCase()) ?? false;
    const searchMatch = search === "" || nameMatch || emailMatch || mobileMatch;

    if (selectedBotId === "all") return searchMatch;
    return searchMatch && lead.botId === selectedBotId;
  });

  // Export CSV
  const handleExportCSV = () => {
    if (filteredLeads.length === 0) return;

    const headers = ["Name", "Email", "Mobile", "Chatbot Name", "Page Source", "Date Captured"];
    const rows = filteredLeads.map((l) => [
      l.name || "Anonymous",
      l.email || "N/A",
      l.mobile || "N/A",
      l.botName || "Chatbot",
      l.source || "Widget Direct",
      new Date(l.createdAt).toLocaleString(),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        headers.join(","),
        ...rows.map((r) => r.map((val) => `"${val.replace(/"/g, '""')}"`).join(",")),
      ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `chetbot_global_leads_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Global Captured Leads</h1>
          <p className="text-sm text-slate-500 mt-1">Review contact information captured across all active web widgets.</p>
        </div>
      </div>

      {/* Search & Export Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 max-w-md">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or mobile..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-4 py-2.5 text-xs outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Chatbot selector */}
          <select
            value={selectedBotId}
            onChange={(e) => setSelectedBotId(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs outline-none focus:border-indigo-500 text-slate-600 dark:text-slate-455"
          >
            <option value="all">All Chatbots</option>
            {bots.map((bot) => (
              <option key={bot.id} value={bot.id}>
                {bot.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={filteredLeads.length === 0}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold px-4 py-2.5 text-xs shadow-sm disabled:opacity-40 transition-colors"
        >
          <Download className="h-4 w-4" />
          Export All CSV
        </button>
      </div>

      {/* Leads Table Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 font-semibold">
                <th className="px-6 py-4.5">Name</th>
                <th className="px-6 py-4.5">Email</th>
                <th className="px-6 py-4.5">Mobile</th>
                <th className="px-6 py-4.5">Chatbot Origin</th>
                <th className="px-6 py-4.5">Captured From</th>
                <th className="px-6 py-4.5">Date Captured</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-450 text-slate-400">
                    No matching leads found.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
                      {lead.name || "Anonymous Visitor"}
                    </td>
                    <td className="px-6 py-4 text-slate-655 dark:text-slate-455 font-medium">
                      {lead.email ? (
                        <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          {lead.email}
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-655 dark:text-slate-455 font-medium">
                      {lead.mobile ? (
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          {lead.mobile}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold">
                      <span className="inline-flex items-center gap-1 rounded bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 text-[10px] text-indigo-605 text-indigo-600 dark:text-indigo-400">
                        <Bot className="h-3 w-3 shrink-0" />
                        {lead.botName}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-[150px] truncate text-slate-600 dark:text-slate-400 font-mono text-[10px]">
                      {lead.source ? (
                        <a
                          href={lead.source}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                          {lead.source.replace(/^https?:\/\/(www\.)?/, "").substring(0, 20)}
                          <ExternalLink className="h-3 w-3 inline" />
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">Direct Embed</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
