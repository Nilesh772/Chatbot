"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { User, Lock, Code, Save, Check, Copy } from "lucide-react";

export default function WorkspaceSettingsPage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || "Sandbox Demo Admin");
  const [email, setEmail] = useState(user?.email || "admin@chetbot.com");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [apiKey, setApiKey] = useState("cb_live_6753a891bfd237b67ee8992a01");
  const [copied, setCopied] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    }, 1000);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto font-sans">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Workspace Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Configure profile details and developer sandbox settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Settings */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h3 className="font-bold text-sm mb-4">Profile Information</h3>
            
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-500">Full Name</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 outline-none focus:border-indigo-500 transition-colors font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-500">Email Address</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 outline-none focus:border-indigo-500 transition-colors font-semibold"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 transition-colors shadow-sm disabled:opacity-50"
                >
                  {saving ? (
                    "Saving Profile..."
                  ) : success ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-green-300" />
                      Changes Saved
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      Save Details
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Password Edit Mock */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h3 className="font-bold text-sm mb-4">Change Password</h3>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-500">Current Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 outline-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500">New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500">Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 outline-none"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => alert("Password changes are disabled in Sandbox developer mode.")}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 px-4 py-2.5 font-bold transition-colors"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* API Credentials */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-indigo-600" />
              <h3 className="font-bold text-sm">Developer API Key</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Use this key to fetch lead records and conversations programmatically into your CRMs or external apps.
            </p>
            <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 font-mono text-[10.5px] select-all overflow-x-auto break-all pr-12">
              <code>{apiKey}</code>
              <button
                onClick={handleCopyKey}
                className="absolute right-2 top-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 text-slate-500 hover:text-slate-850 transition-colors"
              >
                {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
