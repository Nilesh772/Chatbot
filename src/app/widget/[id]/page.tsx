"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Send, User, Bot, AlertCircle, RotateCcw } from "lucide-react";

interface WidgetSettings {
  botName: string;
  avatarUrl: string;
  welcomeMessage: string;
  widgetColor: string;
  headerColor: string;
  position: string;
  bubbleStyle: string;
  font: string;
  borderRadius: number;
  launcherIcon?: string;
  headerTextColor?: string;
  leftMessageBgColor?: string;
  leftMessageTextColor?: string;
  rightMessageBgColor?: string;
  rightMessageTextColor?: string;
  widgetBgColor?: string;
  launcherGreeting?: string;
  launcherGreetingEnabled?: boolean;
  launcherAnimation?: string;
}

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  payload?: any;
}

const getPayloadObj = (payload: any) => {
  if (!payload) return null;
  if (typeof payload === "string") {
    try {
      return JSON.parse(payload);
    } catch {
      return null;
    }
  }
  return payload;
};

export default function WidgetChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const botId = params.id as string;

  const [settings, setSettings] = useState<WidgetSettings | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string>("");
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeInputNode, setActiveInputNode] = useState<{
    id: string;
    type: string;
    options?: string[];
    fields?: any[];
    inputType?: string;
  } | null>(null);

  const [formValues, setFormValues] = useState<{ [key: string]: string }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [sessionsList, setSessionsList] = useState<{ id: string; timestamp: number; lastMessage: string }[]>([]);
  const [activeScreen, setActiveScreen] = useState<"home" | "chat">("home");

  // Load sessions list from localStorage on botId change
  useEffect(() => {
    if (!botId) return;
    const raw = localStorage.getItem(`chetbot_sessions_${botId}`);
    if (raw) {
      try {
        setSessionsList(JSON.parse(raw));
      } catch {
        setSessionsList([]);
      }
    }
  }, [botId]);

  // 1. Initialize sessionId and settings
  useEffect(() => {
    if (!botId) return;

    // Load or create sessionId
    let sessId = localStorage.getItem(`chetbot_sess_${botId}`);
    if (!sessId) {
      sessId = `sess_${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem(`chetbot_sess_${botId}`, sessId);
    }
    setSessionId(sessId);

    // Make sure it is in our sessions list
    const rawList = localStorage.getItem(`chetbot_sessions_${botId}`);
    let list: any[] = [];
    if (rawList) {
      try { list = JSON.parse(rawList); } catch {}
    }
    if (!list.some(s => s.id === sessId)) {
      list.push({ id: sessId, timestamp: Date.now(), lastMessage: "Current Chat" });
      localStorage.setItem(`chetbot_sessions_${botId}`, JSON.stringify(list));
      setSessionsList(list);
    }

    // Fetch settings
    fetch(`/api/widget/${botId}/settings`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setSettings(data);
        }
      })
      .catch((err) => console.error("Error loading settings:", err));
  }, [botId]);

  // 2. Fetch conversation history once sessionId is set
  useEffect(() => {
    if (!botId || !sessionId) return;

    fetch(`/api/widget/${botId}/chat?sessionId=${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
          setActiveScreen("chat");
          // Look at the last message to check if it has inputs
          const lastMsg = data.messages[data.messages.length - 1];
          if (lastMsg.sender === "bot") {
            checkAndSetInputNode(lastMsg);
          }
        } else {
          // Start the flow only if we explicitly switched to the chat view (e.g. clicked Start New Chat)
          if (activeScreen === "chat") {
            triggerNextStep(null);
          } else {
            setActiveScreen("home");
          }
        }
      })
      .catch((err) => console.error("Error loading chat history:", err));
  }, [botId, sessionId]);

  // 3. Handle Auto Redirection if payload contains redirectUrl
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    let payload = lastMsg.payload;
    if (typeof payload === "string") {
      try {
        payload = JSON.parse(payload);
      } catch {
        payload = null;
      }
    }
    if (payload && payload.redirectUrl) {
      const url = payload.redirectUrl;
      const timer = setTimeout(() => {
        if (typeof window !== "undefined") {
          try {
            if (window.top) {
              window.top.location.href = url;
            } else {
              window.location.href = url;
            }
          } catch {
            window.location.href = url;
          }
        }
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  // 4. Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Check if a message has options, form fields, or captures text input
  const checkAndSetInputNode = (msg: ChatMessage) => {
    let payload = msg.payload;
    if (typeof payload === "string") {
      try {
        payload = JSON.parse(payload);
      } catch {
        payload = null;
      }
    }

    if (payload && payload.nodeType) {
      const type = payload.nodeType;
      const nodeId = payload.nodeId;

      if (
        ["button", "quick_reply", "list", "question", "name_input", "email_input", "phone_input", "date_input", "form"].includes(
          type
        )
      ) {
        // Retrieve standard message details or node-specific config
        // In this case, we read fields/options from the actual message text or look up
        setActiveInputNode({
          id: nodeId,
          type,
          options: payload?.options || undefined, // Set if passed in payload
          fields: payload?.fields || undefined,
          inputType: payload?.inputType || undefined,
        });
      } else {
        setActiveInputNode(null);
      }
    } else {
      setActiveInputNode(null);
    }
  };

  // Triggers the next action in the engine
  const triggerNextStep = async (
    userReplyText: string | null,
    buttonIdx?: number,
    payloadObj?: any
  ) => {
    if (!sessionId) return;

    setIsTyping(true);
    setActiveInputNode(null);

    // If user message is provided locally, append it to UI first
    if (userReplyText && !payloadObj) {
      const tempId = `temp_${Date.now()}`;
      setMessages((prev) => [...prev, { id: tempId, sender: "user", text: userReplyText }]);
    }

    try {
      // Simulate delay for a conversational feel
      await new Promise((resolve) => setTimeout(resolve, 800));

      const response = await fetch(`/api/widget/${botId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          text: userReplyText,
          buttonIndex: buttonIdx,
          payload: payloadObj,
        }),
      });

      const data = await response.json();
      if (data.success && data.messages) {
        // Add new bot messages
        const incoming = data.messages.map((m: any) => ({
          id: m.nodeId + "_" + Date.now(),
          sender: "bot",
          text: m.text,
          payload: {
            nodeId: m.nodeId,
            nodeType: m.nodeType,
            options: m.options,
            fields: m.fields,
            mediaUrl: m.mediaUrl,
            inputType: m.payload?.inputType,
            redirectUrl: m.payload?.redirectUrl || (m.payload && typeof m.payload === "string" ? (() => { try { return JSON.parse(m.payload).redirectUrl; } catch { } })() : undefined),
          },
        }));

        setMessages((prev) => [...prev, ...incoming]);

        // Check if the last bot message blocks execution (e.g. form, buttons)
        if (incoming.length > 0) {
          const lastIncoming = incoming[incoming.length - 1];
          checkAndSetInputNode(lastIncoming);
          updateSessionLastMessage(sessionId, lastIncoming.text);
        }
      }
    } catch (e) {
      console.error("Failed to run step:", e);
    } finally {
      setIsTyping(false);
    }
  };

  // Submit Text Input (Chat Bar)
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText("");
    triggerNextStep(text);
  };

  // Handle Button / Quick Reply click
  const handleOptionClick = (optionText: string, index: number) => {
    triggerNextStep(optionText, index);
  };

  // Handle Form Submission
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const leadValues = JSON.stringify(formValues);
    triggerNextStep("Submitted details", undefined, formValues);
    setFormValues({});
  };

  const handleFormChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const closeWidget = () => {
    if (typeof window !== "undefined") {
      window.parent.postMessage({ type: "chetbot-close" }, "*");
    }
  };

  const updateSessionLastMessage = (sessId: string, lastText: string) => {
    setSessionsList((prev) => {
      let exists = false;
      const updated = prev.map((s) => {
        if (s.id === sessId) {
          exists = true;
          return { ...s, lastMessage: lastText, timestamp: Date.now() };
        }
        return s;
      });
      if (!exists) {
        updated.push({ id: sessId, timestamp: Date.now(), lastMessage: lastText });
      }
      const sorted = updated.sort((a, b) => b.timestamp - a.timestamp);
      localStorage.setItem(`chetbot_sessions_${botId}`, JSON.stringify(sorted));
      return sorted;
    });
  };

  const handleNewChat = () => {
    if (!botId) return;
    const newSess = `sess_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem(`chetbot_sess_${botId}`, newSess);
    setSessionId(newSess);
    setMessages([]);
    setActiveInputNode(null);
    setFormValues({});

    // Register in session list
    setSessionsList((prev) => {
      const exists = prev.some(s => s.id === newSess);
      if (exists) return prev;
      const updated = [{ id: newSess, timestamp: Date.now(), lastMessage: "New Conversation" }, ...prev];
      localStorage.setItem(`chetbot_sessions_${botId}`, JSON.stringify(updated));
      return updated;
    });

    setActiveScreen("chat");
  };

  const handleRestartChat = handleNewChat;

  const loadSession = (selectedSessId: string) => {
    localStorage.setItem(`chetbot_sess_${botId}`, selectedSessId);
    setSessionId(selectedSessId);
    setActiveScreen("chat");
  };

  if (!settings) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-slate-900 text-slate-500">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  const primaryColor = settings.widgetColor || "#4f46e5";
  const borderRad = `${settings.borderRadius || 16}px`;

  // Apply typography
  const getFontFamily = (fontName: string) => {
    switch (fontName) {
      case "Roboto":
        return "'Roboto', sans-serif";
      case "Courier":
        return "'Courier New', Courier, monospace";
      case "Inter":
      default:
        return "'Inter', sans-serif";
    }
  };

  return (
    <>
      <link 
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto:wght@400;500;700&display=swap" 
        rel="stylesheet" 
      />
      <style>{`
        .animate-slide-up {
          animation: slideUp 0.24s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
      <div
        className="flex h-screen flex-col text-slate-900 dark:text-slate-100 relative overflow-hidden"
        style={{ 
          borderRadius: borderRad, 
          fontFamily: getFontFamily(settings.font),
          backgroundColor: settings.widgetBgColor || undefined 
        }}
      >
        {activeScreen === "home" ? (
          <div className="flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-950">
            {/* Home Header */}
            <div
              className="flex items-center justify-between px-4 py-4.5 shadow-sm shrink-0"
              style={{ 
                backgroundColor: settings.headerColor || primaryColor,
                color: settings.headerTextColor || "#ffffff"
              }}
            >
              <div className="flex items-center gap-3">
                {settings.avatarUrl ? (
                  settings.avatarUrl.trim().startsWith("<svg") ? (
                    <div 
                      className="h-10 w-10 rounded-full overflow-hidden flex items-center justify-center border border-white/20 bg-white/10 p-0.5 text-white fill-current shrink-0"
                      dangerouslySetInnerHTML={{ __html: settings.avatarUrl }}
                    />
                  ) : (
                    <img
                      src={settings.avatarUrl}
                      alt="Bot Avatar"
                      className="h-10 w-10 rounded-full object-cover border border-white/20 shrink-0"
                    />
                  )
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 shrink-0">
                    <Bot className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-sm leading-tight">{settings.botName}</h3>
                  <span className="flex items-center gap-1 text-[11px] opacity-80">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                    Online
                  </span>
                </div>
              </div>
              <button
                onClick={closeWidget}
                className="rounded-full p-1.5 hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close chat"
              >
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>

            {/* Home Body Portal */}
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 scrollbar-thin">
              {/* Portal Banner */}
              <div 
                className="rounded-2xl p-6 text-white shadow-md flex flex-col gap-2 relative overflow-hidden shrink-0"
                style={{ 
                  background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}ee 100%)`
                }}
              >
                {/* Decorative glow shapes */}
                <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10" />
                <div className="absolute -right-2 -top-8 w-16 h-16 rounded-full bg-white/10" />
                
                <h1 className="text-xl font-bold tracking-tight">Hi there! 👋</h1>
                <p className="text-xs opacity-90 leading-relaxed max-w-[90%]">
                  Need help? Start a new conversation below or select a recent chat to continue.
                </p>
              </div>

              {/* Start Conversation Card */}
              <button
                onClick={handleNewChat}
                className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-850 p-5 flex items-center justify-between text-left shadow-sm hover:shadow-md hover:border-slate-200 dark:hover:border-slate-800 transition-all active:scale-[0.99] cursor-pointer group"
              >
                <div className="space-y-1">
                  <h4 className="text-[13px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Start a new conversation
                  </h4>
                  <p className="text-[11px] text-slate-450 dark:text-slate-400">Our support assistant replies instantly.</p>
                </div>
                <div 
                  className="h-9 w-9 rounded-full flex items-center justify-center text-white shadow-sm transition-transform group-hover:translate-x-0.5 shrink-0"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Send className="h-4 w-4 rotate-45 -translate-y-0.5 translate-x-0.25" />
                </div>
              </button>

              {/* Recent Conversations History List */}
              <div className="space-y-2.5">
                <h4 className="text-[11px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider px-1">
                  Recent Conversations
                </h4>
                <div className="space-y-2.5">
                  {sessionsList.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-850 p-6 text-center text-xs text-slate-400 shadow-sm">
                      No recent conversations found.
                    </div>
                  ) : (
                    sessionsList.map((sess) => {
                      const isActive = sess.id === sessionId;
                      return (
                        <div
                          key={sess.id}
                          onClick={() => loadSession(sess.id)}
                          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-850 p-4.5 flex items-center gap-3.5 cursor-pointer shadow-sm hover:shadow-md hover:border-slate-200 dark:hover:border-slate-800 transition-all text-left group"
                        >
                          <div 
                            className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 text-sm shadow-inner transition-colors"
                            style={{ 
                              backgroundColor: `${primaryColor}15`, 
                              color: primaryColor 
                            }}
                          >
                            💬
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-1">
                              <span className="text-[12.5px] font-bold text-slate-750 dark:text-slate-250 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {isActive ? "Current Session" : "Conversation"}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium shrink-0">
                                {new Date(sess.timestamp).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric"
                                })}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate leading-relaxed">
                              {sess.lastMessage || "No messages yet"}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Portal Footer */}
            <div className="py-2.5 text-center text-[10px] text-slate-400 dark:text-slate-650 shrink-0">
              Powered by <span className="font-semibold">ChetBot</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 shadow-md transition-all duration-300 shrink-0"
              style={{ 
                backgroundColor: settings.headerColor || primaryColor,
                color: settings.headerTextColor || "#ffffff"
              }}
            >
              <div className="flex items-center gap-2">
                {/* Back button */}
                <button
                  onClick={() => setActiveScreen("home")}
                  className="mr-1 rounded-full p-1.5 hover:bg-white/10 transition-colors cursor-pointer"
                  title="Go Back"
                  aria-label="Back"
                >
                  <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24">
                    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                  </svg>
                </button>
                
                {settings.avatarUrl ? (
                  settings.avatarUrl.trim().startsWith("<svg") ? (
                    <div 
                      className="h-10 w-10 rounded-full overflow-hidden flex items-center justify-center border border-white/20 bg-white/10 p-0.5 text-white fill-current shrink-0"
                      dangerouslySetInnerHTML={{ __html: settings.avatarUrl }}
                    />
                  ) : (
                    <img
                      src={settings.avatarUrl}
                      alt="Bot Avatar"
                      className="h-10 w-10 rounded-full object-cover border border-white/20 shrink-0"
                    />
                  )
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 shrink-0">
                    <Bot className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-sm leading-tight">{settings.botName}</h3>
                  <span className="flex items-center gap-1 text-[11px] opacity-80">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                    Online
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={closeWidget}
                  className="rounded-full p-1.5 hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Close chat"
                >
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages Viewport */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin">
              {messages.map((msg, i) => {
                const isBot = msg.sender === "bot";
                const payload = getPayloadObj(msg.payload);
                const mediaUrl = payload?.mediaUrl;
                const msgOptions = payload?.options;

                return (
                  <div key={msg.id || i} className={`flex ${isBot ? "justify-start" : "justify-end"}`}>
                    <div className="flex gap-2 max-w-[85%] w-full">
                      {isBot && (
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          {settings.avatarUrl ? (
                            settings.avatarUrl.trim().startsWith("<svg") ? (
                              <div 
                                className="h-full w-full flex items-center justify-center p-0.5 text-slate-650 dark:text-slate-350 fill-current"
                                dangerouslySetInnerHTML={{ __html: settings.avatarUrl }}
                              />
                            ) : (
                              <img src={settings.avatarUrl} alt="Bot Avatar" className="h-full w-full object-cover" />
                            )
                          ) : (
                            <Bot className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
                          )}
                        </div>
                      )}
                      <div className="flex flex-col gap-1 w-full">
                        {mediaUrl && (
                          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white mb-1 shadow-sm">
                            <img src={mediaUrl} alt="Bot upload" className="max-h-48 object-cover" />
                          </div>
                        )}
                        <div
                          className={`rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed shadow-sm flex flex-col overflow-hidden`}
                          style={{
                            backgroundColor: isBot 
                              ? (settings.leftMessageBgColor || undefined) 
                              : (settings.rightMessageBgColor || primaryColor),
                            color: isBot 
                              ? (settings.leftMessageTextColor || undefined) 
                              : (settings.rightMessageTextColor || "#ffffff"),
                            border: isBot ? "1px solid rgba(0,0,0,0.05)" : undefined,
                            borderRadius: isBot
                              ? `2px ${settings.borderRadius}px ${settings.borderRadius}px ${settings.borderRadius}px`
                              : `${settings.borderRadius}px ${settings.borderRadius}px 2px ${settings.borderRadius}px`,
                          }}
                        >
                          <div>{msg.text}</div>
                          
                          {/* Render buttons inside the bubble card if options are present */}
                          {isBot && msgOptions && msgOptions.length > 0 && (
                            <div className="flex flex-col mt-2.5 -mx-3.5 -mb-2.5 border-t border-slate-200/50 dark:border-slate-800/25 divide-y divide-slate-200/50 dark:divide-slate-800/25">
                              {msgOptions.map((opt: string, idx: number) => {
                                const isLatestBotMsg = i === messages.length - 1;
                                const isActive = isLatestBotMsg && activeInputNode && activeInputNode.id === payload?.nodeId && !isTyping;
                                return (
                                  <button
                                    key={idx}
                                    disabled={!isActive}
                                    onClick={() => handleOptionClick(opt, idx)}
                                    className={`w-full py-2.5 px-4 text-center text-xs font-semibold transition-all ${
                                      isActive 
                                        ? "text-indigo-600 dark:text-indigo-400 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] cursor-pointer active:bg-black/[0.06]" 
                                        : "text-slate-450 dark:text-slate-500 cursor-not-allowed opacity-60"
                                    }`}
                                    style={{
                                      borderBottomLeftRadius: idx === msgOptions.length - 1 ? `${settings.borderRadius}px` : "0px",
                                      borderBottomRightRadius: idx === msgOptions.length - 1 ? `${settings.borderRadius}px` : "0px",
                                    }}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex gap-2 max-w-[85%]">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      {settings.avatarUrl ? (
                        settings.avatarUrl.trim().startsWith("<svg") ? (
                          <div 
                            className="h-full w-full flex items-center justify-center p-0.5 text-slate-650 dark:text-slate-350 fill-current"
                            dangerouslySetInnerHTML={{ __html: settings.avatarUrl }}
                          />
                        ) : (
                          <img src={settings.avatarUrl} alt="Bot Avatar" className="h-full w-full object-cover" />
                        )
                      ) : (
                        <Bot className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
                      )}
                    </div>
                    <div
                      className="flex items-center gap-1 px-4 py-3 shadow-sm"
                      style={{ 
                        borderRadius: `12px 12px 12px 2px`,
                        backgroundColor: settings.leftMessageBgColor || undefined,
                        border: settings.leftMessageBgColor ? "1px solid rgba(0,0,0,0.05)" : undefined,
                      }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Interactive Options Panels (Forms/Live Agent Handover only, options are inline) */}
            {activeInputNode && !isTyping && ["form", "live_agent"].includes(activeInputNode.type) && (
              <div className="px-4 py-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-850 space-y-2">
                {/* Forms Node */}
                {activeInputNode.type === "form" && activeInputNode.fields && (
                  <form onSubmit={handleFormSubmit} className="space-y-2.5 py-1.5 text-xs">
                    {activeInputNode.fields.map((field: any, idx: number) => (
                      <div key={idx} className="space-y-1">
                        <label className="font-semibold text-slate-600 dark:text-slate-400">
                          {field.label}
                        </label>
                        {field.type === "textarea" ? (
                          <textarea
                            required
                            rows={2}
                            onChange={(e) => handleFormChange(field.variable || field.label, e.target.value)}
                            className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 outline-none focus:border-indigo-500"
                          />
                        ) : (
                          <input
                            required
                            type={field.type || "text"}
                            onChange={(e) => handleFormChange(field.variable || field.label, e.target.value)}
                            className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 outline-none focus:border-indigo-500"
                          />
                        )}
                      </div>
                    ))}
                    <button
                      type="submit"
                      className="w-full rounded-md text-white font-medium py-2 text-sm transition-opacity"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Submit Info
                    </button>
                  </form>
                )}

                {/* Live Agent handover banner */}
                {activeInputNode.type === "live_agent" && (
                  <div className="flex items-center gap-2 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 p-3 text-orange-800 dark:text-orange-300 text-xs">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Flow paused. A live representative is checking your chat ticket.</span>
                  </div>
                )}
              </div>
            )}

            {/* Input Form Footer */}
            <div className="bg-white dark:bg-slate-900 border-t border-slate-200/60 dark:border-slate-850 px-3 py-2.5">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type={
                    activeInputNode?.type === "question" && activeInputNode?.inputType === "Email" ? "email" :
                    activeInputNode?.type === "question" && activeInputNode?.inputType === "Phone" ? "tel" :
                    activeInputNode?.type === "question" && activeInputNode?.inputType === "Date" ? "date" :
                    activeInputNode?.type === "question" && activeInputNode?.inputType === "Number" ? "number" :
                    activeInputNode?.type === "question" && activeInputNode?.inputType === "URL" ? "url" :
                    "text"
                  }
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={
                    activeInputNode !== null &&
                    ["form", "live_agent"].includes(activeInputNode.type)
                  }
                  placeholder={
                    activeInputNode?.type === "question"
                      ? "Type your answer..."
                      : activeInputNode?.type === "live_agent"
                      ? "Waiting for agent..."
                      : "Write a message..."
                  }
                  className="flex-1 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2 text-[13px] outline-none transition-all focus:border-slate-300 focus:bg-white dark:focus:border-slate-700 dark:focus:bg-slate-900 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={
                    !inputText.trim() ||
                    (activeInputNode !== null &&
                      ["form", "live_agent"].includes(activeInputNode.type))
                  }
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white shadow-sm transition-all hover:opacity-90 active:scale-95 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400"
                  style={{
                    backgroundColor:
                      inputText.trim() &&
                      !(
                        activeInputNode !== null &&
                        ["form", "live_agent"].includes(activeInputNode.type)
                      )
                        ? primaryColor
                        : undefined,
                  }}
                >
                  <Send className="h-4.5 w-4.5" />
                </button>
              </form>
              {/* Branding */}
              <div className="mt-1.5 text-center text-[10px] text-slate-400 dark:text-slate-650">
                Powered by <span className="font-semibold">ChetBot</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
