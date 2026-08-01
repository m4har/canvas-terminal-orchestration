import { create } from "zustand";
import type { Edge, Node } from "@xyflow/react";
import { createDemoWorkflow } from "../lib/demoWorkflow";
import { buildHandoffPayload, findEdgeSource } from "../lib/handoff";
import { provisionNodePane, runHandoff } from "../lib/herdr/dispatch";
import {
  createMarkdownNodeData,
  createSquareNodeData,
  createTerminalNodeData,
  createTextNodeData,
} from "../lib/nodes";
import type { MarkdownNodeData, SquareNodeData, TerminalNodeData, TextNodeData } from "../lib/types";

const WORKFLOW_ID = "default";
let nodeCounter = 0;
let paneCounter = 0;

function nextId(prefix: string) {
  nodeCounter += 1;
  return `${prefix}-${nodeCounter}`;
}

function nextPaneId() {
  paneCounter += 1;
  return `pane-${paneCounter}`;
}

interface HandoffState {
  open: boolean;
  targetId: string | null;
  payload: string;
}

interface CanvasState {
  workflowId: string;
  nodes: Node[];
  edges: Edge[];
  initialized: boolean;
  handoff: HandoffState;
  addTextNode: (label?: string, fontSize?: number) => void;
  addSquareNode: (width?: number, height?: number) => void;
  addTerminalNode: (label?: string, agentKind?: string) => void;
  addMarkdownNode: (title?: string) => void;
  updateMarkdownNode: (id: string, patch: Partial<MarkdownNodeData>) => void;
  updateTextNode: (id: string, patch: Partial<TextNodeData>) => void;
  updateSquareNode: (id: string, patch: Partial<SquareNodeData>) => void;
  updateTerminalNode: (id: string, patch: Partial<TerminalNodeData>) => void;
  loadDemoWorkflow: () => void;
  openHandoff: (targetId: string) => void;
  runParallelFanOut: () => void;
  closeHandoff: () => void;
  sendHandoff: (text: string) => void;
  forceDone: (terminalId: string) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  hydrate: (nodes: Node[], edges: Edge[]) => void;
  setInitialized: (value: boolean) => void;
}

export function createTextFlowNode(
  label = "Label",
  fontSize = 18,
  position = { x: 100, y: 100 }
): Node<TextNodeData> {
  return {
    id: nextId("text"),
    type: "text",
    position,
    style: { width: 200, height: 56 },
    data: createTextNodeData({ label, fontSize }),
  };
}

export function createSquareFlowNode(
  width = 400,
  height = 300,
  position = { x: 80, y: 80 }
): Node<SquareNodeData> {
  return {
    id: nextId("square"),
    type: "square",
    position,
    zIndex: -1,
    dragHandle: ".square-drag-handle",
    style: { width, height },
    data: createSquareNodeData({ width, height }),
  };
}

export function createTerminalFlowNode(
  label = "Terminal",
  agentKind?: string,
  position = { x: 200, y: 200 }
): Node<TerminalNodeData> {
  return {
    id: nextId("terminal"),
    type: "terminal",
    position,
    style: { width: 288, height: 200 },
    data: createTerminalNodeData({
      label,
      herdrPaneId: nextPaneId(),
      cwd: "/project",
      agentKind,
    }),
  };
}

export function createMarkdownFlowNode(
  title = "Spec",
  position = { x: 120, y: 120 }
): Node<MarkdownNodeData> {
  return {
    id: nextId("markdown"),
    type: "markdown",
    position,
    style: { width: 256, height: 200 },
    data: createMarkdownNodeData({ title }),
  };
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  workflowId: WORKFLOW_ID,
  nodes: [],
  edges: [],
  initialized: false,
  handoff: { open: false, targetId: null, payload: "" },

  addTextNode: (label = "Label", fontSize = 18) => {
    const offset = get().nodes.length * 24;
    set({
      nodes: [
        ...get().nodes,
        createTextFlowNode(label, fontSize, { x: 120 + offset, y: 120 + offset }),
      ],
    });
  },

  addSquareNode: (width = 400, height = 300) => {
    const offset = get().nodes.length * 16;
    set({
      nodes: [
        ...get().nodes,
        createSquareFlowNode(width, height, { x: 80 + offset, y: 80 + offset }),
      ],
    });
  },

  addTerminalNode: (label = "Terminal", agentKind) => {
    const offset = get().nodes.length * 20;
    const node = createTerminalFlowNode(label, agentKind, {
      x: 200 + offset,
      y: 180 + offset,
    });
    set({ nodes: [...get().nodes, node] });
    void provisionNodePane(get, set, node.id);
  },

  addMarkdownNode: (title = "Spec") => {
    const offset = get().nodes.length * 20;
    set({
      nodes: [
        ...get().nodes,
        createMarkdownFlowNode(title, { x: 100 + offset, y: 100 + offset }),
      ],
    });
  },

  updateMarkdownNode: (id, patch) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === id && n.type === "markdown"
          ? { ...n, data: { ...(n.data as MarkdownNodeData), ...patch } }
          : n
      ),
    });
  },

  updateTextNode: (id, patch) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === id && n.type === "text"
          ? { ...n, data: { ...(n.data as TextNodeData), ...patch } }
          : n
      ),
    });
  },

  updateSquareNode: (id, patch) => {
    set({
      nodes: get().nodes.map((n) => {
        if (n.id !== id || n.type !== "square") return n;
        const data = { ...(n.data as SquareNodeData), ...patch };
        return {
          ...n,
          data,
          style: {
            ...n.style,
            width: data.width,
            height: data.height,
          },
        };
      }),
    });
  },

  updateTerminalNode: (id, patch) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === id && n.type === "terminal"
          ? { ...n, data: { ...(n.data as TerminalNodeData), ...patch } }
          : n
      ),
    });
  },

  loadDemoWorkflow: () => {
    const { nodes, edges } = createDemoWorkflow();
    nodeCounter = 10;
    paneCounter = 3;
    set({ nodes, edges, handoff: { open: false, targetId: null, payload: "" } });
  },

  openHandoff: (targetId) => {
    const target = get().nodes.find((n) => n.id === targetId);
    if (!target || target.type !== "terminal") return;

    const edge = findEdgeSource(get().edges, targetId);
    const source = edge
      ? get().nodes.find((n) => n.id === edge.source)
      : undefined;
    const payload = buildHandoffPayload(source, target);

    set({
      handoff: { open: true, targetId, payload },
    });
  },

  runParallelFanOut: () => {
    ["term-fe", "term-be"].forEach((id) => {
      const edge = findEdgeSource(get().edges, id);
      const source = edge ? get().nodes.find((n) => n.id === edge.source) : undefined;
      const target = get().nodes.find((n) => n.id === id);
      if (!target) return;
      const text = buildHandoffPayload(source, target);
      void runHandoff(get, set, id, text);
    });
  },

  closeHandoff: () => {
    set({ handoff: { open: false, targetId: null, payload: "" } });
  },

  sendHandoff: (text) => {
    const { targetId } = get().handoff;
    if (!targetId) return;

    void runHandoff(get, set, targetId, text);
    get().closeHandoff();
  },

  forceDone: (terminalId) => {
    get().updateTerminalNode(terminalId, { status: "done" });
  },

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  hydrate: (nodes, edges) => set({ nodes, edges }),

  setInitialized: (value) => set({ initialized: value }),
}));
