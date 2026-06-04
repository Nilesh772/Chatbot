"use client";

import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import Link from "next/link";
import { Check } from "lucide-react";

export default function PricingPage() {
  const plans = [
    {
      name: "Free Sandbox",
      price: "$0",
      desc: "Perfect for local development and sandbox evaluation.",
      features: [
        "1 Active Chatbot",
        "100 Chats / month",
        "Basic Analytics Dashboard",
        "Standard Chat Node Types",
        "Standard Widget Embeds",
        "Email Support"
      ],
      cta: "Register Sandbox",
      href: "/register",
      popular: false
    },
    {
      name: "Pro Builder",
      price: "$29",
      desc: "For growing websites wanting branding removal and full downloads.",
      features: [
        "Unlimited Chatbots",
        "5,000 Chats / month",
        "Remove ChetBot branding logo",
        "Export Leads to CSV & Excel",
        "Advanced Analytics & Funnels",
        "Form Nodes & Live Agent Handovers",
        "Priority Email Support"
      ],
      cta: "Get Started Pro",
      href: "/register",
      popular: true
    },
    {
      name: "Enterprise Custom",
      price: "$99",
      desc: "Designed for high-traffic platforms and white-labeling.",
      features: [
        "Unlimited Chatbots & Chats",
        "White-label custom widget script",
        "Multi-agent queue routing",
        "Dedicated database instance option",
        "SLA Response Times",
        "24/7 Priority Support"
      ],
      cta: "Contact Sales",
      href: "/register",
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Transparent, Simple Pricing
            </h1>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Build your chatbot, design customized templates, and try embedding scripts. No hidden fees or automatic credit card renewals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-12">
            {plans.map((plan, idx) => (
              <div
                key={idx}
                className={`rounded-2xl border bg-white dark:bg-slate-900 p-8 flex flex-col justify-between relative shadow-sm hover:shadow-md transition-all ${
                  plan.popular ? "border-indigo-600 dark:border-indigo-500 scale-102" : "border-slate-200 dark:border-slate-800"
                }`}
              >
                {plan.popular && (
                  <span className="absolute top-0 right-6 -translate-y-1/2 rounded-full bg-indigo-600 text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1 shadow">
                    Best Value
                  </span>
                )}
                <div>
                  <h2 className="text-xl font-bold text-slate-950 dark:text-white">{plan.name}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 min-h-10">{plan.desc}</p>
                  <div className="mt-4 flex items-baseline text-slate-950 dark:text-white">
                    <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
                    <span className="ml-1 text-sm font-semibold text-slate-500">/month</span>
                  </div>
                  <ul className="mt-8 space-y-4 text-sm">
                    {plan.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2.5 text-slate-650 dark:text-slate-350">
                        <Check className="h-4.5 w-4.5 text-indigo-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href={plan.href}
                  className={`w-full text-center rounded-xl py-3.5 text-sm font-bold mt-8 transition-colors ${
                    plan.popular
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/25"
                      : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white"
                  }`}
                >
                  {plan.cta}
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
