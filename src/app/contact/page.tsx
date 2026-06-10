"use client";

import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import { useState } from "react";
import { Send, MapPin, Mail, Phone, Bot } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setName("");
    setEmail("");
    setMsg("");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mt-8">
            {/* Info panel */}
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                  Get in Touch
                </h1>
                <p className="mt-4 text-base text-slate-600 dark:text-slate-400">
                  Have questions about our visual chatbot builder? Want custom pricing or integrations? Drop us a line.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4 items-center">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">Email</h4>
                    <span className="text-xs text-slate-500">support@chatbot.com</span>
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">Sales Helpline</h4>
                    <span className="text-xs text-slate-500">+1 (800) CHET-BOT</span>
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">HQ Address</h4>
                    <span className="text-xs text-slate-500">100 Pine Street, San Francisco, CA</span>
                  </div>
                </div>
              </div>

              {/* Chat Widget Demo Hook */}
              <div className="rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-950/50 p-6 flex gap-4 items-center">
                <div className="h-12 w-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/25">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Want to test ChatBot right now?</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Click the floating chat bubble in the bottom right corner of this page to experience the widget live!</p>
                </div>
              </div>
            </div>

            {/* Email form */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
              {sent ? (
                <div className="text-center py-10 space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <Send className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold">Message Sent!</h3>
                  <p className="text-sm text-slate-500">Thank you for writing. Our support representative will contact you via email shortly.</p>
                  <button
                    onClick={() => setSent(false)}
                    className="mt-4 rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-2 text-xs font-semibold hover:bg-slate-200 transition-colors"
                  >
                    Send Another
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Name</label>
                    <input
                      required
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Email</label>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Message</label>
                    <textarea
                      required
                      rows={4}
                      value={msg}
                      onChange={(e) => setMsg(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow hover:bg-indigo-500 transition-colors"
                  >
                    Send Inquiry
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
