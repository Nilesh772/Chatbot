"use client";

import { useEffect, useState } from "react";
import { Bot, Save, Check, RefreshCw, Palette, HelpCircle, Sliders } from "lucide-react";

interface WidgetSettings {
  botName: string;
  avatarUrl: string;
  welcomeMessage: string;
  widgetColor: string;
  headerColor: string;
  position: string;
  bubbleStyle: string;
  font: string;
  borderRadius: number;
  launcherIcon?: string;
  headerTextColor?: string;
  leftMessageBgColor?: string;
  leftMessageTextColor?: string;
  rightMessageBgColor?: string;
  rightMessageTextColor?: string;
  widgetBgColor?: string;
  launcherGreeting?: string;
  launcherGreetingEnabled?: boolean;
  launcherAnimation?: string;
}

const PRESET_AVATARS = [
  {
    name: "Friendly Bot",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 24px; height: 24px;"><rect width="18" height="10" x="3" y="11" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4M8 16h.01M16 16h.01M6 11V9a4 4 0 0 1 8 0v2M18 11V9M9 16h6"/></svg>`
  },
  {
    name: "AI Sparkles",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 24px; height: 24px;"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`
  },
  {
    name: "Customer Support",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 24px; height: 24px;"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
  },
  {
    name: "Smile Chat",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 24px; height: 24px;"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/><path d="M9 10h.01M15 10h.01M9 15a6 6 0 0 0 6 0"/></svg>`
  }
];

const PRESET_LAUNCHERS = [
  {
    name: "Help Circle",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px;"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
  },
  {
    name: "Headset Support",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px;"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>`
  },
  {
    name: "Double Msg",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px;"><path d="M17 8h2a2 2 0 0 1 2 2v6l-4-4h-2a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2z"/><path d="M3 12V6a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7l-4 4z"/></svg>`
  },
  {
    name: "Sparkles AI",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px;"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`
  }
];

