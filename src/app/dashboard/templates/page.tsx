"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Users, Bot, Calendar, Sparkles, MessageSquare, 
  ClipboardList, ArrowRight, Play, CheckCircle2, X, Eye 
} from "lucide-react";

export default function WorkspaceTemplatesPage() {
  const blueprints = [
    {
      id: "lead_gen",
      title: "Lead Generation",
      icon: Users,
      desc: "Greet visitors, qualify their business needs, and capture validated email address and contact details.",
      tags: ["Marketing", "Sales"],
      steps: [
        { type: "start", label: "Start Flow", detail: "Flow triggers when the chat bubble is clicked" },
        { type: "message", label: "Welcome Greeting Message", detail: "Hello! Welcome to ChatBot. We'd love to help you grow..." },
        { type: "question", label: "Quick Reply Buttons", detail: "Prompt 'Are you ready to start?' (Options: Yes / Maybe later)" },
        { type: "input", label: "Name Input Block", detail: "Collect visitor's name and save to {{visitor_name}} variable" },
        { type: "input", label: "Email Input Block", detail: "Collect visitor's email and save to {{visitor_email}} variable" },
        { type: "input", label: "Phone Input Block", detail: "Collect visitor's phone number and save to {{visitor_phone}} variable" },
        { type: "message", label: "Thank You Message", detail: "Thank visitor and confirm details are saved" },
        { type: "end", label: "End Flow", detail: "Leads dashboard registers data instantly" }
      ]
    },
    {
      id: "support",
      title: "Customer Support",
      icon: Bot,
      desc: "Address frequently asked questions, offer button menus, and route to human support via live agent blocks.",
      tags: ["Support", "Operations"],
      steps: [
        { type: "start", label: "Start Flow", detail: "Flow triggers on initialization" },
        { type: "message", label: "Greeting & Menu Options", detail: "Offer help categories: Tech Issues, Billing, or Sales" },
        { type: "question", label: "Navigation Choices", detail: "Customer clicks buttons to route dialogue branch" },
        { type: "input", label: "Issue Description Text", detail: "Collect context regarding error details" },
        { type: "agent", label: "Live Agent Handoff", detail: "Signal live agent dashboard and hold automatic responses" },
        { type: "end", label: "End Flow", detail: "Complete support ticket session logs" }
      ]
    },
    {
      id: "booking",
      title: "Appointment Booking",
      icon: Calendar,
      desc: "Gather guest preferences and timing schedules to index booking requests dynamically.",
      tags: ["Service", "Sales"],
      steps: [
        { type: "start", label: "Start Flow", detail: "Flow triggers on initialization" },
        { type: "message", label: "Service Catalog Greeting", detail: "Welcome client and prompt booking type selection" },
        { type: "input", label: "Category Input", detail: "Customer chooses consultation type" },
        { type: "input", label: "Calendar Scheduling", detail: "Prompt client to input date & time slot preferences" },
        { type: "input", label: "Contact Details", detail: "Collect phone number for booking reminders" },
        { type: "message", label: "Confirmation Bubble", detail: "Display slot confirmation message" },
        { type: "end", label: "End Flow", detail: "Sync request to lead database logs" }
      ]
    },
    {
      id: "scratch",
      title: "Blank Canvas",
      icon: ClipboardList,
      desc: "Start with a clean slate containing only the Start Node to design your custom conversational layout.",
      tags: ["General", "Custom"],
      steps: [
        { type: "start", label: "Start Flow", detail: "Flow starts here" },
        { type: "end", label: "End Flow", detail: "Draw lines and connect your custom nodes here" }
      ]
    }
  ];

  const [activePreview, setActivePreview] = useState<typeof blueprints[0] | null>(null);

  const getStepIcon = (type: string) => {
    switch (type) {
      case "start": return <Play className="h-3.5 w-3.5 text-green-500 fill-green-500" />;
      case "end": return <CheckCircle2 className="h-3.5 w-3.5 text-rose-500" />;
      case "message": return <MessageSquare className="h-3.5 w-3.5 text-blue-500" />;
      case "question": return <HelpCircleIcon className="h-3.5 w-3.5 text-amber-500" />;
      case "input": return <ClipboardList className="h-3.5 w-3.5 text-purple-500" />;
      case "agent": return <Bot className="h-3.5 w-3.5 text-indigo-500" />;
      default: return <Bot className="h-3.5 w-3.5 text-slate-500" />;
    }
  };

  const getStepIconBg = (type: string) => {
    switch (type) {
      case "start": return "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/30";
      case "end": return "bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/30";
      case "message": return "bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/30";
      case "question": return "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/30";
      case "input": return "bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/30";
      case "agent": return "bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/30";
      default: return "bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto font-sans relative">
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
              <h2 className="text-base font-bold mb-2">{item.title}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed mb-6">
                {item.desc}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => setActivePreview(item)}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-850 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors"
              >
                <Eye className="h-4 w-4" />
                Preview Flow Diagram
              </button>

              <Link
                href={`/dashboard/bots/create?template=${item.id}`}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-indigo-650 bg-indigo-600 py-2.5 text-xs font-bold text-white shadow hover:bg-indigo-550 transition-colors"
              >
                Use Blueprint Template
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {activePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            {/* Close Button */}
            <button 
              onClick={() => setActivePreview(null)}
              className="absolute right-5 top-5 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-450 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3.5 pr-8 pb-4 border-b border-slate-100 dark:border-slate-850">
              <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/40 p-2.5 text-indigo-600 dark:text-indigo-400">
                <activePreview.icon className="h-5.5 w-5.5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">{activePreview.title} Flow</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Step-by-step layout blueprint details</p>
              </div>
            </div>

            {/* Steps Timeline (Scrollable) */}
            <div className="flex-1 overflow-y-auto py-5 px-1 space-y-0.5">
              {activePreview.steps.map((step, sIdx) => {
                const isLast = sIdx === activePreview.steps.length - 1;
                return (
                  <div key={sIdx} className="flex gap-4 group">
                    <div className="flex flex-col items-center">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${getStepIconBg(step.type)}`}>
                        {getStepIcon(step.type)}
                      </div>
                      {!isLast && (
                        <div className="w-0.5 flex-1 bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-950/50 my-1 min-h-[35px] transition-colors" />
                      )}
                    </div>
                    <div className="pb-5 pt-0.5">
                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 leading-tight">{step.label}</h4>
                      <p className="text-[10.5px] text-slate-500 dark:text-slate-450 mt-1 leading-relaxed">{step.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between">
              <button 
                onClick={() => setActivePreview(null)}
                className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors"
              >
                Close Preview
              </button>

              <Link
                href={`/dashboard/bots/create?template=${activePreview.id}`}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-650 bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-indigo-550 transition-colors"
              >
                Use Template
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple Help icon helper
function HelpCircleIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}
