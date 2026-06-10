"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, MessageSquare, UserCheck, AlertCircle, Check, Trash2, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface NotificationItem {
  id: string;
  conversationId: string;
  type: "new_chat" | "new_message" | "assigned";
  title: string;
  message: string;
  createdAt: string;
  link: string;
}

export default function NotificationDropdown() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [shouldWiggle, setShouldWiggle] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef<number>(0);
  const router = useRouter();

  // Load read notifications from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("chatbot_read_notifications");
      if (stored) {
        setReadIds(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load read notifications state:", e);
    }
  }, []);

  // Poll for notifications every 3 seconds
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications");
        const data = await res.json();
        if (data.success && data.notifications) {
          const fetched: NotificationItem[] = data.notifications;
          setNotifications(fetched);

          // Count current unread
          const currentUnread = fetched.filter(n => !readIds.includes(n.id)).length;
          if (currentUnread > prevCountRef.current) {
            setShouldWiggle(true);
            setTimeout(() => setShouldWiggle(false), 800);
          }
          prevCountRef.current = currentUnread;
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 3000);
    return () => clearInterval(interval);
  }, [readIds]);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadNotifications = notifications.filter(n => !readIds.includes(n.id));
  const unreadCount = unreadNotifications.length;

  const markAsRead = (id: string) => {
    const updated = [...readIds, id];
    setReadIds(updated);
    try {
      localStorage.setItem("chatbot_read_notifications", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    const updated = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(updated);
    try {
      localStorage.setItem("chatbot_read_notifications", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const clearAllHistory = () => {
    setNotifications([]);
    setReadIds([]);
    try {
      localStorage.removeItem("chatbot_read_notifications");
    } catch (e) {}
  };

  const handleNotificationClick = (item: NotificationItem) => {
    markAsRead(item.id);
    setIsOpen(false);
    // Use window.location or router.push to navigate to inbox with the query parameter
    router.push(item.link);
  };

  const handleAcceptFromNotification = async (item: NotificationItem) => {
    try {
      const res = await fetch(`/api/conversations/${item.conversationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "active",
          assignedAgentId: user?.id || "usr-agent",
          startedAt: new Date().toISOString()
        })
      });
      const data = await res.json();
      if (data.success) {
        markAsRead(item.id);
        setIsOpen(false);
        router.push(item.link);
      } else {
        alert(data.error || "Failed to accept conversation.");
        markAsRead(item.id); // Clear stale notification
      }
    } catch (err) {
      console.error(err);
      alert("Failed to accept conversation due to a network error.");
    }
  };

  const handleRejectFromNotification = async (item: NotificationItem) => {
    try {
      const res = await fetch(`/api/conversations/${item.conversationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "closed",
          closedAt: new Date().toISOString()
        })
      });
      const data = await res.json();
      if (data.success) {
        markAsRead(item.id);
      } else {
        alert(data.error || "Failed to reject conversation.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to reject conversation.");
    }
  };

  // Helper to get formatted relative time
  const formatTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr);
      const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

      if (seconds < 5) return "Just now";
      if (seconds < 60) return `${seconds}s ago`;
      
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch {
      return "Some time ago";
    }
  };

  // Get icon based on notification type
  const getIcon = (type: string) => {
    switch (type) {
      case "new_chat":
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case "new_message":
        return <MessageSquare className="h-4 w-4 text-indigo-500" />;
      case "assigned":
        return <UserCheck className="h-4 w-4 text-emerald-500" />;
      default:
        return <Bell className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Self-contained wiggle animation styles */}
      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          15% { transform: rotate(12deg); }
          30% { transform: rotate(-12deg); }
          45% { transform: rotate(9deg); }
          60% { transform: rotate(-9deg); }
          75% { transform: rotate(5deg); }
          90% { transform: rotate(-5deg); }
        }
        .animate-bell-wiggle {
          animation: wiggle 0.75s ease-in-out;
        }
      `}</style>

      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200 focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className={`h-5.5 w-5.5 ${shouldWiggle ? "animate-bell-wiggle" : ""}`} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-white dark:ring-slate-900 animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1 shadow-xl z-50 animate-in fade-in slide-in-from-top-3 duration-250">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200">Notifications</h3>
              <p className="text-[10px] text-slate-400 font-semibold">{unreadCount} unread items</p>
            </div>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <Check className="h-3 w-3" /> Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAllHistory}
                  className="text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1"
                  title="Clear history"
                >
                  <Trash2 className="h-3 w-3" /> Clear
                </button>
              )}
            </div>
          </div>

          {/* List items */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-2">
                  <Bell className="h-4.5 w-4.5 text-slate-400" />
                </div>
                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400">All caught up!</p>
                <p className="text-[9px] text-slate-400 mt-0.5">No new notifications at this time.</p>
              </div>
            ) : (
              notifications.map((item) => {
                const isUnread = !readIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`flex gap-3 p-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-850/50 cursor-pointer transition-colors relative ${
                      isUnread ? "bg-indigo-50/20 dark:bg-indigo-950/10" : ""
                    }`}
                  >
                    {/* Unread marker dot */}
                    {isUnread && (
                      <span className="absolute top-4.5 right-4 h-2 w-2 rounded-full bg-indigo-500" />
                    )}

                    {/* Left Icon container */}
                    <div className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      {getIcon(item.type)}
                    </div>

                    {/* Content details */}
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex justify-between items-baseline">
                        <p className={`text-[11px] font-bold truncate ${isUnread ? "text-slate-800 dark:text-slate-100" : "text-slate-500 dark:text-slate-450"}`}>
                          {item.title}
                        </p>
                      </div>
                      <p className={`text-[10px] truncate mt-0.5 ${isUnread ? "text-slate-600 dark:text-slate-300" : "text-slate-400 dark:text-slate-500"}`}>
                        {item.message}
                      </p>
                      <span className="text-[9px] text-slate-400 font-semibold block mt-1.5">
                        {formatTime(item.createdAt)}
                      </span>
                      {item.type === "new_chat" && isUnread && (
                        <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleAcceptFromNotification(item)}
                            className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold shadow-sm transition-all duration-150 active:scale-95"
                          >
                            <UserCheck className="h-3.5 w-3.5 text-white" /> Accept
                          </button>
                          <button
                            onClick={() => handleRejectFromNotification(item)}
                            className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-650 text-[10px] font-bold transition-all duration-150 active:scale-95"
                          >
                            <X className="h-3.5 w-3.5 text-rose-500" /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer view inbox link */}
          <div className="p-2 border-t border-slate-100 dark:border-slate-800 text-center">
            <Link
              href="/dashboard/inbox"
              onClick={() => setIsOpen(false)}
              className="block w-full py-2 rounded-xl bg-slate-50 hover:bg-indigo-50 dark:bg-slate-850 dark:hover:bg-indigo-950/20 text-[10px] font-bold text-slate-600 hover:text-indigo-600 dark:text-slate-350 dark:hover:text-indigo-400 transition-colors"
            >
              Open Inbox Directory
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
