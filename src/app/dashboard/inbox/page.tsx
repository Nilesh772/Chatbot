"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Search, Send, User, Bot, CheckCircle, XCircle,
  Clock, Inbox, AlertCircle, RefreshCw as RefreshCwIcon,
  MessageSquare, UserCheck, CheckCircle2, ChevronDown, Share2, X, Users
} from "lucide-react";

interface Message {
  id: string;
  sender: "bot" | "user" | "agent";
  text: string;
  payload?: any;
  createdAt: string;
}

interface Conversation {
  id: string;
  botId: string;
  sessionId: string;
  visitorName?: string;
  visitorEmail?: string;
  department?: string;
  status: string;
  assignedAgentId?: string;
  collaboratorIds?: string[];
  startedAt?: string;
  closedAt?: string;
  variables?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
}

interface BotData {
  id: string;
  name: string;
}

export default function InboxPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
      </div>
    }>
      <InboxContent />
    </Suspense>
  );
}

function InboxContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const queryConvId = searchParams.get("convId");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [bots, setBots] = useState<BotData[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);

  const [statusFilter, setStatusFilter] = useState<"all" | "waiting" | "active" | "closed">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBotId, setSelectedBotId] = useState<string>("all");

  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  const [openTransferDialog, setOpenTransferDialog] = useState(false);
  const [transferDept, setTransferDept] = useState("General Support");
  const [isCustomDept, setIsCustomDept] = useState(false);
  const [customDeptName, setCustomDeptName] = useState("");
  const [transferAgentId, setTransferAgentId] = useState("");
  const [agents, setAgents] = useState<any[]>([]);
  const [transferring, setTransferring] = useState(false);

  const [deptAgentInfo, setDeptAgentInfo] = useState<{ total: number; online: number; department: string } | null>(null);

  const [toastMessage, setToastMessage] = useState("");
  const [toastSeverity, setToastSeverity] = useState<"success" | "error">("success");
  const [openToast, setOpenToast] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const showToast = (msg: string, severity: "success" | "error") => {
    setToastMessage(msg);
    setToastSeverity(severity);
    setOpenToast(true);
    setTimeout(() => setOpenToast(false), 4000);
  };

  const refreshAgents = async () => {
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      if (data.success && data.agents) {
        setAgents(data.agents);
      }
    } catch (e) {
      console.error("Failed to load agents:", e);
    }
  };

  const checkAutoRelease = async (convs: Conversation[]) => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    for (const c of convs) {
      if (c.status === "active" && c.assignedAgentId) {
        const lastMsg = c.messages?.[0];
        if (lastMsg && lastMsg.sender === "user") {
          const lastMsgTime = new Date(lastMsg.createdAt).getTime();
          if (lastMsgTime < fiveMinutesAgo) {
            try {
              const res = await fetch(`/api/conversations/${c.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  status: "waiting_agent",
                  assignedAgentId: null
                })
              });
              const data = await res.json();
              if (data.success) {
                if (selectedConvId === c.id) {
                  loadActiveConversation(c.id, false);
                }
              }
            } catch (err) {
              console.error("Auto-release failed for conversation:", c.id, err);
            }
          }
        }
      }
    }
  };

  useEffect(() => {
    async function loadInitialData() {
      try {
        const botsRes = await fetch("/api/bots");
        const botsData = await botsRes.json();
        if (!botsData.error) setBots(botsData.bots);
        await refreshConversations(true);
        await refreshAgents();
      } catch (e) {
        console.error("Error loading initial inbox data:", e);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedConvId) {
      loadActiveConversation(selectedConvId);
    } else {
      setActiveConversation(null);
      setDeptAgentInfo(null);
    }
  }, [selectedConvId]);

  // Load dept agent info when conversation changes to waiting_agent
  useEffect(() => {
    if (activeConversation?.status === "waiting_agent" && activeConversation.department) {
      fetch(`/api/departments/agents?department=${encodeURIComponent(activeConversation.department)}`)
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            setDeptAgentInfo({ total: data.total, online: data.online, department: data.department });
          }
        })
        .catch(() => {});
    } else {
      setDeptAgentInfo(null);
    }
  }, [activeConversation?.id, activeConversation?.status, activeConversation?.department]);

  useEffect(() => {
    if (queryConvId && conversations.some(c => c.id === queryConvId)) {
      setSelectedConvId(queryConvId);
    }
  }, [queryConvId, conversations]);

  useEffect(() => {
    const timer = setInterval(() => {
      refreshConversations(false);
      if (selectedConvId) loadActiveConversation(selectedConvId, false);
      refreshAgents();
    }, 3000);
    return () => clearInterval(timer);
  }, [selectedConvId, statusFilter, searchQuery, selectedBotId]);

  async function loadActiveConversation(id: string, showLoadingState = true) {
    try {
      const res = await fetch(`/api/conversations/${id}`);
      const data = await res.json();
      if (data.success && data.conversation) {
        const conv = data.conversation;
        if (conv.messages) {
          conv.messages = conv.messages.map((m: any) => ({
            ...m,
            payload: typeof m.payload === "string" ? JSON.parse(m.payload) : m.payload
          }));
        }
        setActiveConversation(conv);
        if (showLoadingState) setTimeout(scrollToBottom, 50);
      }
    } catch (e) {
      console.error("Error loading conversation:", e);
    }
  }

  async function refreshConversations(setFirstSelect = false) {
    try {
      const url = selectedBotId !== "all" ? `/api/conversations?botId=${selectedBotId}` : "/api/conversations";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.conversations) {
        const convs = data.conversations;
        setConversations(convs);
        checkAutoRelease(convs);
        if (setFirstSelect && convs.length > 0) {
          if (queryConvId && convs.some((c: Conversation) => c.id === queryConvId)) {
            setSelectedConvId(queryConvId);
          } else if (!selectedConvId) {
            setSelectedConvId(convs[0].id);
          }
        }
      }
    } catch (e) {
      console.error("Error refreshing conversations:", e);
    }
  }

  const filteredConversations = conversations.filter(c => {
    if (statusFilter === "waiting" && c.status !== "waiting_agent") return false;
    if (statusFilter === "active" && c.status !== "active") return false;
    if (statusFilter === "closed" && c.status !== "closed") return false;
    const q = searchQuery.toLowerCase();
    return q === "" ||
      c.visitorName?.toLowerCase().includes(q) ||
      c.visitorEmail?.toLowerCase().includes(q) ||
      c.department?.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q);
  });

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || !activeConversation || sending) return;
    setSending(true);
    const textToSend = replyText.trim();
    setReplyText("");
    try {
      const res = await fetch(`/api/conversations/${activeConversation.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender: "agent", text: textToSend })
      });
      const data = await res.json();
      if (data.success) {
        await loadActiveConversation(activeConversation.id, false);
        await refreshConversations(false);
        setTimeout(scrollToBottom, 50);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleAcceptChat = async () => {
    if (!activeConversation) return;
    try {
      const res = await fetch(`/api/conversations/${activeConversation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active", assignedAgentId: user?.id || "usr-agent", startedAt: new Date().toISOString() })
      });
      const data = await res.json();
      if (data.success) {
        await loadActiveConversation(activeConversation.id, false);
        await refreshConversations(false);
        showToast("Conversation accepted", "success");
      } else {
        showToast(data.error || "Failed to accept conversation", "error");
      }
    } catch (e) {
      console.error("Failed to accept conversation:", e);
      showToast("Failed to accept conversation", "error");
    }
  };

  const handleRejectChat = async () => {
    if (!activeConversation) return;
    try {
      const res = await fetch(`/api/conversations/${activeConversation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed", closedAt: new Date().toISOString() })
      });
      const data = await res.json();
      if (data.success) {
        showToast("Conversation rejected & closed", "success");
        await loadActiveConversation(activeConversation.id, false);
        await refreshConversations(false);
      } else {
        showToast(data.error || "Failed to reject conversation", "error");
      }
    } catch (e) {
      console.error("Failed to reject conversation:", e);
      showToast("Failed to reject conversation", "error");
    }
  };

  const handleCloseChat = async () => {
    if (!activeConversation) return;
    try {
      const res = await fetch(`/api/conversations/${activeConversation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed", closedAt: new Date().toISOString() })
      });
      const data = await res.json();
      if (data.success) {
        await loadActiveConversation(activeConversation.id, false);
        await refreshConversations(false);
      }
    } catch (e) { console.error("Failed to close conversation:", e); }
  };

  const handleOpenTransfer = async () => {
    if (!activeConversation) return;
    const currentDept = activeConversation.department || "General Support";
    if (["General Support", "Sales", "Billing", "Technical Support"].includes(currentDept)) {
      setTransferDept(currentDept); setIsCustomDept(false); setCustomDeptName("");
    } else {
      setTransferDept("Custom"); setIsCustomDept(true); setCustomDeptName(currentDept);
    }
    setTransferAgentId(activeConversation.assignedAgentId || "");
    setOpenTransferDialog(true);
    await refreshAgents();
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversation || transferring) return;
    setTransferring(true);
    const finalDept = isCustomDept ? customDeptName.trim() : transferDept;
    if (isCustomDept && !customDeptName.trim()) {
      showToast("Please specify custom department name", "error");
      setTransferring(false); return;
    }
    try {
      const res = await fetch(`/api/conversations/${activeConversation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ department: finalDept, assignedAgentId: transferAgentId || null })
      });
      const data = await res.json();
      if (data.success) {
        showToast("Conversation transferred successfully!", "success");
        setOpenTransferDialog(false);
        await loadActiveConversation(activeConversation.id, false);
        await refreshConversations(false);
      } else {
        showToast(data.error || "Failed to transfer conversation", "error");
      }
    } catch (e: any) {
      showToast(e.message || "Failed to transfer conversation", "error");
    } finally {
      setTransferring(false);
    }
  };

  const handleJoinChat = async () => {
    if (!activeConversation) return;
    try {
      const res = await fetch(`/api/conversations/${activeConversation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join" })
      });
      const data = await res.json();
      if (data.success) {
        showToast("You joined the collaboration!", "success");
        await loadActiveConversation(activeConversation.id, false);
        await refreshConversations(false);
      } else {
        showToast(data.error || "Failed to join collaboration", "error");
      }
    } catch (e) {
      console.error("Failed to join collaboration:", e);
    }
  };

  const handleLeaveChat = async () => {
    if (!activeConversation) return;
    try {
      const res = await fetch(`/api/conversations/${activeConversation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "leave" })
      });
      const data = await res.json();
      if (data.success) {
        showToast("You left the collaboration", "success");
        await loadActiveConversation(activeConversation.id, false);
        await refreshConversations(false);
      } else {
        showToast(data.error || "Failed to leave collaboration", "error");
      }
    } catch (e) {
      console.error("Failed to leave collaboration:", e);
    }
  };

  const handleDirectTransfer = async (targetAgentId: string) => {
    if (!activeConversation) return;
    try {
      const res = await fetch(`/api/conversations/${activeConversation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedAgentId: targetAgentId })
      });
      const data = await res.json();
      if (data.success) {
        showToast("Conversation transferred successfully!", "success");
        await loadActiveConversation(activeConversation.id, false);
        await refreshConversations(false);
      } else {
        showToast(data.error || "Failed to transfer conversation", "error");
      }
    } catch (e) {
      console.error("Failed to transfer conversation:", e);
    }
  };

  const getBotName = (botId: string) => {
    const bot = bots.find(b => b.id === botId);
    return bot ? bot.name : "Unknown Bot";
  };

  const statusConfig = {
    waiting_agent: { label: "Waiting", color: "bg-amber-500", pill: "bg-amber-50 text-amber-700 border-amber-200" },
    active: { label: "Active", color: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    closed: { label: "Closed", color: "bg-slate-400", pill: "bg-slate-100 text-slate-500 border-slate-200" },
    bot: { label: "Bot", color: "bg-indigo-500", pill: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  };

  const getStatusCfg = (status: string) =>
    statusConfig[status as keyof typeof statusConfig] || statusConfig.bot;

  const isAssigned = activeConversation?.assignedAgentId === user?.id;
  const isCollaborator = activeConversation && (activeConversation.collaboratorIds || []).includes(user?.id || "");
  const isAdminOrSuper = !!user?.role && (user.role.toLowerCase() === "admin" || user.role.toLowerCase() === "super admin" || user.role.toLowerCase() === "super_admin");
  const hasAccessToActive = isAssigned || isCollaborator || isAdminOrSuper;

  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-slate-50 font-sans">

      {/* ── COLUMN 1: SIDEBAR ── */}
      <div className="w-[300px] shrink-0 bg-white border-r border-slate-100 flex flex-col h-full shadow-sm">

        {/* Header */}
        <div className="px-4 pt-5 pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                <MessageSquare className="h-3.5 w-3.5 text-white" />
              </div>
              <h2 className="text-sm font-bold text-slate-800">Conversations</h2>
            </div>
            <button
              onClick={() => refreshConversations(false)}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-150"
              title="Refresh"
            >
              <RefreshCwIcon className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-700 placeholder:text-slate-400"
            />
          </div>

          {/* Bot Filter */}
          <div className="relative">
            <select
              value={selectedBotId}
              onChange={(e) => setSelectedBotId(e.target.value)}
              className="w-full appearance-none pl-3 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-700 cursor-pointer"
            >
              <option value="all">All Chatbots</option>
              {bots.map(bot => (
                <option key={bot.id} value={bot.id}>{bot.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex gap-0.5 p-2 bg-slate-50 mx-3 mt-3 rounded-xl border border-slate-100 shrink-0">
          {(["all", "waiting", "active", "closed"] as const).map(tab => {
            const count = tab === "waiting"
              ? conversations.filter(c => c.status === "waiting_agent").length
              : tab === "active"
                ? conversations.filter(c => c.status === "active").length
                : 0;
            const isActive = statusFilter === tab;
            return (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all duration-200 ${isActive
                  ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60"
                  : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                <span className="flex items-center justify-center gap-1">
                  {tab}
                  {count > 0 && (
                    <span className={`h-1.5 w-1.5 rounded-full ${tab === "waiting" ? "bg-amber-500" : "bg-emerald-500"} ${isActive ? "animate-pulse" : ""}`} />
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-500 border-t-transparent" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                <Inbox className="h-5 w-5 text-slate-400" />
              </div>
              <p className="text-xs font-semibold text-slate-500">No conversations found</p>
            </div>
          ) : (
            filteredConversations.map(c => {
              const isSelected = c.id === selectedConvId;
              const lastMsg = c.messages?.[0];
              const cfg = getStatusCfg(c.status);

              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedConvId(c.id)}
                  className={`w-full text-left p-3 rounded-xl flex gap-3 transition-all duration-150 relative outline-none ${isSelected
                    ? "bg-indigo-50 border border-indigo-100"
                    : "bg-transparent hover:bg-slate-50 border border-transparent"
                    }`}
                >
                  {isSelected && (
                    <div className="absolute left-0 top-4 bottom-4 w-0.5 bg-indigo-500 rounded-r-full" />
                  )}

                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-sm font-bold ${isSelected ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500"}`}>
                      {c.visitorName ? c.visitorName[0].toUpperCase() : "A"}
                    </div>
                    {(c.status === "waiting_agent" || c.status === "active") && (
                      <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${c.status === "waiting_agent" ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <span className={`text-xs font-semibold truncate ${isSelected ? "text-indigo-700" : "text-slate-700"}`}>
                        {c.visitorName || "Anonymous Visitor"}
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium shrink-0 ml-1">
                        {new Date(c.updatedAt || c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {lastMsg ? lastMsg.text : "No messages yet"}
                    </p>
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500">
                        {getBotName(c.botId)}
                      </span>
                      {c.department && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-violet-50 text-violet-600 border border-violet-100">
                          {c.department}
                        </span>
                      )}
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md border ${cfg.pill}`}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── COLUMN 2: CHAT AREA ── */}
      <div className="flex-1 flex flex-col h-full bg-slate-50 border-r border-slate-100">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-slate-100 px-6 py-3.5 flex items-center justify-between shrink-0 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  {activeConversation.visitorName ? activeConversation.visitorName[0].toUpperCase() : "A"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-800">
                      {activeConversation.visitorName || "Anonymous Visitor"}
                    </h3>
                    {activeConversation.department && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                        {activeConversation.department}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${getStatusCfg(activeConversation.status).color}`} />
                    <span className="text-[10px] text-slate-400 font-medium">
                      ID: {activeConversation.id.substring(0, 8)}… · Bot: {getBotName(activeConversation.botId)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {activeConversation.status === "waiting_agent" && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleAcceptChat}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all duration-150 active:scale-95"
                    >
                      <UserCheck className="h-3.5 w-3.5" /> Accept Chat
                    </button>
                    <button
                      onClick={handleRejectChat}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-rose-650 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all duration-150 active:scale-95"
                    >
                      <X className="h-3.5 w-3.5" /> Reject Chat
                    </button>
                  </div>
                )}

                {activeConversation.status === "active" && hasAccessToActive && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleOpenTransfer}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition-all duration-150 active:scale-95"
                    >
                      <Share2 className="h-3.5 w-3.5" /> Transfer
                    </button>
                    <button
                      onClick={handleCloseChat}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-red-650 bg-red-50 hover:bg-red-100 border border-red-100 transition-all duration-150 active:scale-95"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Close
                    </button>
                  </div>
                )}

                {activeConversation.status === "closed" && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
                      Conversation Closed
                    </span>
                    <button
                      onClick={handleAcceptChat}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all duration-150 active:scale-95"
                    >
                      <RefreshCwIcon className="h-3.5 w-3.5" /> Reopen & Accept
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {activeConversation.messages && activeConversation.messages.length > 0 ? (
                activeConversation.messages.map((m) => {
                  const isAgent = m.sender === "agent";
                  const isBot = m.sender === "bot";
                  const isSystem = isBot && m.payload?.systemEvent === true;

                  if (isSystem) {
                    return (
                      <div key={m.id} className="flex justify-center my-2">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-white border border-slate-200 px-3.5 py-1.5 rounded-full shadow-sm">
                          <AlertCircle className="h-3 w-3 text-indigo-400" />
                          {m.text}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={m.id}
                      className={`flex gap-2.5 max-w-[80%] items-end ${isAgent ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                    >
                      {/* Avatar */}
                      <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${isAgent
                        ? "bg-indigo-600 text-white"
                        : isBot
                          ? "bg-violet-100 text-violet-600"
                          : "bg-slate-200 text-slate-600"
                        }`}>
                        {isBot ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                      </div>

                      {/* Bubble */}
                      <div className="space-y-1">
                        <div className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${isAgent
                          ? "bg-indigo-600 text-white rounded-br-sm"
                          : isBot
                            ? "bg-white text-slate-700 border border-slate-200 rounded-bl-sm shadow-sm"
                            : "bg-white text-slate-700 border border-slate-200 rounded-bl-sm shadow-sm"
                          }`}>
                          <p className="whitespace-pre-wrap break-words">{m.text}</p>
                          {!isAgent && m.payload?.options && m.payload.options.length > 0 && (
                            <div className="flex gap-1.5 flex-wrap mt-2.5 pt-2 border-t border-slate-100">
                              {m.payload.options.map((opt: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="text-[10px] font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100"
                                >
                                  {opt}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className={`text-[9px] text-slate-400 font-medium block px-1 ${isAgent ? "text-right" : "text-left"}`}>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                      <MessageSquare className="h-5 w-5 text-slate-400" />
                    </div>
                    <p className="text-xs text-slate-400 font-medium">No messages yet</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-slate-100 p-4 shrink-0">
              {activeConversation.status === "active" && hasAccessToActive ? (
                <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Type a reply… (Enter to send)"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-700 placeholder:text-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim() || sending}
                    className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white shadow-sm transition-all duration-150 active:scale-95 shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              ) : activeConversation.status === "active" ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center text-xs font-semibold text-slate-500">
                  This conversation is active and assigned to another agent. Join the conversation to participate.
                </div>
              ) : activeConversation.status === "waiting_agent" ? (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center space-y-2.5">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-700">
                    <Clock className="h-3.5 w-3.5" />
                    Waiting for agent — accept to reply
                  </div>
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={handleAcceptChat}
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all duration-150 active:scale-95"
                    >
                      <UserCheck className="h-3.5 w-3.5" /> Accept Chat
                    </button>
                    <button
                      onClick={handleRejectChat}
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-rose-650 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all duration-150 active:scale-95"
                    >
                      <X className="h-3.5 w-3.5" /> Reject Chat
                    </button>
                  </div>
                </div>
              ) : (!activeConversation.status || activeConversation.status === "bot") ? (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-center">
                  <p className="text-xs font-semibold text-indigo-700">Bot is handling this conversation.</p>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center text-xs font-semibold text-slate-500">
                  This conversation is closed. Reopening or further agent replies are locked.
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4">
              <MessageSquare className="h-7 w-7 text-indigo-400" />
            </div>
            <h3 className="font-bold text-slate-700 text-sm">No Conversation Selected</h3>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed mt-1.5">
              Select a conversation from the sidebar to view messages and reply.
            </p>
          </div>
        )}
      </div>

      {/* ── COLUMN 3: DETAILS & COLLABORATION ── */}
      {activeConversation && (
        <div className="w-[280px] shrink-0 bg-white border-l border-slate-100 flex flex-col h-full shadow-sm p-4 overflow-y-auto space-y-6">
          {/* Metadata section */}
          <div>
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">Conversation Info</h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-405">Visitor:</span>
                <span className="font-bold text-slate-750">{activeConversation.visitorName || "Anonymous"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-405">Email:</span>
                <span className="font-semibold text-slate-600 truncate max-w-[160px]" title={activeConversation.visitorEmail}>{activeConversation.visitorEmail || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-405">Department:</span>
                <span className="font-semibold text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{activeConversation.department || "General Support"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-405">Assignee:</span>
                <span className="font-bold text-slate-750">
                  {agents.find(a => a.id === activeConversation.assignedAgentId)?.name || "Unassigned"}
                </span>
              </div>
            </div>
          </div>

          {/* Department Agent Info (shown when waiting_agent) */}
          {activeConversation.status === "waiting_agent" && deptAgentInfo && (
            <>
              <hr className="border-slate-100" />
              <div>
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">Department Agents</h3>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Department</span>
                    <span className="font-bold text-amber-700">{deptAgentInfo.department}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Total Agents</span>
                    <span className="font-bold text-slate-700">{deptAgentInfo.total}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Online Now</span>
                    <span className="flex items-center gap-1.5 font-bold text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {deptAgentInfo.online}
                    </span>
                  </div>
                  <div className="pt-1 border-t border-amber-100">
                    <p className="text-[10px] text-amber-700 font-semibold text-center">
                      All {deptAgentInfo.department} agents notified
                    </p>
                    <p className="text-[9px] text-amber-600 text-center mt-0.5">
                      Any agent or SuperAdmin can accept this chat
                    </p>
                  </div>
                  <button
                    onClick={handleAcceptChat}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all duration-150 active:scale-95 mt-1"
                  >
                    <UserCheck className="h-3.5 w-3.5" /> Accept This Chat
                  </button>
                </div>
              </div>
            </>
          )}

          <hr className="border-slate-100" />

          {/* Collaboration Actions */}
          <div>
            <h3 className="text-xs font-extrabold text-slate-405 uppercase tracking-wider mb-3">Collaboration</h3>
            {(() => {
              const isAssigned = activeConversation.assignedAgentId === user?.id;
              const collaboratorIds = activeConversation.collaboratorIds || [];
              const isCollaborator = collaboratorIds.includes(user?.id || "");

              if (isAssigned) {
                return (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center space-y-2">
                    <p className="text-[11px] font-semibold text-emerald-700">You are the primary assignee</p>
                    <button
                      onClick={handleLeaveChat}
                      className="w-full py-1.5 rounded-lg text-xs font-bold text-red-650 bg-white border border-red-200 hover:bg-red-50 transition-colors shadow-sm"
                    >
                      Leave Conversation
                    </button>
                  </div>
                );
              }

              if (isCollaborator) {
                return (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-center space-y-2">
                    <p className="text-[11px] font-semibold text-indigo-700">You are collaborating on this chat</p>
                    <button
                      onClick={handleLeaveChat}
                      className="w-full py-1.5 rounded-lg text-xs font-bold text-red-650 bg-white border border-red-200 hover:bg-red-50 transition-colors shadow-sm"
                    >
                      Leave Collaboration
                    </button>
                  </div>
                );
              }

              return (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center space-y-2">
                  <p className="text-[11px] text-slate-505 font-medium">Join the conversation to help the assignee</p>
                  <button
                    onClick={handleJoinChat}
                    className="w-full py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    Join Conversation
                  </button>
                </div>
              );
            })()}
          </div>

          <hr className="border-slate-100" />

          {/* Collaborators List */}
          <div>
            <h3 className="text-xs font-extrabold text-slate-405 uppercase tracking-wider mb-3">Active Collaborators</h3>
            {(() => {
              const collaboratorIds = activeConversation.collaboratorIds || [];
              if (collaboratorIds.length === 0) {
                return <p className="text-xs text-slate-400 italic">No other agents joined yet.</p>;
              }
              return (
                <div className="space-y-2">
                  {collaboratorIds.map((cid: string) => {
                    const agent = agents.find(a => a.id === cid);
                    if (!agent) return null;
                    return (
                      <div key={cid} className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                        <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600 shrink-0">
                          {agent.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="truncate">{agent.name}</span>
                        <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1 rounded ml-auto">Collaborator</span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          <hr className="border-slate-100" />

          {/* Presence & Direct Transfer */}
          <div>
            <h3 className="text-xs font-extrabold text-slate-405 uppercase tracking-wider mb-3">Presence & Transfer</h3>
            <div className="space-y-2">
              {agents.filter(a => a.id !== user?.id).length === 0 ? (
                <p className="text-xs text-slate-400 italic">No other agents registered.</p>
              ) : (
                agents.filter(a => a.id !== user?.id).map((agent) => {
                  const status = agent.agentStatus || "offline";
                  const statusColor =
                    status === "online" ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]" :
                    status === "busy" ? "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.4)]" :
                    status === "away" ? "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]" :
                    "bg-slate-400";

                  return (
                    <div key={agent.id} className="flex items-center justify-between gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 group/item hover:border-indigo-100 transition-all">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`h-2 w-2 rounded-full shrink-0 ${statusColor}`} />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-705 truncate leading-tight">{agent.name}</p>
                          <p className="text-[9px] text-slate-405 capitalize truncate mt-0.5">{status} · {agent.department || "No Dept"}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDirectTransfer(agent.id)}
                        className="px-2.5 py-1 rounded bg-white border border-slate-200 text-[10px] font-bold text-indigo-650 hover:bg-indigo-50 hover:border-indigo-150 transition-all opacity-0 group-hover/item:opacity-100 shadow-sm"
                        title={`Transfer to ${agent.name}`}
                      >
                        Transfer
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TRANSFER DIALOG ── */}
      {openTransferDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-xl border border-slate-100 overflow-hidden">
            {/* Dialog Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                  <Share2 className="h-3.5 w-3.5 text-white" />
                </div>
                <h3 className="font-bold text-sm text-slate-800">Transfer Conversation</h3>
              </div>
              <button
                onClick={() => setOpenTransferDialog(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="p-5 space-y-4">
              {/* Department */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-655">Target Department</label>
                <div className="relative">
                  <select
                    value={transferDept}
                    onChange={(e) => { setTransferDept(e.target.value); setIsCustomDept(e.target.value === "Custom"); }}
                    className="w-full appearance-none pl-3 pr-8 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-700 cursor-pointer"
                  >
                    <option value="General Support">General Support</option>
                    <option value="Sales">Sales</option>
                    <option value="Billing">Billing</option>
                    <option value="Technical Support">Technical Support</option>
                    <option value="Custom">Custom…</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-405 pointer-events-none" />
                </div>
              </div>

              {isCustomDept && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-655">Custom Department Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Customer Success"
                    value={customDeptName}
                    onChange={(e) => setCustomDeptName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-700 placeholder:text-slate-400"
                  />
                </div>
              )}

              {/* Agent */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-655">Assign Agent</label>
                <div className="relative">
                  <select
                    value={transferAgentId}
                    onChange={(e) => setTransferAgentId(e.target.value)}
                    className="w-full appearance-none pl-3 pr-8 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-700 cursor-pointer"
                  >
                    <option value="">None / Unassigned</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name} ({agent.department || "No Dept"})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-405 pointer-events-none" />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 mt-4">
                <button
                  type="button"
                  onClick={() => setOpenTransferDialog(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferring}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all duration-150 disabled:opacity-60"
                >
                  {transferring ? "Transferring…" : "Transfer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      {openToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-3 duration-300">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-lg border text-xs font-semibold ${toastSeverity === "success"
            ? "bg-white text-emerald-700 border-emerald-100"
            : "bg-white text-red-600 border-red-100"
            }`}>
            {toastSeverity === "success"
              ? <CheckCircle className="h-4 w-4 text-emerald-505 shrink-0" />
              : <XCircle className="h-4 w-4 text-red-505 shrink-0" />
            }
            <span>{toastMessage}</span>
            <button
              onClick={() => setOpenToast(false)}
              className="ml-2 text-slate-400 hover:text-slate-655 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
