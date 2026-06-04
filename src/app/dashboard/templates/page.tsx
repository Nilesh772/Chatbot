"use client";

import Link from "next/link";
import { Users, Bot, Calendar, Sparkles, MessageSquare, ClipboardList, ArrowRight } from "lucide-react";

export default function WorkspaceTemplatesPage() {
  const blueprints = [
    {
      id: "lead_gen",
      title: "Lead Generation",
      icon: Users,
      desc: "Greet visitors, qualify their business needs, and capture validated email address and contact details.",
      tags: ["Marketing", "Sales"]
    },
    {
      id: "support",
      title: "Customer Support",
      icon: Bot,
      desc: "Address frequently asked questions, offer button menus, and route to human support via live agent blocks.",
      tags: ["Support", "Operations"]
    },
    {
      id: "booking",
      title: "Appointment Booking",
      icon: Calendar,
      desc: "Gather guest preferences and timing schedules to index booking requests dynamically.",
      tags: ["Service", "Sales"]
    },
    {
      id: "scratch",
      title: "Blank Canvas",
      icon: ClipboardList,
      desc: "Start with a clean slate containing only the Start Node to design your custom conversational layout.",
      tags: ["General", "Custom"]
    }
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Chatbot Blueprints</h1>
        <p className="text-sm text-slate-500 mt-1">Deploy pre-configured flow diagrams to accelerate development.</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {blueprints.map((item, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-all group"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/40 p-3 text-indigo-650 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
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
              <h2 className="text-base font-bold mb-2">{item.title}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed mb-6">
                {item.desc}
              </p>
            </div>

            <Link
              href={`/dashboard/bots/create?template=${item.id}`}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-indigo-655 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 transition-colors"
            >
              Use Blueprint Template
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
