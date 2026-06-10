"use client";

import React, { useContext } from "react";
import { Handle, Position, NodeResizer, useReactFlow } from "@xyflow/react";
import {
  Play, MessageSquare, List, Sparkles, User, Mail,
  Phone, Calendar, GitFork, Clock, HelpCircle, StopCircle,
  ShieldAlert, Link2, Pencil, Trash2, Link2Off
} from "lucide-react";
import { FlowContext } from "./FlowBuilderTab";

interface NodeData {
  label: string;
  type: string;
  text?: string;
  options?: string[];
  fields?: Array<{ label: string; type: string; variable?: string }>;
  variable?: string;
  url?: string;
  delay?: number;
  inputType?: string;
  rules?: any[];
  flowId?: string;
  department?: string;
  waitingMessage?: string;
}

export default function CustomNode({ id, data, selected, type: flowNodeType }: { id: string; data: NodeData; selected: boolean; type?: string }) {
  const type = data.type || flowNodeType || "message";
  const ctx = useContext(FlowContext);
  const { getEdges, setEdges } = useReactFlow();
  
  const isCompactNode = type === "start";
  const isCondensedNode = type === "button" || type === "quick_reply";
  const minNodeWidth = isCompactNode ? 170 : isCondensedNode ? 190 : 200;
  const minNodeHeight = isCompactNode ? 70 : 80;
  const minWidthClass = isCompactNode ? "min-w-[170px]" : isCondensedNode ? "min-w-[190px]" : "min-w-[200px]";
  const headerPaddingClass = isCompactNode || isCondensedNode ? "px-2.5 py-1.5" : "px-3 py-2";
  const headerIconClass = isCompactNode || isCondensedNode ? "h-3.5 w-3.5" : "h-4 w-4";
  const headerTextClass = isCompactNode || isCondensedNode ? "text-[10px]" : "text-[11px]";
  const bodyClass = isCompactNode || isCondensedNode ? "p-2.5 text-[9px]" : "p-3 text-[10px]";

  // Setup styles based on Node Type
  const nodeConfig = (() => {
    switch (type) {
      case "start":
        return {
          title: "Start Flow",
          icon: Play,
          headerBg: "bg-green-600 dark:bg-green-700",
          border: "border-green-600 dark:border-green-700",
        };
      case "end":
        return {
          title: "End Conversation",
          icon: StopCircle,
          headerBg: "bg-rose-600 dark:bg-rose-700",
          border: "border-rose-600 dark:border-rose-700",
        };
      case "message":
        return {
          title: "Bot Message",
          icon: MessageSquare,
          headerBg: "bg-indigo-600 dark:bg-indigo-700",
          border: "border-indigo-600 dark:border-indigo-700",
        };
      case "button":
        return {
          title: "Buttons",
          icon: List,
          headerBg: "bg-violet-600 dark:bg-violet-700",
          border: "border-violet-600 dark:border-violet-700",
        };
      case "list":
        return {
          title: "List",
          icon: List,
          headerBg: "bg-fuchsia-600 dark:bg-fuchsia-700",
          border: "border-fuchsia-600 dark:border-fuchsia-700",
        };
      case "question":
        return {
          title: "Question Input",
          icon: HelpCircle,
          headerBg: "bg-emerald-600 dark:bg-emerald-700",
          border: "border-emerald-600 dark:border-emerald-700",
        };
      case "condition":
        return {
          title: "Condition",
          icon: List,
          headerBg: "bg-rose-500 dark:bg-rose-600",
          border: "border-rose-500 dark:border-rose-600",
        };
      case "jump_to_flow":
        return {
          title: "Jump to Flow",
          icon: GitFork,
          headerBg: "bg-amber-600 dark:bg-amber-700",
          border: "border-amber-600 dark:border-amber-700",
        };
      case "live_agent":
        return {
          title: "Live Agent",
          icon: User,
          headerBg: "bg-emerald-600 dark:bg-emerald-700",
          border: "border-emerald-600 dark:border-emerald-700",
        };
      default:
        return {
          title: "General Node",
          icon: HelpCircle,
          headerBg: "bg-slate-500 dark:bg-slate-600",
          border: "border-slate-500 dark:border-slate-600",
        };
    }
  })();

  const Icon = nodeConfig.icon;

  // Determine handle placement
  const showTarget = type !== "start";
  // Button/Quick reply branches handles are rendered per-option below, so we block standard right handle
  const showStandardSource = type !== "end" && type !== "jump_to_flow" && type !== "button" && type !== "list" && type !== "condition" && type !== "live_agent";

  // Edit handler — opens the right-side config panel using the real node from the nodes array
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!ctx) return;
    ctx.openNodeById(id);
  };

  // Delete handler — removes node from canvas
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!ctx) return;
    ctx.deleteNode(id);
  };

  const handleDisconnect = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEdges(eds => eds.filter(edge => edge.source !== id && edge.target !== id));
  };

  // Helper to check if a specific handle is connected
  const edges = getEdges();
  const isTargetConnected = edges.some(e => e.target === id);
  const isSourceConnected = (handleId: string | null = null) => {
    return edges.some(e => e.source === id && (handleId === null ? !e.sourceHandle || e.sourceHandle === "success" : e.sourceHandle === handleId));
  };
  const isAnyConnected = edges.some(e => e.source === id || e.target === id);

  return (
    <div
      className={`group w-full ${minWidthClass} rounded-xl bg-white dark:bg-slate-900 border-2 shadow-md overflow-visible transition-shadow ${
        selected
          ? `${nodeConfig.border} shadow-lg ring-1 ring-indigo-500/20`
          : "border-slate-200 dark:border-slate-800"
      }`}
    >
      <NodeResizer
        minWidth={minNodeWidth}
        minHeight={minNodeHeight}
        isVisible={selected}
        lineClassName="border-indigo-500"
        handleClassName="h-2 w-2 bg-white border-2 border-indigo-500 rounded"
      />
      {/* Target input pin */}
      {showTarget && (
        <Handle
          type="target"
          position={Position.Left}
          className={`h-3 w-3 border-2 transition-colors ${isTargetConnected ? '!bg-green-500 !border-green-700' : '!bg-slate-400 dark:!bg-slate-600 !border-white dark:!border-slate-900'}`}
        />
      )}

      {/* Node Header Banner */}
      <div className={`${headerPaddingClass} text-white flex items-center gap-2 ${nodeConfig.headerBg} rounded-t-[10px] relative`}>
        <Icon className={`${headerIconClass} shrink-0`} />
        <span className={`${headerTextClass} font-bold tracking-wide truncate flex-1`}>{nodeConfig.title}</span>

        {/* Edit & Delete action buttons — always visible on hover or when selected */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" style={selected ? { opacity: 1 } : {}}>
          {/* Edit button */}
          <button
            onClick={handleEdit}
            title="Edit node"
            className="rounded p-1 hover:bg-white/20 transition-colors"
          >
            <Pencil className="h-3 w-3" />
          </button>

          {/* Disconnect button */}
          {isAnyConnected && (
            <button
              onClick={handleDisconnect}
              title="Disconnect all edges"
              className="rounded p-1 hover:bg-orange-500/40 transition-colors"
            >
              <Link2Off className="h-3 w-3" />
            </button>
          )}

          {/* Delete button (disabled for start-node) */}
          {id !== "start-node" && (
            <button
              onClick={handleDelete}
              title="Delete node"
              className="rounded p-1 hover:bg-red-500/40 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Node Body Details */}
      <div className={`${bodyClass} space-y-2 leading-relaxed`}>
        {type === "start" && <p className="text-slate-400 italic">Triggers on visitor initialization.</p>}
        {type === "end" && <p className="text-slate-400 italic">Conversation terminates here.</p>}

        {/* Message preview */}
        {["message", "button", "question", "live_agent"].includes(type) && (
          <p className="text-slate-700 dark:text-slate-300 font-medium break-words whitespace-pre-wrap mb-2">
            {typeof data.text === "string" ? data.text : <span className="text-slate-400 italic">"No text written..."</span>}
          </p>
        )}

        {/* Captured inputs info */}
        {type === "question" && (
          <div>
            <span className="text-slate-400 block font-semibold">Store input in:</span>
            <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[9.5px] font-mono text-indigo-600 dark:text-indigo-400">
              {data.variable || "input_value"}
            </code>
            <div className="text-slate-500 mt-1">
              Type: {data.inputType || "Text"}
            </div>
          </div>
        )}

        {/* Option-based branching handles */}
        {["button", "list"].includes(type) && (
          <div className="space-y-1 pt-1">
            {data.options?.map((opt, idx) => (
              <div
                key={idx}
                className="relative bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-800 rounded px-2 py-0.5 text-center font-bold text-[8.5px] text-slate-600 dark:text-slate-300"
              >
                {opt}
                {/* Each option gets its own source handle on the right */}
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`option-${idx}`}
                  style={{ top: "50%", transform: "translateY(-50%)" }}
                  className={`h-2.5 w-2.5 border-2 transition-colors ${isSourceConnected(`option-${idx}`) ? '!bg-green-500 !border-green-700' : '!bg-indigo-500 !border-white dark:!border-slate-900'}`}
                />
              </div>
            ))}
            <div className="relative bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-0.5 text-center font-bold text-[8.5px] text-slate-500 dark:text-slate-400 mt-2">
              Default
              <Handle
                type="source"
                position={Position.Right}
                id="default"
                style={{ top: "50%", transform: "translateY(-50%)" }}
                className={`h-2.5 w-2.5 border-2 transition-colors ${isSourceConnected("default") ? '!bg-green-500 !border-green-700' : '!bg-slate-400 !border-white dark:!border-slate-900'}`}
              />
            </div>
          </div>
        )}

        {/* Condition rules branching handles */}
        {type === "condition" && (
          <div className="space-y-1 pt-1">
            {data.rules?.map((rule: any, idx: number) => (
              <div
                key={idx}
                className="relative bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/40 rounded px-2 py-0.5 text-center font-bold text-[8.5px] text-rose-600 dark:text-rose-300"
              >
                {rule.label || `Rule ${idx + 1}`}
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`rule-${idx}`}
                  style={{ top: "50%", transform: "translateY(-50%)" }}
                  className={`h-2.5 w-2.5 border-2 transition-colors ${isSourceConnected(`rule-${idx}`) ? '!bg-green-500 !border-green-700' : '!bg-rose-500 !border-white dark:!border-slate-900'}`}
                />
              </div>
            ))}
            <div className="relative bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-0.5 text-center font-bold text-[8.5px] text-slate-500 dark:text-slate-400 mt-2">
              Default
              <Handle
                type="source"
                position={Position.Right}
                id="default"
                style={{ top: "50%", transform: "translateY(-50%)" }}
                className={`h-2.5 w-2.5 border-2 transition-colors ${isSourceConnected("default") ? '!bg-green-500 !border-green-700' : '!bg-slate-400 !border-white dark:!border-slate-900'}`}
              />
            </div>
          </div>
        )}

        {type === "jump_to_flow" && (
          <div>
            <span className="text-slate-400 block font-semibold">Redirects to Flow:</span>
            {(() => {
              const targetFlow = ctx?.flows?.find((f: any) => f.id === data.flowId);
              return (
                <div className="mt-1 font-bold text-slate-800 dark:text-slate-200 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded px-2 py-1 flex items-center gap-1.5">
                  <GitFork className="h-3 w-3 text-amber-600 shrink-0" />
                  <span className="truncate">{targetFlow?.name || "None Selected"}</span>
                </div>
              );
            })()}
          </div>
        )}

        {type === "live_agent" && (
          <div>
            <span className="text-slate-400 block font-semibold">Department:</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded px-2 py-0.5 mt-1 inline-block">
              {data.department || "General Support"}
            </span>
          </div>
        )}
      </div>

      {/* Standard source output pin */}
      {showStandardSource && (
        <>
          <Handle
            type="source"
            position={Position.Right}
            className={`h-3 w-3 border-2 transition-colors ${isSourceConnected(null) ? '!bg-green-500 !border-green-700' : '!bg-slate-400 dark:!bg-slate-600 !border-white dark:!border-slate-900'}`}
          />
          {type === "question" && (
            <div className="absolute right-0 top-[85%] -translate-y-1/2 translate-x-1/2 flex items-center">
              <span className="text-[7px] font-bold text-red-500 mr-1 uppercase bg-white dark:bg-slate-900 px-1 rounded shadow-sm border border-red-200 dark:border-red-900">Fail</span>
              <Handle
                type="source"
                position={Position.Right}
                id="validation_failed"
                className={`h-2 w-2 border-2 relative transform-none top-0 transition-colors ${isSourceConnected('validation_failed') ? '!bg-green-500 !border-green-700' : '!bg-red-500 !border-white dark:!border-slate-900'}`}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Inline replacement for Lucide icon
function ClipboardListIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  );
}
