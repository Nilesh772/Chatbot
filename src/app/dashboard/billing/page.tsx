"use client";

import { useEffect, useState } from "react";
import { CreditCard, Check, ShieldAlert, Sparkles, BarChart2 } from "lucide-react";

export default function WorkspaceBillingPage() {
  const [chatsUsed, setChatsUsed] = useState(120);
  const chatsLimit = 5000;
  const percentage = Math.min(Math.round((chatsUsed / chatsLimit) * 100), 100);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto font-sans">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing & Plans</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your subscription, review invoice details, and inspect usage caps.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Current plan card */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-indigo-650 text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block">Active Plan</span>
                <h3 className="text-lg font-bold">Pro Builder SaaS tier</h3>
              </div>
              <span className="rounded-full bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900/40 px-3 py-1 text-xs font-bold text-green-700 dark:text-green-400">
                Active & Paid
              </span>
            </div>

            {/* Usage progression */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-500">Monthly Chat Engagement:</span>
                <span className="text-slate-800 dark:text-slate-200">{chatsUsed.toLocaleString()} / {chatsLimit.toLocaleString()} chats</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 block font-semibold">Resets on {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString()}</span>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-850 pt-5 flex items-center justify-between text-xs font-semibold">
              <div className="text-slate-500">
                Billing Cycle: <span className="text-slate-800 dark:text-slate-200 font-bold">$29.00 billed monthly</span>
              </div>
              <span className="text-indigo-600 hover:underline cursor-pointer">Change Billing Method</span>
            </div>
          </div>

          {/* Checkout plans details */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
            <h4 className="font-bold text-sm">Included features on your active plan</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
              <div className="flex items-center gap-2 text-slate-655 dark:text-slate-455">
                <Check className="h-4.5 w-4.5 text-indigo-500" />
                <span>Unlimited Active Chatbots</span>
              </div>
              <div className="flex items-center gap-2 text-slate-655 dark:text-slate-455">
                <Check className="h-4.5 w-4.5 text-indigo-500" />
                <span>Custom Brand Styling & CSS</span>
              </div>
              <div className="flex items-center gap-2 text-slate-655 dark:text-slate-455">
                <Check className="h-4.5 w-4.5 text-indigo-500" />
                <span>Leads Spreadsheet Export downloads</span>
              </div>
              <div className="flex items-center gap-2 text-slate-655 dark:text-slate-455">
                <Check className="h-4.5 w-4.5 text-indigo-500" />
                <span>Visual Conversion Analytics charts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Upgrade side details card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
          <div className="inline-flex rounded-xl bg-amber-50 dark:bg-amber-950/40 p-2.5 text-amber-600 dark:text-amber-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <h4 className="font-bold text-sm">Need higher limits?</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            If your website receives high traffic volumes, or if you manage multiple customer domains, our Enterprise Tier handles up to unlimited chats and unlocks Whitelabel widgets.
          </p>
          <button className="w-full text-center rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white py-2.5 text-xs font-bold transition-colors">
            Upgrade to Enterprise ($99)
          </button>
        </div>
      </div>
    </div>
  );
}
