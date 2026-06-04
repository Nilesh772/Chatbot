"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Bot, Sparkles, Check, Users, MessageSquare, Calendar, Palette } from "lucide-react";

export default function CreateBotWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("Hi! Welcome to our website. How can I help you today?");
  
  // Avatar selections
  const avatars = [
    { name: "Support Hero", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80&auto=format&fit=crop&q=60" },
    { name: "Virtual Helper", url: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=80&auto=format&fit=crop&q=60" },
    { name: "Agent Emma", url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&auto=format&fit=crop&q=60" },
    { name: "Agent Alex", url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&auto=format&fit=crop&q=60" },
  ];
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0].url);

  // Color theme selections
  const colors = [
    { name: "Classic Indigo", hex: "#4f46e5" },
    { name: "Teal Support", hex: "#0f766e" },
    { name: "Vibrant Pink", hex: "#db2777" },
    { name: "Sunset Orange", hex: "#ea580c" },
    { name: "Royal Purple", hex: "#7c3aed" },
  ];
  const [selectedColor, setSelectedColor] = useState(colors[0].hex);

  // Template blueprints
  const templates = [
    { id: "scratch", name: "Build from Scratch", icon: Bot, desc: "Start with a clean canvas containing just a Welcome Node." },
    { id: "lead_gen", name: "Lead Generation", icon: Users, desc: "Collect visitor names, emails, and phone details using structured inputs." },
    { id: "support", name: "Customer Support", icon: MessageSquare, desc: "Solve common questions with button routing and live agent handovers." },
    { id: "booking", name: "Appointment Booking", icon: Calendar, desc: "Form-based appointment and scheduling ticket collection." },
  ];
  const [selectedTemplate, setSelectedTemplate] = useState("lead_gen");

  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    if (step === 1 && !name.trim()) return;
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          avatarUrl: selectedAvatar,
          welcomeMessage,
          template: selectedTemplate,
          widgetColor: selectedColor,
          headerColor: selectedColor
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create bot");

      // Save initial widget color setting via API if custom color selected
      if (selectedColor !== "#4f46e5") {
        await fetch(`/api/bots/${data.bot.id}/widget`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            widgetColor: selectedColor,
            headerColor: selectedColor
          })
        });
      }

      router.push(`/dashboard/bots/${data.bot.id}`);
    } catch (e) {
      console.error(e);
      alert("Error generating bot. Please try again.");
      setLoading(false);
    }
  };

  const stepsCount = 5;

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-8 min-h-[calc(100vh-64px)] flex flex-col justify-center">
      {/* Back button */}
      <div>
        <Link href="/dashboard/bots" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to list
        </Link>
      </div>

      {/* Title */}
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Create Chatbot Wizard</h1>
        <p className="text-sm text-slate-500 mt-1">Configure details to automatically build your chatbot.</p>
      </div>

      {/* Progress tracker */}
      <div className="flex items-center justify-between max-w-md mx-auto relative px-2">
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 dark:bg-slate-800 -z-10" />
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-indigo-600 -z-10 transition-all duration-355"
          style={{ width: `${((step - 1) / (stepsCount - 1)) * 100}%` }}
        />
        {[...Array(stepsCount)].map((_, idx) => {
          const sNum = idx + 1;
          const isDone = step > sNum;
          const isActive = step === sNum;
          return (
            <div
              key={idx}
              className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                isDone
                  ? "bg-indigo-600 text-white"
                  : isActive
                  ? "bg-indigo-50 border border-indigo-600 text-indigo-600 dark:bg-slate-900"
                  : "bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-400"
              }`}
            >
              {isDone ? <Check className="h-4 w-4" /> : sNum}
            </div>
          );
        })}
      </div>

      {/* Form Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6.5 min-h-[280px] flex flex-col justify-between shadow-md">
        
        {/* Step 1: Bot Name */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-250">
            <h3 className="font-bold text-base">Step 1: Choose a Chatbot Name</h3>
            <p className="text-xs text-slate-500">This name will be displayed in the widget header to your website visitors.</p>
            <div className="space-y-1 pt-2">
              <label className="text-xs font-semibold text-slate-400">Bot Name</label>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Support Assistant"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-semibold"
              />
            </div>
          </div>
        )}

        {/* Step 2: Avatar Select */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-250">
            <h3 className="font-bold text-base">Step 2: Choose a Bot Avatar</h3>
            <p className="text-xs text-slate-500">Pick an illustration or agent photo that will float next to messages.</p>
            <div className="grid grid-cols-4 gap-4 pt-2">
              {avatars.map((av, idx) => {
                const selected = selectedAvatar === av.url;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedAvatar(av.url)}
                    className={`flex flex-col items-center gap-2 p-2.5 rounded-xl border transition-all ${
                      selected
                        ? "border-indigo-600 bg-indigo-55 bg-indigo-50/40"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850"
                    }`}
                  >
                    <img src={av.url} alt={av.name} className="h-14 w-14 rounded-full object-cover shadow-sm" />
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 text-center truncate w-full">{av.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Color Select */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in duration-250">
            <h3 className="font-bold text-base">Step 3: Widget Theme Tone</h3>
            <p className="text-xs text-slate-500">Select a primary color scheme that matches your website palette.</p>
            <div className="flex flex-col gap-3 pt-2">
              {colors.map((col, idx) => {
                const selected = selectedColor === col.hex;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedColor(col.hex)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      selected
                        ? "border-indigo-600 bg-indigo-50/40"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="h-6 w-6 rounded-full border shadow-sm shrink-0" style={{ backgroundColor: col.hex }} />
                      <span className="text-xs font-bold">{col.name}</span>
                    </div>
                    {selected && <Check className="h-4 w-4 text-indigo-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4: Welcome Greeting Message */}
        {step === 4 && (
          <div className="space-y-4 animate-in fade-in duration-250">
            <h3 className="font-bold text-base">Step 4: Welcome Greeting Message</h3>
            <p className="text-xs text-slate-500">This is the first message bubble the bot outputs when the chat initializes.</p>
            <div className="space-y-1 pt-2">
              <label className="text-xs font-semibold text-slate-400">Welcome Message</label>
              <textarea
                required
                rows={3}
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                placeholder="Write message bubble text..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* Step 5: Apply Blueprint Templates */}
        {step === 5 && (
          <div className="space-y-4 animate-in fade-in duration-250">
            <h3 className="font-bold text-base">Step 5: Pick a Flow Blueprint</h3>
            <p className="text-xs text-slate-500">Preload the canvas with structured node maps. You can customize them later.</p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              {templates.map((temp) => {
                const selected = selectedTemplate === temp.id;
                return (
                  <button
                    key={temp.id}
                    onClick={() => setSelectedTemplate(temp.id)}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                      selected
                        ? "border-indigo-600 bg-indigo-50/40"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850"
                    }`}
                  >
                    <div className={`rounded-lg p-1.5 shrink-0 ${selected ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                      <temp.icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold">{temp.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal">{temp.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step Actions Bar */}
        <div className="mt-8 border-t border-slate-100 dark:border-slate-850 pt-5 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 disabled:opacity-30 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </button>
          
          {step < stepsCount ? (
            <button
              onClick={handleNext}
              disabled={step === 1 && !name.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-650 bg-indigo-600 text-white font-bold px-4 py-2.5 text-xs shadow hover:bg-indigo-500 disabled:opacity-50 transition-colors"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 text-white font-bold px-5 py-2.5 text-xs shadow shadow-indigo-500/20 hover:bg-indigo-500 disabled:opacity-50 transition-all hover:scale-102"
            >
              <Sparkles className="h-4 w-4" />
              {loading ? "Generating Chatbot..." : "Generate Chatbot"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
