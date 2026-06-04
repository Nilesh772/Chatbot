"use client";

import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import Link from "next/link";
import { Users, Bot, Calendar, Sparkles, MessageSquare, ClipboardList, ArrowRight } from "lucide-react";

export default function TemplatesPage() {
  const blueprints = [
    {
      title: "Lead Generation",
      icon: Users,
      desc: "Automatically greet visitors, ask for their name, email, and phone number, and store leads in the dashboard.",
      tags: ["Marketing", "Sales"]
    },
    {
      title: "Customer Support",
      icon: Bot,
      desc: "Provide quick answers to technical or billing questions, and offer a live agent handover block if unresolved.",
      tags: ["Support", "Operations"]
    },
    {
      title: "Appointment Booking",
      icon: Calendar,
      desc: "Ask for booking times, collect guest details, and automatically route confirmations to your calendars.",
      tags: ["Service", "Sales"]
    },
    {
      title: "Product Inquiry",
      icon: Sparkles,
      desc: "Display product selection quick-replies, explain features, and qualify high-intent purchase details.",
      tags: ["E-commerce", "Sales"]
    },
    {
      title: "Contact Form",
      icon: MessageSquare,
      desc: "Replace standard boring static contact pages with an interactive conversational form widget.",
      tags: ["General", "Utility"]
    },
    {
      title: "Event Registration",
      icon: ClipboardList,
      desc: "Capture RSVPs, event preferences, diet requirements, and ticket inquiries dynamically.",
      tags: ["Events", "Marketing"]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Start with a Ready-made Blueprint
            </h1>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Pick a template, edit its messaging visually, customize styles, and install. All templates are preloaded with nodes and logic.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            {blueprints.map((item, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6.5 flex flex-col justify-between hover:shadow-md transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/40 p-3 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <div className="flex gap-1.5">
                      {item.tags.map((t, tIdx) => (
                        <span
                          key={tIdx}
                          className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-semibold text-slate-500"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <h2 className="text-lg font-bold mb-2">{item.title}</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                    {item.desc}
                  </p>
                </div>

                <Link
                  href="/register"
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-850 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Use Template
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