export default function ThemeBuilderTab({ botId }: { botId: string }) {
  const [settings, setSettings] = useState<WidgetSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Live preview properties
  const [botName, setBotName] = useState("ChetBot Helper");
  const [welcomeMessage, setWelcomeMessage] = useState("Hello! How can I help you today?");
  const [widgetColor, setWidgetColor] = useState("#4f46e5");
  const [headerColor, setHeaderColor] = useState("#4f46e5");
  const [position, setPosition] = useState("bottom-right");
  const [bubbleStyle, setBubbleStyle] = useState("round");
  const [font, setFont] = useState("Inter");
  const [borderRadius, setBorderRadius] = useState(16);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [launcherIcon, setLauncherIcon] = useState("");
  
  // Custom theme variables
  const [headerTextColor, setHeaderTextColor] = useState("#ffffff");
  const [leftMessageBgColor, setLeftMessageBgColor] = useState("#F1F5F9");
  const [leftMessageTextColor, setLeftMessageTextColor] = useState("#0F172A");
  const [rightMessageBgColor, setRightMessageBgColor] = useState("#4F46E5");
  const [rightMessageTextColor, setRightMessageTextColor] = useState("#ffffff");
  const [widgetBgColor, setWidgetBgColor] = useState("#ffffff");
  const [launcherGreeting, setLauncherGreeting] = useState("Hi! Need help? 👋");
  const [launcherGreetingEnabled, setLauncherGreetingEnabled] = useState(true);
  const [launcherAnimation, setLauncherAnimation] = useState("bounce");

  const [avatarType, setAvatarType] = useState<"url" | "svg" | "preset">("url");
  const [launcherIconType, setLauncherIconType] = useState<"default" | "url" | "svg" | "preset">("default");

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingLauncher, setUploadingLauncher] = useState(false);

  const handleFileUpload = async (file: File, target: "avatar" | "launcher") => {
    if (target === "avatar") setUploadingAvatar(true);
    if (target === "launcher") setUploadingLauncher(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        if (target === "avatar") {
          setAvatarUrl(data.url);
        } else {
          setLauncherIcon(data.url);
        }
      } else {
        alert(data.error || "Failed to upload file");
      }
    } catch (e) {
      console.error("Upload error:", e);
      alert("An error occurred during upload.");
    } finally {
      if (target === "avatar") setUploadingAvatar(false);
      if (target === "launcher") setUploadingLauncher(false);
    }
  };

  const [launcherBgTransparent, setLauncherBgTransparent] = useState(false);
  const [launcherIconSize, setLauncherIconSize] = useState(28);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch(`/api/bots/${botId}/widget`);
        const data = await res.json();
        if (!data.error) {
          setSettings(data);
          setBotName(data.botName || "ChetBot Helper");
          setWelcomeMessage(data.welcomeMessage || "Hello!");
          setWidgetColor(data.widgetColor || "#4f46e5");
          setHeaderColor(data.headerColor || "#4f46e5");
          setPosition(data.position || "bottom-right");
          setBubbleStyle(data.bubbleStyle || "round");
          setFont(data.font || "Inter");
          setBorderRadius(data.borderRadius ?? 16);
          setAvatarUrl(data.avatarUrl || "");
          const launcher = data.launcherIcon || "";
          setLauncherIcon(launcher);
          setLauncherBgTransparent(data.launcherBgTransparent === true || data.launcherBgTransparent === "true" || false);
          setLauncherIconSize(data.launcherIconSize ?? 28);
          setHeaderTextColor(data.headerTextColor || "#ffffff");
          setLeftMessageBgColor(data.leftMessageBgColor || "#F1F5F9");
          setLeftMessageTextColor(data.leftMessageTextColor || "#0F172A");
          setRightMessageBgColor(data.rightMessageBgColor || data.widgetColor || "#4F46E5");
          setRightMessageTextColor(data.rightMessageTextColor || "#ffffff");
          setWidgetBgColor(data.widgetBgColor || "#ffffff");
          setLauncherGreeting(data.launcherGreeting || "Hi! Need help? 👋");
          setLauncherGreetingEnabled(data.launcherGreetingEnabled !== false && data.launcherGreetingEnabled !== "false");
          setLauncherAnimation(data.launcherAnimation || "bounce");

          // Deduce avatar type
          if (data.avatarUrl && data.avatarUrl.trim().startsWith("<svg")) {
            const isPreset = PRESET_AVATARS.some(p => p.svg === data.avatarUrl);
            setAvatarType(isPreset ? "preset" : "svg");
          } else {
            setAvatarType("url");
          }

          // Deduce launcher type
          if (launcher && launcher.trim().startsWith("<svg")) {
            const isPreset = PRESET_LAUNCHERS.some(p => p.svg === launcher);
            setLauncherIconType(isPreset ? "preset" : "svg");
          } else if (launcher) {
            setLauncherIconType("url");
          } else {
            setLauncherIconType("default");
          }
        }
      } catch (e) {
        console.error("Failed to load settings:", e);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [botId]);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      const res = await fetch(`/api/bots/${botId}/widget`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botName,
          welcomeMessage,
          widgetColor,
          headerColor,
          position,
          bubbleStyle,
          font,
          borderRadius,
          avatarUrl,
          launcherIcon: launcherIconType === "default" ? "" : launcherIcon,
          launcherBgTransparent,
          launcherIconSize,
          headerTextColor,
          leftMessageBgColor,
          leftMessageTextColor,
          rightMessageBgColor,
          rightMessageTextColor,
          widgetBgColor,
          launcherGreeting,
          launcherGreetingEnabled,
          launcherAnimation,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      }
    } catch (e) {
      console.error("Failed to update widget style:", e);
    } finally {
      setSaving(false);
    }
  };

  const getFontFamily = (fontName: string) => {
    switch (fontName) {
      case "Roboto":
        return "'Roboto', sans-serif";
      case "Courier":
        return "'Courier New', Courier, monospace";
      case "Inter":
      default:
        return "'Inter', sans-serif";
    }
  };

  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <link 
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto:wght@400;500;700&display=swap" 
        rel="stylesheet" 
      />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Settings Form Column */}
      <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-indigo-600" />
            <h3 className="font-bold text-sm">Visual Customizer</h3>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 text-xs shadow-sm transition-all"
          >
            {saving ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : success ? (
              <Check className="h-3.5 w-3.5 text-green-300 animate-in zoom-in-50" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {saving ? "Saving..." : success ? "Saved Theme" : "Save Changes"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Bot Name */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-500">Widget Header Name</label>
            <input
              type="text"
              value={botName}
              onChange={(e) => setBotName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 outline-none focus:border-indigo-500 transition-colors font-semibold"
            />
          </div>

          {/* Screen Position */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-500">Screen Position</label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 outline-none focus:border-indigo-500 text-slate-650"
            >
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
            </select>
          </div>

          {/* Widget Color Picker */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-500">Widget Primary Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={widgetColor}
                onChange={(e) => setWidgetColor(e.target.value)}
                className="h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white cursor-pointer shrink-0"
              />
              <input
                type="text"
                value={widgetColor}
                onChange={(e) => setWidgetColor(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 outline-none focus:border-indigo-500 transition-colors font-mono"
              />
            </div>
          </div>

          {/* Header Color Picker */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-500">Header Background Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={headerColor}
                onChange={(e) => setHeaderColor(e.target.value)}
                className="h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white cursor-pointer shrink-0"
              />
              <input
                type="text"
                value={headerColor}
                onChange={(e) => setHeaderColor(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 outline-none focus:border-indigo-500 transition-colors font-mono"
              />
            </div>
          </div>

          {/* Header Text Color */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-500">Header Text Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={headerTextColor}
                onChange={(e) => setHeaderTextColor(e.target.value)}
                className="h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white cursor-pointer shrink-0"
              />
              <input
                type="text"
                value={headerTextColor}
                onChange={(e) => setHeaderTextColor(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 outline-none focus:border-indigo-500 transition-colors font-mono"
              />
            </div>
          </div>

          {/* Widget Window Background */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-500">Widget Window Background</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={widgetBgColor}
                onChange={(e) => setWidgetBgColor(e.target.value)}
                className="h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white cursor-pointer shrink-0"
              />
              <input
                type="text"
                value={widgetBgColor}
                onChange={(e) => setWidgetBgColor(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 outline-none focus:border-indigo-500 transition-colors font-mono"
              />
            </div>
          </div>

          {/* Left Message Styling */}
          <div className="sm:col-span-2 space-y-2 p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="font-bold text-slate-700 dark:text-slate-350 block">Left Bubble (Bot Messages)</span>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-400">Background</label>
                <div className="flex gap-1.5">
                  <input
                    type="color"
                    value={leftMessageBgColor}
                    onChange={(e) => setLeftMessageBgColor(e.target.value)}
                    className="h-7 w-7 rounded border border-slate-200 cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={leftMessageBgColor}
                    onChange={(e) => setLeftMessageBgColor(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white dark:bg-slate-950 px-2 py-1 outline-none text-[11px]"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-400">Text Color</label>
                <div className="flex gap-1.5">
                  <input
                    type="color"
                    value={leftMessageTextColor}
                    onChange={(e) => setLeftMessageTextColor(e.target.value)}
                    className="h-7 w-7 rounded border border-slate-200 cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={leftMessageTextColor}
                    onChange={(e) => setLeftMessageTextColor(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white dark:bg-slate-950 px-2 py-1 outline-none text-[11px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Message Styling */}
          <div className="sm:col-span-2 space-y-2 p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="font-bold text-slate-700 dark:text-slate-350 block">Right Bubble (Visitor Messages)</span>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-400">Background</label>
                <div className="flex gap-1.5">
                  <input
                    type="color"
                    value={rightMessageBgColor}
                    onChange={(e) => {
                      setRightMessageBgColor(e.target.value);
                      setWidgetColor(e.target.value); // Sync primary color
                    }}
                    className="h-7 w-7 rounded border border-slate-200 cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={rightMessageBgColor}
                    onChange={(e) => {
                      setRightMessageBgColor(e.target.value);
                      setWidgetColor(e.target.value); // Sync primary color
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white dark:bg-slate-950 px-2 py-1 outline-none text-[11px]"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-400">Text Color</label>
                <div className="flex gap-1.5">
                  <input
                    type="color"
                    value={rightMessageTextColor}
                    onChange={(e) => setRightMessageTextColor(e.target.value)}
                    className="h-7 w-7 rounded border border-slate-200 cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={rightMessageTextColor}
                    onChange={(e) => setRightMessageTextColor(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white dark:bg-slate-950 px-2 py-1 outline-none text-[11px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Float Bubble Style */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-500">Float Bubble Style</label>
            <select
              value={bubbleStyle}
              onChange={(e) => setBubbleStyle(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 outline-none focus:border-indigo-500 text-slate-650"
            >
              <option value="round">Circular Sphere</option>
              <option value="square">Rounded Square</option>
            </select>
          </div>

          {/* Text Font family */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-500">Text Font family</label>
            <select
              value={font}
              onChange={(e) => setFont(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 outline-none focus:border-indigo-500 text-slate-650"
            >
              <option value="Inter">Inter (Sans)</option>
              <option value="Roboto">Roboto (Clean)</option>
              <option value="Courier">Courier (Monospace)</option>
            </select>
          </div>

          {/* Corner Rounding */}
          <div className="space-y-1 sm:col-span-2">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-slate-500">Corner Rounding</label>
              <span className="text-[10px] text-slate-400 font-mono">{borderRadius}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="28"
              value={borderRadius}
              onChange={(e) => setBorderRadius(parseInt(e.target.value))}
              className="w-full accent-indigo-600 mt-2 cursor-ew-resize"
            />
          </div>

          {/* Bot Profile Avatar Customization */}
          <div className="sm:col-span-2 space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
            <label className="font-bold text-slate-600 dark:text-slate-400 block">Bot Profile Avatar</label>
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl w-fit gap-1 text-[11px] font-semibold mb-2">
              <button
                type="button"
                onClick={() => setAvatarType("url")}
                className={`px-3 py-1 rounded-lg transition-all ${avatarType === "url" ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setAvatarType("svg")}
                className={`px-3 py-1 rounded-lg transition-all ${avatarType === "svg" ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
              >
                Custom SVG Code
              </button>
              <button
                type="button"
                onClick={() => setAvatarType("preset")}
                className={`px-3 py-1 rounded-lg transition-all ${avatarType === "preset" ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
              >
                Preset Icons
              </button>
            </div>

            {avatarType === "url" && (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label
                      htmlFor="avatar-upload"
                      className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50 dark:bg-slate-950/50 hover:bg-slate-100/50 dark:hover:bg-slate-950 cursor-pointer transition-all group"
                    >
                      {uploadingAvatar ? (
                        <div className="flex flex-col items-center gap-1">
                          <RefreshCw className="h-5 w-5 text-indigo-600 animate-spin" />
                          <span className="text-[10px] text-slate-500 font-semibold">Uploading...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-center">
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-50 dark:bg-indigo-950 group-hover:scale-110 transition-transform">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                            </svg>
                          </div>
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-350 mt-1">Choose PNG, GIF, SVG</span>
                          <span className="text-[9px] text-slate-400">Drag & drop or browse files</span>
                        </div>
                      )}
                      <input
                        id="avatar-upload"
                        type="file"
                        accept=".png,.jpg,.jpeg,.gif,.svg"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, "avatar");
                        }}
                        disabled={uploadingAvatar}
                      />
                    </label>
                  </div>
                  {avatarUrl && !avatarUrl.startsWith("<svg") && (
                    <div className="flex flex-col items-center gap-1.5 shrink-0 border border-slate-150 dark:border-slate-800 p-2 rounded-xl bg-white dark:bg-slate-900 shadow-sm">
                      <img src={avatarUrl} alt="Uploaded Avatar" className="h-10 w-10 rounded-full object-cover border border-slate-100" />
                      <button
                        type="button"
                        onClick={() => setAvatarUrl("")}
                        className="text-[9px] font-bold text-red-500 hover:text-red-650 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {avatarType === "svg" && (
              <textarea
                rows={3}
                value={avatarUrl.startsWith("<svg") ? avatarUrl : ""}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="Paste raw SVG code here... e.g. <svg viewBox='0 0 24 24'>...</svg>"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 outline-none focus:border-indigo-500 transition-colors font-mono text-[10px]"
              />
            )}

            {avatarType === "preset" && (
              <div className="grid grid-cols-4 gap-3 pt-1">
                {PRESET_AVATARS.map((item, idx) => {
                  const isActive = avatarUrl === item.svg;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarUrl(item.svg)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${isActive ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 shadow-sm" : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 hover:border-slate-350 dark:hover:border-slate-700 text-slate-500"}`}
                    >
                      <div className="text-slate-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: item.svg }} />
                      <span className="text-[9px] mt-1.5 font-medium">{item.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Launcher Icon Customization */}
          <div className="sm:col-span-2 space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
            <label className="font-bold text-slate-600 dark:text-slate-400 block">Chat Launcher Bubble Icon</label>
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl w-fit gap-1 text-[11px] font-semibold mb-2">
              <button
                type="button"
                onClick={() => {
                  setLauncherIconType("default");
                  setLauncherIcon("");
                }}
                className={`px-3 py-1 rounded-lg transition-all ${launcherIconType === "default" ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
              >
                Default
              </button>
              <button
                type="button"
                onClick={() => setLauncherIconType("url")}
                className={`px-3 py-1 rounded-lg transition-all ${launcherIconType === "url" ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setLauncherIconType("svg")}
                className={`px-3 py-1 rounded-lg transition-all ${launcherIconType === "svg" ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
              >
                Custom SVG Code
              </button>
              <button
                type="button"
                onClick={() => setLauncherIconType("preset")}
                className={`px-3 py-1 rounded-lg transition-all ${launcherIconType === "preset" ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
              >
                Preset Icons
              </button>
            </div>

            {launcherIconType === "url" && (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label
                      htmlFor="launcher-upload"
                      className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50 dark:bg-slate-950/50 hover:bg-slate-100/50 dark:hover:bg-slate-950 cursor-pointer transition-all group"
                    >
                      {uploadingLauncher ? (
                        <div className="flex flex-col items-center gap-1">
                          <RefreshCw className="h-5 w-5 text-indigo-600 animate-spin" />
                          <span className="text-[10px] text-slate-500 font-semibold">Uploading...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-center">
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-50 dark:bg-indigo-950 group-hover:scale-110 transition-transform">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                            </svg>
                          </div>
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-350 mt-1">Choose PNG, GIF, SVG</span>
                          <span className="text-[9px] text-slate-400">Drag & drop or browse files</span>
                        </div>
                      )}
                      <input
                        id="launcher-upload"
                        type="file"
                        accept=".png,.jpg,.jpeg,.gif,.svg"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, "launcher");
                        }}
                        disabled={uploadingLauncher}
                      />
                    </label>
                  </div>
                  {launcherIcon && !launcherIcon.startsWith("<svg") && (
                    <div className="flex flex-col items-center gap-1.5 shrink-0 border border-slate-150 dark:border-slate-800 p-2 rounded-xl bg-white dark:bg-slate-900 shadow-sm">
                      <img src={launcherIcon} alt="Uploaded Launcher" className="h-10 w-10 rounded-lg object-contain border border-slate-100" />
                      <button
                        type="button"
                        onClick={() => setLauncherIcon("")}
                        className="text-[9px] font-bold text-red-500 hover:text-red-650 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {launcherIconType === "svg" && (
              <textarea
                rows={3}
                value={launcherIcon.startsWith("<svg") ? launcherIcon : ""}
                onChange={(e) => setLauncherIcon(e.target.value)}
                placeholder="Paste raw SVG code here... e.g. <svg viewBox='0 0 24 24'>...</svg>"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 outline-none focus:border-indigo-500 transition-colors font-mono text-[10px]"
              />
            )}

            {launcherIconType === "preset" && (
              <div className="grid grid-cols-4 gap-3 pt-1">
                {PRESET_LAUNCHERS.map((item, idx) => {
                  const isActive = launcherIcon === item.svg;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setLauncherIcon(item.svg)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${isActive ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 shadow-sm" : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 hover:border-slate-350 dark:hover:border-slate-700 text-slate-500"}`}
                    >
                      <div className="text-slate-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: item.svg }} />
                      <span className="text-[9px] mt-1.5 font-medium">{item.name}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Background Transparency Toggle & Size Slider */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-850">
              {/* Transparency Toggle */}
              <div className="flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-700 dark:text-slate-350">Remove Background</span>
                  <p className="text-[10px] text-slate-400">Make the bubble container transparent</p>
                </div>
                <button
                  type="button"
                  onClick={() => setLauncherBgTransparent(!launcherBgTransparent)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${launcherBgTransparent ? "bg-indigo-650" : "bg-slate-200 dark:bg-slate-800"}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${launcherBgTransparent ? "translate-x-4" : "translate-x-0"}`}
                  />
                </button>
              </div>

              {/* Icon Size Slider */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700 dark:text-slate-350">Icon Size</span>
                  <span className="font-semibold text-indigo-650 dark:text-indigo-400 text-[10px] bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded">{launcherIconSize}px</span>
                </div>
                <input
                  type="range"
                  min="16"
                  max="60"
                  value={launcherIconSize}
                  onChange={(e) => setLauncherIconSize(parseInt(e.target.value))}
                  className="w-full accent-indigo-600 cursor-ew-resize mt-1.5"
                />
              </div>
            </div>
          </div>

          {/* Launcher Greeting Tooltip */}
          <div className="sm:col-span-2 space-y-2 p-3.5 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-700 dark:text-slate-350">Launcher Greeting Tooltip</span>
                <p className="text-[10px] text-slate-400">Display a small greeting bubble next to the icon</p>
              </div>
              <button
                type="button"
                onClick={() => setLauncherGreetingEnabled(!launcherGreetingEnabled)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${launcherGreetingEnabled ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-800"}`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${launcherGreetingEnabled ? "translate-x-4" : "translate-x-0"}`}
                />
              </button>
            </div>
            {launcherGreetingEnabled && (
              <input
                type="text"
                value={launcherGreeting}
                onChange={(e) => setLauncherGreeting(e.target.value)}
                placeholder="Hi! Need help? 👋"
                className="w-full mt-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 outline-none focus:border-indigo-500 transition-colors font-semibold"
              />
            )}
          </div>

          {/* Launcher Live Animation */}
          <div className="sm:col-span-2 space-y-1">
            <label className="font-semibold text-slate-500">Launcher Live Animation</label>
            <select
              value={launcherAnimation}
              onChange={(e) => setLauncherAnimation(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 outline-none focus:border-indigo-500 text-slate-650"
            >
              <option value="bounce">Bounce Up/Down</option>
              <option value="wiggle">Wiggle (Live Wobble)</option>
              <option value="pulse">Pulse Scaling</option>
              <option value="none">None (Static)</option>
            </select>
          </div>
        </div>

        {/* Welcome Message input block */}
        <div className="space-y-1 text-xs">
          <label className="font-semibold text-slate-500">Default Welcome Message</label>
          <textarea
            rows={3}
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors leading-relaxed"
          />
        </div>
      </div>

      {/* Live Mockup Column */}
      <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 border border-slate-200 dark:border-slate-850 rounded-2xl bg-slate-100/50 dark:bg-slate-950/20 min-h-[450px]">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-6">Interactive Real-time Preview</span>
        
        {/* Mock chat dialog frame */}
        <div
          className="w-full max-w-[280px] h-[360px] shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
          style={{ 
            borderRadius: `${borderRadius}px`, 
            fontFamily: getFontFamily(font),
            backgroundColor: widgetBgColor
          }}
        >
          {/* Header preview */}
          <div
            className="px-3.5 py-2.5 flex items-center justify-between transition-all duration-300"
            style={{ 
              backgroundColor: headerColor,
              color: headerTextColor
            }}
          >
            <div className="flex items-center gap-2">
              {avatarUrl ? (
                avatarUrl.trim().startsWith("<svg") ? (
                  <div 
                    className="h-8 w-8 rounded-full overflow-hidden flex items-center justify-center border border-white/20 bg-white/10 p-0.5 fill-current"
                    style={{ color: headerTextColor }}
                    dangerouslySetInnerHTML={{ __html: avatarUrl }}
                  />
                ) : (
                  <img src={avatarUrl} alt="Preview Avatar" className="h-8 w-8 rounded-full object-cover" />
                )
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                  <Bot className="h-4.5 w-4.5" />
                </div>
              )}
              <div>
                <h4 className="text-xs font-bold leading-tight">{botName}</h4>
                <span className="text-[9px] opacity-75 leading-none block">Online</span>
              </div>
            </div>
            <span className="text-xs opacity-60">✕</span>
          </div>

          {/* Messages body preview */}
          <div className="flex-1 p-3 space-y-2.5 overflow-y-auto">
            {/* Bot message bubble */}
            <div className="flex gap-2">
              <div className="h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] flex items-center justify-center font-bold text-slate-500 shrink-0 overflow-hidden">
                {avatarUrl ? (
                  avatarUrl.trim().startsWith("<svg") ? (
                    <div 
                      className="h-full w-full flex items-center justify-center p-0.5 text-slate-650 dark:text-slate-350 fill-current"
                      dangerouslySetInnerHTML={{ __html: avatarUrl }}
                    />
                  ) : (
                    <img src={avatarUrl} alt="Bot Avatar" className="h-full w-full object-cover" />
                  )
                ) : (
                  "B"
                )}
              </div>
              <div
                className="p-2.5 text-[11px] leading-relaxed shadow-sm max-w-[80%]"
                style={{ 
                  borderRadius: `${borderRadius}px ${borderRadius}px ${borderRadius}px 2px`,
                  backgroundColor: leftMessageBgColor,
                  color: leftMessageTextColor,
                  border: "1px solid rgba(0,0,0,0.05)"
                }}
              >
                {welcomeMessage}
              </div>
            </div>

            {/* Visitor mock response bubble */}
            <div className="flex justify-end">
              <div
                className="p-2.5 text-[11px] leading-relaxed shadow-sm max-w-[80%]"
                style={{
                  backgroundColor: rightMessageBgColor,
                  color: rightMessageTextColor,
                  borderRadius: `${borderRadius}px ${borderRadius}px 2px ${borderRadius}px`,
                }}
              >
                Hey Assistant! Let's get started.
              </div>
            </div>
          </div>

          {/* Footer preview */}
          <div className="border-t border-slate-100 dark:border-slate-800 px-2 py-2 flex items-center gap-1.5 bg-white dark:bg-slate-900">
            <span className="flex-1 rounded-full border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-[10px] text-slate-400">
              Write a message...
            </span>
            <span
              className="h-6 w-6 rounded-full flex items-center justify-center text-white cursor-pointer shrink-0"
              style={{ backgroundColor: widgetColor }}
            >
              ➔
            </span>
          </div>
        </div>

        {/* Floating bubble preview */}
        {(() => {
          const previewIconSize = `${Math.round(launcherIconSize * 0.73)}px`;
          return (
            <>
            <style>{`
              @keyframes mock-bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-6px); }
              }
              @keyframes mock-wiggle {
                0%, 100% { transform: rotate(0); }
                15% { transform: rotate(-8deg); }
                30% { transform: rotate(8deg); }
                45% { transform: rotate(-4deg); }
                60% { transform: rotate(4deg); }
                75% { transform: rotate(0); }
              }
              @keyframes mock-pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
              }
              .mock-animate-bounce {
                animation: mock-bounce 2s infinite ease-in-out;
              }
              .mock-animate-wiggle {
                animation: mock-wiggle 1.5s infinite ease-in-out;
              }
              .mock-animate-pulse {
                animation: mock-pulse 2s infinite ease-in-out;
              }
            `}</style>
            <div className="mt-6 flex items-center justify-end w-full max-w-[280px] px-1 relative">
              {launcherGreetingEnabled && launcherGreeting && (
                <div 
                  className="absolute bottom-[-22px] right-[-18px] pointer-events-none z-10"
                  style={{ width: "88px", height: "88px" }}
                >
                  <svg viewBox="0 0 88 88" style={{ width: "100%", height: "100%", overflow: "visible" }}>
                    <defs>
                      <path id="preview-text-path-curve" d="M 11 41 A 33 33 0 0 1 77 41" fill="none" />
                    </defs>
                    {/* Curved text */}
                    <text dy="2.5" style={{ fontFamily: "inherit", fontSize: "7px", fontWeight: 850, letterSpacing: "0.5px", fill: widgetColor, textShadow: "-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 0px 2px 4px rgba(0,0,0,0.15)" }}>
                      <textPath href="#preview-text-path-curve" startOffset="50%" textAnchor="middle">
                        {launcherGreeting.toUpperCase()}
                      </textPath>
                    </text>
                  </svg>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLauncherGreetingEnabled(false);
                    }}
                    className="absolute top-[24px] right-[9px] rounded-full bg-red-500 text-white border-none font-bold cursor-pointer flex items-center justify-center pointer-events-auto shadow-sm hover:bg-red-600 transition-colors"
                    style={{ fontSize: "5px", width: "10px", height: "10px", lineHeight: 1 }}
                  >
                    ✕
                  </button>
                </div>
              )}
              <div
                className={`relative flex items-center justify-center text-white cursor-pointer transition-transform hover:scale-105 ${launcherAnimation === "bounce" ? "mock-animate-bounce" : launcherAnimation === "wiggle" ? "mock-animate-wiggle" : launcherAnimation === "pulse" ? "mock-animate-pulse" : ""}`}
                style={{
                  height: "44px",
                  width: "44px",
                  backgroundColor: launcherBgTransparent ? "transparent" : widgetColor,
                  boxShadow: launcherBgTransparent ? "none" : "0 4px 12px rgba(0, 0, 0, 0.15)",
                  borderRadius: bubbleStyle === "round" ? "50%" : `${borderRadius}px`,
                }}
              >
                {/* Red notification badge */}
                <div 
                  className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white font-black flex items-center justify-center border border-white shadow-sm"
                  style={{ fontSize: "7px" }}
                >
                  1
                </div>
                {launcherIcon ? (
                  launcherIcon.trim().startsWith("<svg") ? (
                    <div 
                      className="flex items-center justify-center fill-current"
                      style={{
                        height: previewIconSize,
                        width: previewIconSize,
                        color: launcherBgTransparent ? widgetColor : "#ffffff"
                      }}
                      dangerouslySetInnerHTML={{ __html: launcherIcon }}
                    />
                  ) : (
                    <img 
                      src={launcherIcon} 
                      alt="Launcher Icon" 
                      style={{
                        height: previewIconSize,
                        width: previewIconSize,
                        objectFit: "contain"
                      }} 
                    />
                  )
                ) : (
                  <svg 
                    viewBox="0 0 24 24" 
                    className="fill-current"
                    style={{
                      height: previewIconSize,
                      width: previewIconSize,
                      color: launcherBgTransparent ? widgetColor : "#ffffff"
                    }}
                  >
                    <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" />
                  </svg>
                )}
              </div>
            </div>
            </>
          );
        })()}
      </div>
    </div>
    </>
  );
}
