"use client";

import { useEffect, useState } from "react";
import { Search, Download, Calendar, Mail, Phone, ExternalLink } from "lucide-react";

interface Lead {
  id: string;
  name?: string;
  email?: string;
  mobile?: string;
  source?: string;
  createdAt: string;
}

export default function LeadsTab({ botId }: { botId: string }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeads() {
      try {
        const res = await fetch(`/api/bots/${botId}/leads`);
        const data = await res.json();
        if (!data.error) {
          setLeads(data.leads);
        }
      } catch (e) {
        console.error("Failed to load leads:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchLeads();
  }, [botId]);

  // Filter leads based on search name/email/phone and source filter
  const filteredLeads = leads.filter((lead) => {
    const nameMatch = lead.name?.toLowerCase().includes(search.toLowerCase()) ?? false;
    const emailMatch = lead.email?.toLowerCase().includes(search.toLowerCase()) ?? false;
    const mobileMatch = lead.mobile?.toLowerCase().includes(search.toLowerCase()) ?? false;
    const searchMatch = search === "" || nameMatch || emailMatch || mobileMatch;

    if (sourceFilter === "all") return searchMatch;
    
    const sourceMatch = lead.source?.toLowerCase().includes(sourceFilter.toLowerCase()) ?? false;
    return searchMatch && sourceMatch;
  });

  // Unique sources for filter dropdown
  const uniqueSources = Array.from(
    new Set(leads.map((l) => l.source).filter(Boolean))
  ) as string[];

  // Export CSV
  const handleExportCSV = () => {
    if (filteredLeads.length === 0) return;

    const headers = ["Name", "Email", "Mobile", "Page Source", "Date Captured"];
    const rows = filteredLeads.map((l) => [
      l.name || "Anonymous",
      l.email || "N/A",
      l.mobile || "N/A",
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
    link.setAttribute("download", `chatbot_leads_${botId}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
              placeholder="Search leads by name, email, or mobile..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-4 py-2.5 text-xs outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Filter dropdown */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs outline-none focus:border-indigo-500 text-slate-600 dark:text-slate-450"
          >
            <option value="all">All Sources</option>
            {uniqueSources.map((src, idx) => (
              <option key={idx} value={src}>
                {src.replace(/^https?:\/\/(www\.)?/, "").substring(0, 24)}...
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
          Export CSV
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
                <th className="px-6 py-4.5">Captured From</th>
                <th className="px-6 py-4.5">Date Captured</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-450 text-slate-400">
                    No matching leads found.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
                      {lead.name || "Anonymous Visitor"}
                    </td>
                    <td className="px-6 py-4 text-slate-650 dark:text-slate-450 font-medium">
                      {lead.email ? (
                        <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          {lead.email}
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-650 dark:text-slate-450 font-medium">
                      {lead.mobile ? (
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          {lead.mobile}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 max-w-[200px] truncate text-slate-600 dark:text-slate-400 font-mono text-[10.5px]">
                      {lead.source ? (
                        <a
                          href={lead.source}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                          {lead.source.replace(/^https?:\/\/(www\.)?/, "")}
                          <ExternalLink className="h-3 w-3 inline" />
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">Direct Embed</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(lead.createdAt).toLocaleDateString()} {new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Count footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-900/10 text-slate-400 font-semibold text-[10px] uppercase">
          Total Captured: {filteredLeads.length} Lead{filteredLeads.length === 1 ? "" : "s"}
        </div>
      </div>
    </div>
  );
}
