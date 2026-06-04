"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Code, Globe, HelpCircle, Layers } from "lucide-react";

export default function EmbedTab({ botId }: { botId: string }) {
  const [copied, setCopied] = useState(false);
  const [activeInstructionTab, setActiveInstructionTab] = useState("html");
  const [serverUrl, setServerUrl] = useState("http://localhost:3000");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setServerUrl(window.location.origin);
    }
  }, []);

  const embedCode = `<script src="${serverUrl}/widget.js" data-bot-id="${botId}"></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const integrationTabs = [
    { id: "html", name: "HTML / PHP" },
    { id: "wordpress", name: "WordPress" },
    { id: "shopify", name: "Shopify" },
    { id: "react", name: "React" },
    { id: "nextjs", name: "Next.js" },
    { id: "laravel", name: "Laravel" },
  ];

  const getCodeSnippet = () => {
    switch (activeInstructionTab) {
      case "react":
        return `import { useEffect } from 'react';\n\nexport default function ChatWidget() {\n  useEffect(() => {\n    const script = document.createElement('script');\n    script.src = "${serverUrl}/widget.js";\n    script.setAttribute('data-bot-id', "${botId}");\n    script.async = true;\n    document.body.appendChild(script);\n\n    return () => {\n      document.body.removeChild(script);\n    };\n  }, []);\n\n  return null;\n}`;
      case "nextjs":
        return `import Script from 'next/script';\n\nexport default function Layout({ children }) {\n  return (\n    <html>\n      <body>\n        {children}\n        <Script \n          src="${serverUrl}/widget.js" \n          data-bot-id="${botId}" \n          strategy="afterInteractive" \n        />\n      </body>\n    </html>\n  );\n}`;
      case "wordpress":
        return `<!-- Method 1: Add to Theme Footer -->\n1. In your WordPress Admin, go to Appearance > Theme File Editor.\n2. Locate the "footer.php" file.\n3. Paste the script tag right before the closing </body> tag:\n\n${embedCode}\n\n<!-- Method 2: Use Insert Headers and Footers Plugin -->\n1. Install the "Header and Footer Scripts" plugin.\n2. Go to Settings > Header and Footer Scripts.\n3. Paste the code into the Footer section and click Save.`;
      case "shopify":
        return `1. From your Shopify Admin, go to Online Store > Themes.\n2. Click "..." (Actions) next to your theme, then select "Edit code".\n3. Under "Layout", click "theme.liquid".\n4. Scroll to the bottom of the file and find the closing </body> tag.\n5. Paste the script code right above that tag:\n\n${embedCode}\n\n6. Click Save in the upper right.`;
      case "laravel":
        return `{{-- Paste this in your primary blade layout (e.g., resources/views/layouts/app.blade.php) --}}\n{{-- Put it right before the closing </body> tag --}}\n\n${embedCode}`;
      case "html":
      default:
        return `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>Your Website</title>\n</head>\n<body>\n  <!-- Your page contents -->\n\n  <!-- ChetBot Widget script -->\n  ${embedCode}\n</body>\n</html>`;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Code copy block */}
      <div className="lg:col-span-2 space-y-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <Code className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-sm">Your Custom Script Tag</h3>
          </div>
          <p className="text-xs text-slate-500">
            Copy and paste this script tag into your website. Put it in the body section (preferably right before the closing <code>&lt;/body&gt;</code> tag).
          </p>

          {/* Copy Box */}
          <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 font-mono text-[11px] text-slate-700 dark:text-slate-350 select-all overflow-x-auto break-all">
            <code>{embedCode}</code>
            <button
              onClick={handleCopy}
              className="absolute right-3 top-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
              title="Copy to clipboard"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Integration Instructions */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
          <h3 className="font-bold text-sm">Platform Installation Guide</h3>
          
          {/* Tabs */}
          <div className="flex flex-wrap gap-1 border-b border-slate-100 dark:border-slate-850 pb-2">
            {integrationTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveInstructionTab(tab.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                  activeInstructionTab === tab.id
                    ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
                    : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850"
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>

          {/* Instruction code block */}
          <div className="relative rounded-xl bg-slate-900 p-4 font-mono text-[11px] text-slate-300 overflow-x-auto whitespace-pre leading-relaxed max-h-[300px] border border-slate-950">
            {getCodeSnippet()}
          </div>
        </div>
      </div>

      {/* Sidebar tips */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-indigo-650 text-indigo-650 text-indigo-600" />
            <h4 className="font-bold text-xs">Live Deployment Check</h4>
          </div>
          <ul className="text-xs text-slate-500 space-y-3 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0 mt-1.5" />
              <span>
                <strong>Lightweight:</strong> The widget script is only 5KB, loading asynchronously so your website remains blazing fast.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0 mt-1.5" />
              <span>
                <strong>Styling Isolated:</strong> Renders inside an iframe. No styles from your site will leak in and break the chatbot visual theme.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0 mt-1.5" />
              <span>
                <strong>Auto-Updates:</strong> Any edits you make to the Visual Flow or Widget Colors update in real-time. No need to re-copy code!
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
