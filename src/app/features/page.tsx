"use client";

import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import { 
  Bot, Settings, BarChart2, ShieldAlert, Code, Check, 
  Workflow, Sparkles, Layers, Sliders, Smartphone, Cpu 
} from "lucide-react";

export default function FeaturesPage() {
  const details = [
    {
      title: "Visual Drag & Drop Canvas",
      icon: Workflow,
      desc: "Connect over 20+ specialized flow nodes including Message, Quick Reply, Button, Form, Email, and Name inputs. Organize complex user journeys by dragging lines between connector pins.",
    },
    {
      title: "Live Theme Builder",
      icon: Sliders,
      desc: "Personalize the widget's appearance. Modify background headers, chat bubble colors, border radius, and active typography. Review styling updates live in a mock chat dialog.",
    },
    {
      title: "Comprehensive Analytics",
      icon: BarChart2,
      desc: "Monitor visual funnel trends. Inspect unique visitor volumes, conversation initiation rates, and lead capture margins. Spot customer drop-off points inside visual flow nodes.",
    },
    {
      title: "Universal Code Embed",
      icon: Code,
      desc: "Paste one lightweight asynchronous JS script tag to deploy on HTML templates, WordPress widgets, PHP codebases, Laravel views, React components, and Shopify templates.",
    },
    {
      title: "Mobile First Design",
      icon: Smartphone,
      desc: "Fully responsive floating bubbles and chat modules. Resizes fluidly to fit small smartphone screens, tablets, and wide desktop displays without breaking host site dimensions.",
    },
    {
      title: "Persistent Lead Tables",
      icon: Layers,
      desc: "Every visitor input captured (names, emails, phones, customized text feedback) is indexed in a secure database table. Filter, search, and export data as raw CSV spreadsheets.",
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Engineered for Conversational Success
            </h1>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              No complex setup, no paid services needed. Explore the suite of drag-and-drop tools that help you convert traffic into sales leads.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            {details.map((item, idx) => (
              <div 
                key={idx}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6.5 shadow-sm hover:shadow-md transition-all"
              >
                <div className="inline-flex rounded-xl bg-indigo-50 dark:bg-indigo-950/40 p-3 text-indigo-600 dark:text-indigo-400 mb-5">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold mb-2.5">{item.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
