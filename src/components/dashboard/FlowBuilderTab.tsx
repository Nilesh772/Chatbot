"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Panel,
  ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import CustomNodeComponent from "./CustomNode";
import VariableTextarea from "./VariableTextarea";
import VariableSelect from "./VariableSelect";
import { Save, Trash2, PlusCircle, HelpCircle, ChevronLeft, ChevronRight, X, GitFork, Pencil, ExternalLink } from "lucide-react";

// Define strict types for node data to resolve TypeScript errors
export interface FormField {
  label: string;
  type: string;
  variable: string;
}

export interface ConditionRule {
  variable: string;
  operator: string;
  value: string;
  label: string;
}

export interface FlowNodeData extends Record<string, unknown> {
  label: string;
  type: string;
  text?: string;
  options?: string[];
  variable?: string;
  inputType?: string;
  rules?: ConditionRule[];
}

// Context for custom nodes to interact with builder state
export const FlowContext = React.createContext<{
  nodes: Node[];
  selectedNode: Node | null;
  setSelectedNode: React.Dispatch<React.SetStateAction<Node | null>>;
  openNodeById: (id: string) => void;
  handleTextChange: (e: React.ChangeEvent<HTMLTextAreaElement> | string) => void;
  handleVariableChange: (e: React.ChangeEvent<HTMLInputElement> | string) => void;
  handleInputTypeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  addOption: () => void;
  removeOption: (idx: number) => void;
  handleOptionTextChange: (idx: number, val: string) => void;
  addRule: () => void;
  removeRule: (idx: number) => void;
  updateRule: (idx: number, field: keyof ConditionRule, val: string) => void;
  deleteNode: (id: string) => void;
  flows?: any[];
  currentFlowId?: string;
  updateNodeData?: (nodeId: string, updatedFields: Partial<FlowNodeData>) => void;
} | null>(null);

const nodeTypes = {
  customNode: CustomNodeComponent,
  start: CustomNodeComponent,
  message: CustomNodeComponent,
  button: CustomNodeComponent,
  list: CustomNodeComponent,
  question: CustomNodeComponent,
  condition: CustomNodeComponent,
  jump_to_flow: CustomNodeComponent,
  redirect: CustomNodeComponent,
  end: CustomNodeComponent,
  live_agent: CustomNodeComponent,
};

interface FlowBuilderTabProps {
  botId: string;
}

