"use client";

import Link from "next/link";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import { useState } from "react";
import { 
  ArrowRight, Bot, Zap, Palette, BarChart3, Users, Code, Sparkles, Check, 
  MessageSquare, Star, HelpCircle, ChevronDown, Activity, RefreshCw 
} from "lucide-react";

export default function Home() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setActiveFaq(activeFaq === idx ? null : idx);
  };

  const templates = [
    { title: "Lead Generation", icon: Users, desc: "Collect names, emails, and phone numbers with custom qualification rules." },
    { title: "Customer Support", icon: Bot, desc: "Solve common questions automatically and route complex issues to human agents." },
    { title: "Appointment Booking", icon: Zap, desc: "Let users schedule calls and bookings directly in the conversation flow." },
    { title: "Product Inquiry", icon: Sparkles, desc: "Recommend products and capture customer preferences in real-time." },
  ];

  const features = [
    {
      title: "Visual Flow Builder",
      desc: "Drag, drop, and link chatbot conversation boxes. Support for over 20+ specialized node blocks.",
      icon: Code,
      color: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
    },
    {
      title: "Theme Customizer",
      desc: "Change colors, rounded corners, fonts, and avatars. Matches your website branding instantly.",
      icon: Palette,
      color: "bg-pink-50 text-pink-600 dark:bg-pink-950/30 dark:text-pink-400"
    },
    {
      title: "Instant Lead Storing",
      desc: "Every detail captured (email, phone, text) is stored in a clean dashboard. Export to CSV in 1-click.",
      icon: Users,
      color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
    },
    {
      title: "Conversion Analytics",
      desc: "Track visitors, chat starts, lead capture rates, and drop-off points with visual charts.",
      icon: BarChart3,
      color: "bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400"
    }
  ];

  const faqs = [
    {
      q: "Do I need coding experience to use ChetBot?",
      a: "No! ChetBot is built entirely for non-technical users. You can create flows, style your chat bubble, and export leads using our graphical interface. You only need to copy and paste one line of script on your website."
    },
    {
      q: "How does the widget load on my website?",
      a: "The widget loads asynchronously, meaning it won't impact your page load times. It's lightweight, pure JavaScript, and doesn't rely on jQuery, Bootstrap, or other bulky libraries."
    },
    {
      q: "What CMS platforms do you support?",
      a: "We support HTML sites, WordPress, PHP templates, Laravel, Shopify, React, Next.js, and custom web setups. We provide specific copy-paste embedding guides for each platform."
    },
    {
      q: "Can I fall back to human support?",
      a: "Yes! You can add a 'Live Agent' node to any path. When visitors hit this step, the chatbot will hold the conversation and show a status banner, letting you review details inside your Leads dashboard."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 lg:pt-28 lg:pb-24 border-b border-slate-100 dark:border-slate-900 bg-gradient-to-b from-indigo-50/20 via-white to-transparent dark:from-indigo-950/10 dark:via-slate-950">
        {/* Ambient glow backgrounds */}
        <div className="absolute top-0 left-1/4 -z-10 h-72 w-72 rounded-full bg-indigo-400/10 blur-3xl dark:bg-indigo-600/10" />
        <div className="absolute top-20 right-1/4 -z-10 h-72 w-72 rounded-full bg-violet-400/10 blur-3xl dark:bg-violet-600/10" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/40 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-400 mb-6 hover:scale-102 transition-transform">
            <Sparkles className="h-3.5 w-3.5 animate-spin-slow" />
            Visual SaaS Chatbot Builder Platform
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-slate-900 dark:text-white max-w-4xl mx-auto leading-[1.1]">
            Build Custom Chatbots{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-400">
              Visually
            </span>{" "}
            Without Writing Code
          </h1>

          <p className="mt-6 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Create, design, and deploy interactive chat widgets on any website in minutes. Turn anonymous traffic into verified leads and automate your client onboarding step-by-step.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 hover:shadow-indigo-500/35 transition-all duration-200 hover:-translate-y-0.5"
            >
              Get Started for Free
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/templates"
              className="flex items-center gap-2 rounded-xl border border-slate-350 bg-white dark:bg-slate-900 dark:border-slate-800 px-6 py-3.5 text-base font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 hover:border-slate-400 dark:hover:border-slate-700 transition-all duration-200"
            >
              Explore Templates
            </Link>
          </div>

          {/* Interactive Mockup Component */}
          <div className="mt-16 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl p-2 max-w-5xl mx-auto overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 py-2.5 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-yellow-400" />
                <span className="h-3 w-3 rounded-full bg-green-400" />
                <span className="text-xs text-slate-400 font-medium ml-2 font-mono">chetbot-editor-canvas</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                <Activity className="h-3.5 w-3.5 animate-pulse" />
                Autosaved to Database
              </div>
            </div>

            {/* Visual Editor Drawing */}
            <div className="relative h-[320px] sm:h-[400px] w-full bg-slate-50 dark:bg-slate-950 overflow-hidden bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] dark:bg-[radial-gradient(#1e293b_1.5px,transparent_1.5px)] [background-size:24px_24px] flex items-center justify-center">
              {/* React Flow Nodes Drawing */}
              <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-6 px-4">
                {/* Node 1: Start */}
                <div className="w-56 shrink-0 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md p-3.5 text-left border-l-4 border-l-green-500">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
                    <span>Start Node</span>
                    <Zap className="h-3.5 w-3.5 text-green-500" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Conversation Begins</p>
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 absolute top-1/2 -right-1.25 border border-white" />
                </div>

                {/* Arrow indicator */}
                <div className="text-slate-400 text-xl hidden sm:block">➔</div>

                {/* Node 2: Message */}
                <div className="w-64 shrink-0 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md p-3.5 text-left border-l-4 border-l-indigo-600">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
                    <span>Bot Message</span>
                    <MessageSquare className="h-3.5 w-3.5 text-indigo-500" />
                  </div>
                  <p className="text-xs italic text-slate-700 dark:text-slate-300">"Welcome! Let's get you set up with a custom plan. Ready?"</p>
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 absolute top-1/2 -left-1.25 border border-white" />
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 absolute top-1/2 -right-1.25 border border-white" />
                </div>

                {/* Arrow indicator */}
                <div className="text-slate-400 text-xl hidden sm:block">➔</div>

                {/* Node 3: Inputs */}
                <div className="w-60 shrink-0 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md p-3.5 text-left border-l-4 border-l-amber-500">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
                    <span>Email Capture</span>
                    <Check className="h-3.5 w-3.5 text-amber-500" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Store value in <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px]">visitor_email</code></p>
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 absolute top-1/2 -left-1.25 border border-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white dark:bg-slate-900/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-slate-900 dark:text-white">
              Packed with features to automate client capture
            </h2>
            <p className="mt-4 text-base text-slate-600 dark:text-slate-400">
              No enterprise complexity. Just the core visual tools you need to support site visitors and capture qualified contact leads instantly.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feat, idx) => (
              <div
                key={idx}
                className="group relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300"
              >
                <div className={`inline-flex rounded-xl p-3 ${feat.color} mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <feat.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{feat.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 border-t border-slate-100 dark:border-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Three Steps to Live</h2>
            <p className="mt-4 text-base text-slate-600 dark:text-slate-400">
              Set up your custom chatbot in less than 5 minutes and deploy to any platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="text-center space-y-3 px-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-lg shadow-md shadow-indigo-500/20">
                1
              </div>
              <h3 className="text-lg font-bold">Build Your Flow Visually</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Connect message nodes, quick reply tags, and capture fields. Preview execution right inside the flow editor.
              </p>
            </div>
            <div className="text-center space-y-3 px-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-lg shadow-md shadow-indigo-500/20">
                2
              </div>
              <h3 className="text-lg font-bold">Customize Widget Theme</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Style headers, bubble colors, positions (left or right), borders, and font style to match your website branding.
              </p>
            </div>
            <div className="text-center space-y-3 px-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-lg shadow-md shadow-indigo-500/20">
                3
              </div>
              <h3 className="text-lg font-bold">Embed Script on Site</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Generate the lightweight script tag and paste it on HTML, WordPress, Shopify, Laravel, or React web servers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Template Showcase */}
      <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
        {/* Glow */}
        <div className="absolute bottom-0 right-0 -z-10 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">Preloaded Blueprints</span>
            <h2 className="text-3xl font-extrabold sm:text-4xl">Chatbot Templates for Every Goal</h2>
            <p className="mt-4 text-base text-slate-450 text-slate-400">
              Start with a fully configured flow. Customize parameters inside the editor to make it your own.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {templates.map((temp, idx) => (
              <div
                key={idx}
                className="flex items-start gap-4 rounded-2xl border border-slate-800 bg-slate-950 p-6 hover:border-slate-700 transition-colors"
              >
                <div className="rounded-lg bg-indigo-600/15 p-2.5 text-indigo-400 shrink-0">
                  <temp.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{temp.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{temp.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Fair, Simple Pricing</h2>
            <p className="mt-4 text-base text-slate-600 dark:text-slate-400">
              Choose the plan that suits your volume. Upgrade or downgrade anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-8 space-y-6 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Free Sandbox</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Test out features locally.</p>
                <div className="mt-4 flex items-baseline text-slate-950 dark:text-white">
                  <span className="text-4xl font-extrabold tracking-tight">$0</span>
                  <span className="ml-1 text-sm font-semibold text-slate-500">/month</span>
                </div>
                <ul className="mt-6 space-y-3.5 text-sm">
                  <li className="flex items-center gap-2 text-slate-650 dark:text-slate-350">
                    <Check className="h-4 w-4 text-indigo-500" />
                    1 Chatbot Active
                  </li>
                  <li className="flex items-center gap-2 text-slate-650 dark:text-slate-350">
                    <Check className="h-4 w-4 text-indigo-500" />
                    100 Chats / month
                  </li>
                  <li className="flex items-center gap-2 text-slate-650 dark:text-slate-350">
                    <Check className="h-4 w-4 text-indigo-500" />
                    Basic Analytics Dashboard
                  </li>
                </ul>
              </div>
              <Link
                href="/register"
                className="w-full text-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 py-3 text-sm font-semibold transition-colors mt-8"
              >
                Sign Up
              </Link>
            </div>

            {/* Pro */}
            <div className="rounded-2xl border-2 border-indigo-600 bg-white dark:bg-slate-900 p-8 space-y-6 relative flex flex-col justify-between shadow-xl">
              <div className="absolute top-0 right-6 -translate-y-1/2 rounded-full bg-indigo-600 text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1 shadow-md">
                Popular
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pro Builder</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Ideal for growing sites.</p>
                <div className="mt-4 flex items-baseline text-slate-950 dark:text-white">
                  <span className="text-4xl font-extrabold tracking-tight">$29</span>
                  <span className="ml-1 text-sm font-semibold text-slate-500">/month</span>
                </div>
                <ul className="mt-6 space-y-3.5 text-sm">
                  <li className="flex items-center gap-2 text-slate-650 dark:text-slate-350">
                    <Check className="h-4 w-4 text-indigo-500" />
                    Unlimited Chatbots
                  </li>
                  <li className="flex items-center gap-2 text-slate-650 dark:text-slate-350">
                    <Check className="h-4 w-4 text-indigo-500" />
                    5,000 Chats / month
                  </li>
                  <li className="flex items-center gap-2 text-slate-650 dark:text-slate-350">
                    <Check className="h-4 w-4 text-indigo-500" />
                    Remove branding logo
                  </li>
                  <li className="flex items-center gap-2 text-slate-650 dark:text-slate-350">
                    <Check className="h-4 w-4 text-indigo-500" />
                    Export leads to CSV/Excel
                  </li>
                </ul>
              </div>
              <Link
                href="/register"
                className="w-full text-center rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white py-3 text-sm font-bold shadow-md shadow-indigo-500/20 transition-all mt-8"
              >
                Get Started
              </Link>
            </div>

            {/* Enterprise */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-8 space-y-6 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Enterprise Custom</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">For high-traffic agencies.</p>
                <div className="mt-4 flex items-baseline text-slate-950 dark:text-white">
                  <span className="text-4xl font-extrabold tracking-tight">$99</span>
                  <span className="ml-1 text-sm font-semibold text-slate-500">/month</span>
                </div>
                <ul className="mt-6 space-y-3.5 text-sm">
                  <li className="flex items-center gap-2 text-slate-650 dark:text-slate-350">
                    <Check className="h-4 w-4 text-indigo-500" />
                    Unlimited Everything
                  </li>
                  <li className="flex items-center gap-2 text-slate-650 dark:text-slate-350">
                    <Check className="h-4 w-4 text-indigo-500" />
                    Whitelabel custom domains
                  </li>
                  <li className="flex items-center gap-2 text-slate-650 dark:text-slate-350">
                    <Check className="h-4 w-4 text-indigo-500" />
                    Dedicated agent routing
                  </li>
                  <li className="flex items-center gap-2 text-slate-650 dark:text-slate-350">
                    <Check className="h-4 w-4 text-indigo-500" />
                    Priority SLAs & support
                  </li>
                </ul>
              </div>
              <Link
                href="/register"
                className="w-full text-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 py-3 text-sm font-semibold transition-colors mt-8"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/20 border-y border-slate-100 dark:border-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">What Builders Say</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
              <div className="flex gap-1 text-amber-500 mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-4.5 w-4.5 fill-current" />)}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                "ChetBot saved us thousands in support costs. We set up an onboarding flow in ten minutes, custom-tailored the colors, and embedded it on our Next.js dashboard."
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-slate-250 bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 shrink-0">
                  MS
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Marcus Stone</h4>
                  <span className="text-xs text-slate-500">SaaS Founder</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
              <div className="flex gap-1 text-amber-500 mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-4.5 w-4.5 fill-current" />)}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                "Our marketing team created a custom lead generation form and connected it to our pricing paths. We've seen a 30% increase in qualified consultation bookings."
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-slate-250 bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 shrink-0">
                  LH
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Lauren Hall</h4>
                  <span className="text-xs text-slate-500">Marketing Lead</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
              <div className="flex gap-1 text-amber-500 mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-4.5 w-4.5 fill-current" />)}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                "We needed a lightweight widget for WordPress that didn't drag in jQuery. ChetBot is exactly what we wanted—blazing fast, pure JS, and highly customizable."
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-slate-250 bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 shrink-0">
                  DK
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Daniel Kim</h4>
                  <span className="text-xs text-slate-500">WordPress Developer</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="flex w-full items-center justify-between px-5 py-4.5 text-left font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850/50"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`h-5 w-5 text-slate-450 transition-transform duration-350 ${isOpen ? "rotate-180 text-indigo-500" : ""}`} />
                  </button>
                  <div
                    className={`transition-all duration-300 ease-in-out ${
                      isOpen ? "max-h-40 border-t border-slate-100 dark:border-slate-850 px-5 py-4" : "max-h-0 overflow-hidden"
                    }`}
                  >
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{faq.a}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