export default function FlowBuilderTab({ botId }: FlowBuilderTabProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [pendingFitView, setPendingFitView] = useState(false);
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance | null>(null);

  // Flows Management States
  const [flows, setFlows] = useState<any[]>([]);
  const [currentFlowId, setCurrentFlowId] = useState<string>("");

  // Departments State
  const [departments, setDepartments] = useState<any[]>([]);

  const loadFlows = useCallback(async (selectFlowId?: string) => {
    try {
      const res = await fetch(`/api/bots/${botId}/flows`);
      const data = await res.json();
      if (data.flows && data.flows.length > 0) {
        setFlows(data.flows);
        const main = data.flows.find((f: any) => f.isMain) || data.flows[0];
        const targetId = selectFlowId || main.id;
        setCurrentFlowId(targetId);

        const activeFlow = data.flows.find((f: any) => f.id === targetId) || main;
        setNodes(activeFlow.nodes || []);
        setEdges(activeFlow.edges || []);
        setPendingFitView(true);
      }
    } catch (e) {
      console.error("Failed to load flows:", e);
    }
  }, [botId, setNodes, setEdges]);

  const loadDepartments = useCallback(async () => {
    try {
      const res = await fetch("/api/departments");
      const data = await res.json();
      if (data.success && data.departments) {
        setDepartments(data.departments);
      }
    } catch (e) {
      console.error("Failed to load departments:", e);
    }
  }, []);

  // Load flow configurations on mount
  useEffect(() => {
    loadFlows();
    loadDepartments();
  }, [loadFlows, loadDepartments]);

  // Handle new canvas connections
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Sync selected node updates back to React Flow nodes state array
  const updateNodeData = (nodeId: string, updatedFields: Partial<FlowNodeData>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              ...updatedFields,
            },
          };
        }
        return node;
      })
    );

    // Sync selectedNode local view state
    setSelectedNode((prev) => {
      if (prev && prev.id === nodeId) {
        return {
          ...prev,
          data: {
            ...prev.data,
            ...updatedFields,
          },
        };
      }
      return prev;
    });
  };

  // Node editing handlers
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement> | string) => {
    if (!selectedNode) return;
    const value = typeof e === "string" ? e : e.target.value;
    updateNodeData(selectedNode.id, { text: value });
  };

  const handleVariableChange = (e: React.ChangeEvent<HTMLInputElement> | string) => {
    if (!selectedNode) return;
    const value = typeof e === "string" ? e : e.target.value;
    updateNodeData(selectedNode.id, { variable: value });
  };

  const handleInputTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!selectedNode) return;
    updateNodeData(selectedNode.id, { inputType: e.target.value });
  };

  // Options manager (Buttons / Quick replies)
  const addOption = () => {
    if (!selectedNode) return;
    const currentOptions = (selectedNode.data.options as string[]) || [];
    updateNodeData(selectedNode.id, {
      options: [...currentOptions, `Option ${currentOptions.length + 1}`],
    });
  };

  const removeOption = (idx: number) => {
    if (!selectedNode) return;
    const currentOptions = (selectedNode.data.options as string[]) || [];
    const updated = currentOptions.filter((_, i) => i !== idx);
    updateNodeData(selectedNode.id, { options: updated });

    // Clean up any edges starting from this specific option index handle
    setEdges((eds) =>
      eds.filter((edge) => !(edge.source === selectedNode.id && edge.sourceHandle === `option-${idx}`))
    );
  };

  const handleOptionTextChange = (idx: number, val: string) => {
    if (!selectedNode) return;
    const currentOptions = (selectedNode.data.options as string[]) || [];
    const updated = [...currentOptions];
    updated[idx] = val;
    updateNodeData(selectedNode.id, { options: updated });
  };

  // Condition Rules manager
  const addRule = () => {
    if (!selectedNode) return;
    const currentRules = (selectedNode.data.rules as ConditionRule[]) || [];
    updateNodeData(selectedNode.id, {
      rules: [
        ...currentRules,
        { variable: "", operator: "Equals", value: "", label: `Rule ${currentRules.length + 1}` },
      ],
    });
  };

  const removeRule = (idx: number) => {
    if (!selectedNode) return;
    const currentRules = (selectedNode.data.rules as ConditionRule[]) || [];
    const updated = currentRules.filter((_, i) => i !== idx);
    updateNodeData(selectedNode.id, { rules: updated });

    // Clean up edges
    setEdges((eds) =>
      eds.filter((edge) => !(edge.source === selectedNode.id && edge.sourceHandle === `rule-${idx}`))
    );
  };

  const updateRule = (idx: number, field: keyof ConditionRule, val: string) => {
    if (!selectedNode) return;
    const currentRules = (selectedNode.data.rules as ConditionRule[]) || [];
    const updated = [...currentRules];
    updated[idx] = { ...updated[idx], [field]: val };
    updateNodeData(selectedNode.id, { rules: updated });
  };

  const getNextNodePosition = () => {
    const anchorNode = selectedNode || nodes[nodes.length - 1];
    if (!anchorNode) {
      return { x: 200 + Math.random() * 80, y: 150 + Math.random() * 80 };
    }

    const baseX = anchorNode.position?.x ?? 200;
    const baseY = anchorNode.position?.y ?? 150;
    return { x: baseX + 300, y: baseY + (Math.random() * 50 - 25) }; // Slightly staggered to prevent perfect overlap
  };

  // Add a new node block to canvas
  const addNewNode = (nodeType: string) => {
    const id = `node_${Math.random().toString(36).substring(2, 9)}`;
    const nextPosition = getNextNodePosition();
    const newNode: Node = {
      id,
      type: "customNode",
      position: nextPosition,
      data: {
        label: nodeType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        type: nodeType,
        text: ["message", "button", "question"].includes(nodeType)
          ? "Enter your text here"
          : nodeType === "live_agent"
          ? "Connecting you with a support representative. Please stand by..."
          : undefined,
        options: ["button", "list"].includes(nodeType) ? ["Option 1", "Option 2"] : undefined,
        variable: ["button", "list", "question"].includes(nodeType)
          ? `${nodeType}_output`
          : undefined,
        inputType: nodeType === "question" ? "Text" : undefined,
        rules: nodeType === "condition" ? [{ variable: "", operator: "Equals", value: "", label: "Rule 1" }] : undefined,
        flowId: nodeType === "jump_to_flow" ? "" : undefined,
        department: nodeType === "live_agent" ? (departments[0]?.name || "General Support") : undefined,
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setSelectedNode(newNode);

    // Fit view to include new node after state updates
    setTimeout(() => setPendingFitView(true), 50);
  };

  // Delete node from canvas (by selected)
  const deleteSelectedNode = () => {
    if (!selectedNode) return;
    deleteNode(selectedNode.id);
    setIsConfigOpen(false);
    setSelectedNode(null);
  };

  // Delete node from canvas by id (used by CustomNode edit toolbar)
  const deleteNode = (id: string) => {
    if (id === "start-node") {
      alert("The Start Node is required and cannot be deleted.");
      return;
    }
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    setSelectedNode((prev) => (prev?.id === id ? null : prev));
    setIsConfigOpen((prev) => (selectedNode?.id === id ? false : prev));
  };

  // Save flow diagram array to API
  const handleSaveFlow = async () => {
    if (!currentFlowId) return;
    setSaving(true);
    setSaveStatus("idle");
    try {
      const res = await fetch(`/api/bots/${botId}/flows/${currentFlowId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, edges }),
      });

      if (res.ok) {
        setSaveStatus("success");
        setFlows((prev) => prev.map((f) => (f.id === currentFlowId ? { ...f, nodes, edges } : f)));
      } else {
        setSaveStatus("error");
      }
    } catch (e) {
      console.error(e);
      setSaveStatus("error");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const handleSwitchFlow = async (flowId: string) => {
    if (currentFlowId === flowId) return;
    
    // Auto-save currently active flow before switching
    if (currentFlowId) {
      await fetch(`/api/bots/${botId}/flows/${currentFlowId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, edges }),
      });
      // Update local cache
      setFlows((prev) => prev.map((f) => (f.id === currentFlowId ? { ...f, nodes, edges } : f)));
    }

    const targetFlow = flows.find((f) => f.id === flowId);
    if (targetFlow) {
      setCurrentFlowId(flowId);
      setNodes(targetFlow.nodes || []);
      setEdges(targetFlow.edges || []);
      setSelectedNode(null);
      setIsConfigOpen(false);
      setPendingFitView(true);
    }
  };

  const handleCreateFlow = async (name: string) => {
    try {
      const res = await fetch(`/api/bots/${botId}/flows`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (data.success) {
        await loadFlows(data.flow.id);
      }
    } catch (e) {
      console.error("Failed to create flow:", e);
    }
  };

  const handleRenameFlow = async (flowId: string, newName: string) => {
    try {
      const res = await fetch(`/api/bots/${botId}/flows/${flowId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (res.ok) {
        setFlows((prev) => prev.map((f) => (f.id === flowId ? { ...f, name: newName } : f)));
      }
    } catch (e) {
      console.error("Failed to rename flow:", e);
    }
  };

  const handleSetMainFlow = async (flowId: string) => {
    try {
      const res = await fetch(`/api/bots/${botId}/flows/${flowId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isMain: true }),
      });
      if (res.ok) {
        setFlows((prev) => prev.map((f) => (f.id === flowId ? { ...f, isMain: true } : { ...f, isMain: false })));
      }
    } catch (e) {
      console.error("Failed to set main flow:", e);
    }
  };

  const handleDeleteFlow = async (flowId: string) => {
    if (flows.length <= 1) {
      alert("A chatbot must have at least one flow.");
      return;
    }
    const flowToDelete = flows.find((f) => f.id === flowId);
    if (flowToDelete?.isMain) {
      alert("You cannot delete the Main Router flow. Please set another flow as Main first.");
      return;
    }
    if (!confirm(`Are you sure you want to delete the flow "${flowToDelete?.name}"?`)) return;

    try {
      const res = await fetch(`/api/bots/${botId}/flows/${flowId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const remainingFlows = flows.filter((f) => f.id !== flowId);
        setFlows(remainingFlows);
        if (currentFlowId === flowId) {
          const nextFlow = remainingFlows.find((f) => f.isMain) || remainingFlows[0];
          setCurrentFlowId(nextFlow.id);
          setNodes(nextFlow.nodes || []);
          setEdges(nextFlow.edges || []);
          setPendingFitView(true);
        }
      }
    } catch (e) {
      console.error("Failed to delete flow:", e);
    }
  };

  // Open config panel for a node by its id (used by CustomNode edit button)
  const openNodeById = (id: string) => {
    const node = nodes.find((n) => n.id === id);
    if (node) {
      setSelectedNode(node);
      setIsConfigOpen(true);
    }
  };

  const closeConfig = () => {
    setIsConfigOpen(false);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!pendingFitView || !flowInstance) return;

    // minZoom અને maxZoom 1 રાખવાથી નોડ્સ સેન્ટરમાં આવશે પણ સાઈઝ નાની નહિ થાય
    flowInstance.fitView({
      padding: 0.1,
      minZoom: 1,
      maxZoom: 1,
      duration: 400
    });

    setPendingFitView(false);
  }, [pendingFitView, flowInstance]);
  const contextValue = {
    nodes,
    selectedNode,
    setSelectedNode,
    openNodeById,
    handleTextChange,
    handleVariableChange,
    handleInputTypeChange,
    addOption,
    removeOption,
    handleOptionTextChange,
    addRule,
    removeRule,
    updateRule,
    deleteNode,
    flows,
    currentFlowId,
    updateNodeData,
  };

  // Compute all existing variables to populate the dropdown suggestions
  const availableVariables = Array.from(new Set([
    "last_input",
    ...nodes.map(n => n.data.variable as string).filter(Boolean)
  ])).sort();

  const selectedNodeType = selectedNode
    ? ((selectedNode.data as any)?.type || selectedNode.type || "message")
    : "message";

  return (
    <FlowContext.Provider value={contextValue}>
      <div className="h-[calc(100vh-140px)] flex border border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50 dark:bg-slate-950 overflow-hidden shadow-sm font-sans">

        {/* Sidebar - Node Catalog */}
        {isSidebarOpen && (
          <div className="w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between transition-all duration-300">
            <div className="p-5 space-y-5 overflow-y-auto">
              <div className="flex items-center justify-between text-slate-800 dark:text-slate-200">
                <div className="flex items-center gap-2">
                  <PlusCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-bold uppercase tracking-wide">Elements</span>
                </div>
                <button
                  onClick={toggleSidebar}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Hide sidebar"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2">
                <CatalogButton onClick={() => addNewNode("message")} color="bg-indigo-500" label="Message" />
                <CatalogButton onClick={() => addNewNode("button")} color="bg-violet-500" label="Buttons" />
                <CatalogButton onClick={() => addNewNode("list")} color="bg-fuchsia-500" label="List Node" />
                <CatalogButton onClick={() => addNewNode("question")} color="bg-emerald-500" label="Question" />
                <CatalogButton onClick={() => addNewNode("condition")} color="bg-rose-500" label="Condition" />
                <CatalogButton onClick={() => addNewNode("jump_to_flow")} color="bg-amber-500" label="Jump to Flow" />
                <CatalogButton onClick={() => addNewNode("redirect")} color="bg-slate-700" label="Redirect URL" />
                <CatalogButton onClick={() => addNewNode("live_agent")} color="bg-emerald-600" label="Live Agent" />
                <CatalogButton onClick={() => addNewNode("end")} color="bg-red-600" label="End Node" />
              </div>
            </div>

            {/* Catalog Help footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-start gap-3 text-xs text-slate-500 bg-slate-50/50 dark:bg-slate-900/50">
              <HelpCircle className="h-4 w-4 shrink-0 mt-0.5 text-slate-400" />
              <span className="leading-relaxed">Drag lines from output pins to link dialogue logic together.</span>
            </div>
          </div>
        )}

        {/* Editor Canvas (React Flow viewport) */}
        <div className="flex-1 h-full relative flex flex-col">
          {/* Sub-flows Management Bar */}
          <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-5 py-3 flex items-center justify-between shadow-sm shrink-0">
            <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-[75%] no-scrollbar">
              {flows.map((f: any) => {
                const isCurrent = f.id === currentFlowId;
                return (
                  <div key={f.id} className="flex items-center gap-1.5 shrink-0 bg-slate-50 dark:bg-slate-850 p-1 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <button
                      onClick={() => handleSwitchFlow(f.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isCurrent
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/10"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <GitFork className="h-3 w-3 shrink-0" />
                      <span>{f.name}</span>
                      {f.isMain && (
                        <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded ${isCurrent ? 'bg-white/20 text-white' : 'bg-indigo-150 text-indigo-700 dark:bg-indigo-900/35 dark:text-indigo-400'}`}>
                          Main
                        </span>
                      )}
                    </button>

                    {/* Flow Quick Options Dropdown or inline buttons on hover/active */}
                    {isCurrent && (
                      <div className="flex items-center gap-0.5 border-l border-slate-200 dark:border-slate-700 pl-1.5 pr-0.5">
                        {/* Rename */}
                        <button
                          onClick={() => {
                            const newName = prompt("Rename Flow:", f.name);
                            if (newName && newName.trim()) {
                              handleRenameFlow(f.id, newName.trim());
                            }
                          }}
                          className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-350 hover:bg-slate-150 dark:hover:bg-slate-800 transition-colors"
                          title="Rename flow"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        
                        {/* Set Main */}
                        {!f.isMain && (
                          <button
                            onClick={() => handleSetMainFlow(f.id)}
                            className="px-1.5 py-0.5 rounded text-[9.5px] font-bold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-colors"
                            title="Set as Bot entry point flow"
                          >
                            Set Main
                          </button>
                        )}

                        {/* Delete */}
                        {!f.isMain && flows.length > 1 && (
                          <button
                            onClick={() => handleDeleteFlow(f.id)}
                            className="p-1 rounded text-slate-550 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/25 transition-colors"
                            title="Delete flow"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Create new flow button */}
            <button
              onClick={() => {
                const name = prompt("Enter new flow name:");
                if (name && name.trim()) {
                  handleCreateFlow(name.trim());
                }
              }}
              className="flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold px-3 py-1.5 text-xs shadow-sm transition-all border border-slate-200 dark:border-slate-700"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Create Flow</span>
            </button>
          </div>

          <div className="flex-1 relative">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              onNodeClick={(_, node) => setSelectedNode(node)}
              onPaneClick={() => setSelectedNode(null)}
              // fitView  <-- આ લાઈન કાઢી નાખો
              defaultViewport={{ x: 50, y: 50, zoom: 1 }} // <-- આ નવી લાઈન એડ કરો
              onInit={setFlowInstance}
              minZoom={0.2}
              maxZoom={1.5}
            >
              <Background color="#94a3b8" gap={20} size={1.5} />
              <MiniMap
                nodeStrokeWidth={3}
                zoomable
                pannable
                className="border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm"
                style={{ bottom: 16, right: 16, left: "auto", top: "auto" }}
              />
              <Controls
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm"
                style={{ top: 80, right: 16, left: "auto", bottom: "auto" }}
              />

              <Panel position="top-left" className="m-4">
                {!isSidebarOpen && (
                  <button
                    onClick={toggleSidebar}
                    className="flex items-center gap-2 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
                  >
                    <ChevronRight className="h-4 w-4" />
                    Show Nodes
                  </button>
                )}
              </Panel>

              {/* Action trigger Panel in canvas header */}
              <Panel position="top-right" className="m-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 flex items-center gap-3 shadow-sm">
                {saveStatus === "success" && (
                  <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-3 py-1.5 rounded-lg animate-pulse">
                    Saved Successfully
                  </span>
                )}
                {saveStatus === "error" && (
                  <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-3 py-1.5 rounded-lg">
                    Save Error
                  </span>
                )}
                <button
                  onClick={handleSaveFlow}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save Flow"}
                </button>
              </Panel>
            </ReactFlow>
          </div>
        </div>

        {/* Modal Node Config (opened by edit button) */}
        {isConfigOpen && selectedNode && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 transition-opacity"
            onClick={closeConfig}
          >
            <div
              className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transform transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Configure Node</h3>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest block mt-1 font-medium">
                    Type: {selectedNodeType}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={deleteSelectedNode}
                    disabled={selectedNode.id === "start-node"}
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 disabled:opacity-20 transition-all"
                    title="Delete block"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={closeConfig}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-all"
                    title="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Form Content body based on Node Type */}
              <div className="flex-1 p-6 space-y-5 overflow-y-auto text-sm">

                {/* Start / End elements instructions */}
                {selectedNodeType === "start" && (
                  <div className="space-y-4">
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 p-4 rounded-xl text-xs leading-relaxed">
                      This is the visual gateway when the visitor clicks open the widget bubble. Connect this output handle to your first welcome message card.
                    </div>
                    
                    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Start Automatically</label>
                          <span className="text-[10px] text-slate-400">Trigger bot as soon as the visitor opens the widget chat</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedNode.data.startAutomatically !== false}
                          onChange={(e) => updateNodeData(selectedNode.id, { startAutomatically: e.target.checked })}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </div>

                      {selectedNode.data.startAutomatically === false && (
                        <div className="space-y-1.5 animate-fadeIn">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Trigger Keywords</label>
                          <input
                            type="text"
                            placeholder="e.g. hi, hello, hy, hey"
                            value={(selectedNode.data.triggerKeywords as string) || ""}
                            onChange={(e) => updateNodeData(selectedNode.id, { triggerKeywords: e.target.value })}
                            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm text-slate-700 dark:text-slate-300 h-[46px]"
                          />
                          <span className="text-[10px] text-slate-400 block leading-normal">
                            Comma-separated keywords. The bot will only start when the visitor types one of these keywords first. If left empty, any message will trigger the bot.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {selectedNodeType === "end" && (
                  <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 p-4 rounded-xl text-xs leading-relaxed">
                    No styling inputs required. The chatbot will hold dialogue responses and wait for a user action to close here.
                  </div>
                )}

                {/* Live Agent Node details */}
                {selectedNodeType === "live_agent" && (
                  <div className="space-y-5">
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 p-4 rounded-xl text-xs leading-relaxed border border-emerald-250 dark:border-emerald-900/50">
                      <strong>Human Agent Handover:</strong> When the conversation reaches this node, the chatbot automation will stop, and the conversation status will change to <b>Waiting for Agent</b>. A real representative can then accept and reply to this conversation.
                    </div>

                    <VariableTextarea
                      label="Message to Visitor (Waiting message)"
                      value={(selectedNode.data.text as string) || ""}
                      onChange={handleTextChange}
                      variables={availableVariables}
                      placeholder="Connecting you with a support representative. Please stand by..."
                    />

                    <div className="space-y-2">
                      <label className="font-semibold text-slate-700 dark:text-slate-300 text-xs block">Assigned Department</label>
                      <div className="flex gap-2">
                        <select
                          value={(selectedNode.data.department as string) || (departments[0]?.name || "General Support")}
                          onChange={(e) => updateNodeData(selectedNode.id, { department: e.target.value })}
                          className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer text-sm"
                        >
                          {departments.length > 0 ? (
                            departments.map((dept: any) => (
                              <option key={dept.id || dept.name} value={dept.name}>
                                {dept.name}
                              </option>
                            ))
                          ) : (
                            <>
                              <option value="General Support">General Support</option>
                              <option value="Sales">Sales</option>
                              <option value="Billing">Billing</option>
                              <option value="Technical Support">Technical Support</option>
                            </>
                          )}
                          {!!selectedNode.data.department && 
                            !(departments.length > 0 
                              ? departments.some((d: any) => d.name === selectedNode.data.department)
                              : ["General Support", "Sales", "Billing", "Technical Support"].includes(selectedNode.data.department as string)
                            ) && (
                              <option value={selectedNode.data.department as string}>
                                {selectedNode.data.department as string}
                              </option>
                            )}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="font-semibold text-slate-700 dark:text-slate-300 text-xs block">Or Enter Custom Department</label>
                      <input
                        type="text"
                        placeholder="e.g. Enterprise Sales"
                        value={(selectedNode.data.department as string) || ""}
                        onChange={(e) => updateNodeData(selectedNode.id, { department: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 outline-none focus:border-indigo-500 transition-all text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Message node details */}
                {selectedNodeType === "message" && (
                  <VariableTextarea
                    label="Bot Message Bubble"
                    value={(selectedNode.data.text as string) || ""}
                    onChange={handleTextChange}
                    variables={availableVariables}
                    placeholder="Welcome! Ready to capture leads?"
                  />
                )}

                {/* Button Node details */}
                {selectedNodeType === "button" && (
                  <div className="space-y-5">
                    <VariableTextarea
                      label="Question"
                      value={(selectedNode.data.text as string) || ""}
                      onChange={handleTextChange}
                      variables={availableVariables}
                      placeholder="Select an option:"
                    />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                        <label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                          Buttons ({(selectedNode.data.options as string[])?.length || 0})
                        </label>
                        <button
                          onClick={addOption}
                          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 transition-colors flex items-center gap-1"
                        >
                          <PlusCircle className="h-3.5 w-3.5" /> Add Button
                        </button>
                      </div>

                      <div className="space-y-2">
                        {(selectedNode.data.options as string[])?.map((opt: string, idx: number) => (
                          <div key={idx} className="flex gap-2 items-center group">
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                              className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 outline-none focus:border-indigo-500 transition-all text-sm font-medium"
                            />
                            <button
                              onClick={() => removeOption(idx)}
                              className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-50 group-hover:opacity-100"
                              title="Remove Option"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">Save To Variable</label>
                      <VariableSelect
                        value={(selectedNode.data.variable as string) || ""}
                        onChange={handleVariableChange}
                        variables={availableVariables}
                        placeholder="e.g. selected_plan"
                      />
                    </div>
                  </div>
                )}

                {/* List Node details */}
                {selectedNodeType === "list" && (
                  <div className="space-y-5">
                    <VariableTextarea
                      label="Question"
                      value={(selectedNode.data.text as string) || ""}
                      onChange={handleTextChange}
                      variables={availableVariables}
                      placeholder="Select an option from the list:"
                    />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                        <label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                          List Options ({(selectedNode.data.options as string[])?.length || 0})
                        </label>
                        <button
                          onClick={addOption}
                          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 transition-colors flex items-center gap-1"
                        >
                          <PlusCircle className="h-3.5 w-3.5" /> Add Option
                        </button>
                      </div>

                      <div className="space-y-2">
                        {(selectedNode.data.options as string[])?.map((opt: string, idx: number) => (
                          <div key={idx} className="flex gap-2 items-center group">
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                              className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 outline-none focus:border-indigo-500 transition-all text-sm font-medium"
                            />
                            <button
                              onClick={() => removeOption(idx)}
                              className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-50 group-hover:opacity-100"
                              title="Remove Option"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">Save To Variable</label>
                      <VariableSelect
                        value={(selectedNode.data.variable as string) || ""}
                        onChange={handleVariableChange}
                        variables={availableVariables}
                        placeholder="e.g. selected_city"
                      />
                    </div>
                  </div>
                )}

                {/* Question Node details */}
                {selectedNodeType === "question" && (
                  <div className="space-y-5">
                    <VariableTextarea
                      label="Question Text"
                      value={(selectedNode.data.text as string) || ""}
                      onChange={handleTextChange}
                      variables={availableVariables}
                      placeholder="What is your phone number?"
                    />

                    <div className="space-y-2">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">Input Type</label>
                      <select
                        value={(selectedNode.data.inputType as string) || "Text"}
                        onChange={handleInputTypeChange}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
                      >
                        <option value="Text">Text</option>
                        <option value="Number">Number</option>
                        <option value="Email">Email</option>
                        <option value="Phone">Phone</option>
                        <option value="Date">Date</option>
                        <option value="URL">URL</option>
                        <option value="Textarea">Textarea</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">Save To Variable</label>
                      <VariableSelect
                        value={(selectedNode.data.variable as string) || ""}
                        onChange={handleVariableChange}
                        variables={availableVariables}
                        placeholder="e.g. customer_phone"
                      />
                    </div>
                  </div>
                )}

                {/* Condition Node details */}
                {selectedNodeType === "condition" && (
                  <div className="space-y-5">
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                      <h4 className="text-xs font-bold text-indigo-800 dark:text-indigo-300 mb-1 flex items-center gap-1.5"><HelpCircle className="w-3.5 h-3.5" /> How to use?</h4>
                      <p className="text-[11px] text-indigo-600/80 dark:text-indigo-400/80 leading-relaxed">
                        Route users based on saved variables.<br/>
                        1. Type the exact <b>Variable</b> name (e.g., <code className="bg-white/50 dark:bg-black/20 px-1 py-0.5 rounded">selected_plan</code>)<br/>
                        2. Select an <b>Operator</b> and type the <b>Value</b>. <br/>
                        <span className="text-indigo-700 font-semibold dark:text-indigo-300">Tip:</span> Use comma-separated values (e.g. <code className="bg-white/50 dark:bg-black/20 px-1 py-0.5 rounded">apple, hi</code>) to match ANY of the words!
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                        <label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                          Rules ({(selectedNode.data.rules as ConditionRule[])?.length || 0})
                        </label>
                        <button
                          onClick={addRule}
                          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 transition-colors flex items-center gap-1"
                        >
                          <PlusCircle className="h-3.5 w-3.5" /> Add Condition
                        </button>
                      </div>

                      <div className="space-y-4">
                        {(selectedNode.data.rules as ConditionRule[])?.map((rule: ConditionRule, idx: number) => (
                          <div key={idx} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 relative group">
                            <button
                              onClick={() => removeRule(idx)}
                              className="absolute -top-2 -right-2 bg-red-100 dark:bg-red-900/40 text-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity border border-red-200 dark:border-red-800"
                              title="Remove Rule"
                            >
                              <X className="h-3 w-3" />
                            </button>

                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Variable</label>
                                <VariableSelect
                                  value={rule.variable}
                                  onChange={(val) => updateRule(idx, "variable", val)}
                                  variables={availableVariables}
                                  placeholder="e.g. selected_plan"
                                  showDropdown={true}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Operator</label>
                                <select
                                  value={rule.operator}
                                  onChange={(e) => updateRule(idx, "operator", e.target.value)}
                                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm text-slate-700 dark:text-slate-300 h-[46px] cursor-pointer"
                                >
                                  <option value="Equals">Equals</option>
                                  <option value="Not Equals">Not Equals</option>
                                  <option value="Contains">Contains</option>
                                  <option value="Starts With">Starts With</option>
                                  <option value="Ends With">Ends With</option>
                                  <option value="Greater Than">Greater Than</option>
                                  <option value="Less Than">Less Than</option>
                                  <option value="Greater Than Or Equal">Greater Than Or Equal</option>
                                  <option value="Less Than Or Equal">Less Than Or Equal</option>
                                  <option value="Is Empty">Is Empty</option>
                                  <option value="Is Not Empty">Is Not Empty</option>
                                </select>
                              </div>
                            </div>
                            
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Value</label>
                              <input
                                type="text"
                                value={rule.value}
                                onChange={(e) => updateRule(idx, "value", e.target.value)}
                                placeholder="e.g. Pro"
                                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm text-slate-700 dark:text-slate-300 h-[46px]"
                                disabled={rule.operator === "Is Empty" || rule.operator === "Is Not Empty"}
                              />
                            </div>

                            <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Output Label</label>
                              <input
                                type="text"
                                value={rule.label}
                                onChange={(e) => updateRule(idx, "label", e.target.value)}
                                placeholder="e.g. Pro Plan"
                                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-indigo-50/50 dark:bg-indigo-900/20 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-semibold text-indigo-700 dark:text-indigo-300 h-[46px]"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Jump to Flow details */}
                {selectedNodeType === "jump_to_flow" && (
                  <div className="space-y-5">
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-100 dark:border-amber-900/50">
                      <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-1 flex items-center gap-1.5"><GitFork className="w-3.5 h-3.5" /> Jump to Flow</h4>
                      <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 leading-relaxed">
                        Redirect the user to another sub-flow of this bot. The conversation execution will immediately start from the Start Node of that flow.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">Select Target Flow</label>
                      <select
                        value={(selectedNode.data.flowId as string) || ""}
                        onChange={(e) => updateNodeData(selectedNode.id, { flowId: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer text-sm font-semibold"
                      >
                        <option value="">-- Choose a Flow --</option>
                        {flows
                          .filter((f: any) => f.id !== currentFlowId)
                          .map((f: any) => (
                            <option key={f.id} value={f.id}>
                              {f.name} {f.isMain ? "(Main)" : ""}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Redirect URL details */}
                {selectedNodeType === "redirect" && (
                  <div className="space-y-5">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5"><ExternalLink className="w-3.5 h-3.5" /> Redirect URL</h4>
                      <p className="text-[11px] text-slate-500/80 dark:text-slate-400/80 leading-relaxed">
                        Send the visitor to a external web page. This is great for redirection to thank you pages, checkout pages, or scheduling calendars.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">Message Text (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Redirecting you now..."
                        value={(selectedNode.data.text as string) || ""}
                        onChange={(e) => updateNodeData(selectedNode.id, { text: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 outline-none focus:border-indigo-500 transition-all text-sm text-slate-700 dark:text-slate-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">Destination URL</label>
                      <input
                        type="text"
                        placeholder="e.g. https://example.com/thank-you"
                        value={(selectedNode.data.url as string) || ""}
                        onChange={(e) => updateNodeData(selectedNode.id, { url: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 outline-none focus:border-indigo-500 transition-all text-sm font-semibold text-indigo-600 dark:text-indigo-400"
                      />
                    </div>
                  </div>
                )}

              </div>

              {/* Quick info panel footer */}
              <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-200 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                  ID: {selectedNode.id}
                </span>
                <button
                  onClick={() => setIsConfigOpen(false)}
                  className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2 text-xs shadow-md transition-all"
                >
                  Save Node
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </FlowContext.Provider>
  );
}

// Reusable component for Sidebar buttons
function CatalogButton({ onClick, color, label }: { onClick: () => void; color: string; label: string }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-900/40 px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all hover:scale-[1.02] hover:shadow-sm flex items-center gap-3"
    >
      <span className={`h-2.5 w-2.5 rounded-full shadow-sm ${color}`} />
      {label}
    </button>
  );
}