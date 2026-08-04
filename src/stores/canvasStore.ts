import { create } from "zustand";
import type { Edge, Node } from "@xyflow/react";
import { runInstallViaApp } from "../lib/herdr/install";
import { createDemoWorkflow } from "../lib/demoWorkflow";
import { buildHandoffPayload, findEdgeSource } from "../lib/handoff";
import { bindHerdrToTerminal } from "../lib/herdr/bind";
import { runHandoff } from "../lib/herdr/dispatch";
import { getProjectCwd } from "../lib/herdr/env";
import { assessHerdrReady } from "../lib/herdr/requireHerdr";
import type { HerdrInstallReason } from "../lib/herdr/requireHerdr";
import { refreshHerdrConnection } from "../hooks/useHerdrConnection";
import {
  APP_SETTING_INTRO_COMPLETED,
  saveCanvas,
  setAppSetting,
} from "../lib/workflow";
import { setPendingHmrCanvasSnapshot } from "../lib/hmrCanvasSnapshot";
import {
  createMarkdownNodeData,
  createSquareNodeData,
  createTerminalNodeData,
  createTextNodeData,
} from "../lib/nodes";
import type { HerdrLifecycle } from "../lib/herdr/status";

export type { HerdrInstallReason };

const WORKFLOW_ID = "default";
let nodeCounter = 0;

const CLOSED_HERDR_INSTALL = {
  open: false,
  reason: "bind" as HerdrInstallReason,
  installing: false,
  installProgress: 0,
  installMessage: "",
  pendingBind: undefined as
    | { terminalId: string; ptyId: string; cols: number; rows: number }
    | undefined,
  pendingHandoff: undefined as
    | { terminalId: string; prompt: string }
    | undefined,
};

function nextId(prefix: string) {
  nodeCounter += 1;
  return `${prefix}-${nodeCounter}`;
}

interface HandoffState {
  open: boolean;
  targetId: string | null;
  payload: string;
}

interface MarkdownEditorState {
  open: boolean;
  nodeId: string | null;
}

export interface HerdrInstallState {
  open: boolean;
  reason: HerdrInstallReason;
  installing: boolean;
  installProgress: number;
  installMessage: string;
  pendingBind?: {
    terminalId: string;
    ptyId: string;
    cols: number;
    rows: number;
  };
  pendingHandoff?: {
    terminalId: string;
    prompt: string;
  };
}

interface CanvasState {
  workflowId: string;
  nodes: Node[];
  edges: Edge[];
  initialized: boolean;
  introActive: boolean;
  herdrOnline: boolean | null;
  herdrLifecycle: HerdrLifecycle | null;
  handoff: HandoffState;
  markdownEditor: MarkdownEditorState;
  herdrInstall: HerdrInstallState;
  addTextNode: (label?: string, fontSize?: number, position?: { x: number; y: number }) => void;
  addSquareNode: (
    width?: number,
    height?: number,
    position?: { x: number; y: number }
  ) => void;
  addTerminalNode: (
    label?: string,
    agentKind?: string,
    position?: { x: number; y: number }
  ) => void;
  addMarkdownNode: (title?: string, position?: { x: number; y: number }) => void;
  updateMarkdownNode: (id: string, patch: Partial<MarkdownNodeData>) => void;
  updateTextNode: (id: string, patch: Partial<TextNodeData>) => void;
  updateSquareNode: (id: string, patch: Partial<SquareNodeData>) => void;
  updateTerminalNode: (id: string, patch: Partial<TerminalNodeData>) => void;
  loadDemoWorkflow: () => void;
  openHandoff: (targetId: string) => void;
  runParallelFanOut: () => void;
  closeHandoff: () => void;
  sendHandoff: (text: string) => void;
  openMarkdownEditor: (nodeId: string) => void;
  closeMarkdownEditor: () => void;
  forceDone: (terminalId: string) => void;
  bindHerdr: (terminalId: string, ptyId: string, cols?: number, rows?: number) => void;
  openHerdrInstall: (input: {
    reason: HerdrInstallReason;
    pendingBind?: HerdrInstallState["pendingBind"];
    pendingHandoff?: HerdrInstallState["pendingHandoff"];
  }) => void;
  closeHerdrInstall: () => void;
  installHerdrViaApp: () => void;
  retryHerdrInstall: () => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  hydrate: (nodes: Node[], edges: Edge[]) => void;
  setInitialized: (value: boolean) => void;
  setIntroActive: (value: boolean) => void;
  completeIntro: (keepDemo: boolean) => void;
  setHerdrOnline: (value: boolean | null) => void;
  setHerdrLifecycle: (value: HerdrLifecycle | null) => void;
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
      cwd: getProjectCwd(),
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

async function continuePendingHerdrAction(get: () => CanvasState) {
  const { pendingBind, pendingHandoff } = get().herdrInstall;
  if (pendingBind) {
    await bindHerdrToTerminal(
      get,
      pendingBind.terminalId,
      pendingBind.ptyId,
      pendingBind.cols,
      pendingBind.rows
    );
    return;
  }
  if (pendingHandoff) {
    await runHandoff(
      () => get(),
      (partial) => useCanvasStore.setState(partial),
      pendingHandoff.terminalId,
      pendingHandoff.prompt
    );
  }
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  workflowId: WORKFLOW_ID,
  nodes: [],
  edges: [],
  initialized: false,
  introActive: false,
  herdrOnline: null,
  herdrLifecycle: null,
  handoff: { open: false, targetId: null, payload: "" },
  markdownEditor: { open: false, nodeId: null },
  herdrInstall: { ...CLOSED_HERDR_INSTALL },

  addTextNode: (label = "Label", fontSize = 18, position) => {
    const offset = get().nodes.length * 24;
    const pos = position ?? { x: 120 + offset, y: 120 + offset };
    set({
      nodes: [...get().nodes, createTextFlowNode(label, fontSize, pos)],
    });
  },

  addSquareNode: (width = 400, height = 300, position) => {
    const offset = get().nodes.length * 16;
    const pos = position ?? { x: 80 + offset, y: 80 + offset };
    set({
      nodes: [...get().nodes, createSquareFlowNode(width, height, pos)],
    });
  },

  addTerminalNode: (label = "Terminal", agentKind, position) => {
    const offset = get().nodes.length * 20;
    const pos = position ?? { x: 200 + offset, y: 180 + offset };
    const node = createTerminalFlowNode(label, agentKind, pos);
    set({ nodes: [...get().nodes, node] });
  },

  addMarkdownNode: (title = "Spec", position) => {
    const offset = get().nodes.length * 20;
    const pos = position ?? { x: 100 + offset, y: 100 + offset };
    set({
      nodes: [...get().nodes, createMarkdownFlowNode(title, pos)],
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
    set({
      nodes,
      edges,
      handoff: { open: false, targetId: null, payload: "" },
      markdownEditor: { open: false, nodeId: null },
      herdrInstall: { ...CLOSED_HERDR_INSTALL },
    });
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

  openMarkdownEditor: (nodeId) => {
    const node = get().nodes.find((n) => n.id === nodeId);
    if (!node || node.type !== "markdown") return;
    set({ markdownEditor: { open: true, nodeId } });
  },

  closeMarkdownEditor: () => {
    set({ markdownEditor: { open: false, nodeId: null } });
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

  openHerdrInstall: (input) => {
    set({
      herdrInstall: {
        open: true,
        reason: input.reason,
        installing: false,
        installProgress: 0,
        installMessage: "",
        pendingBind: input.pendingBind,
        pendingHandoff: input.pendingHandoff,
      },
    });
  },

  closeHerdrInstall: () => {
    set({ herdrInstall: { ...CLOSED_HERDR_INSTALL } });
  },

  installHerdrViaApp: () => {
    set({
      herdrInstall: {
        ...get().herdrInstall,
        installing: true,
        installProgress: 0.05,
        installMessage: "starting",
      },
    });
    void runInstallViaApp((progress, message) => {
      set({
        herdrInstall: {
          ...get().herdrInstall,
          installProgress: progress,
          installMessage: message,
        },
      });
    }).then((ok) => {
      set({
        herdrInstall: {
          ...get().herdrInstall,
          installing: false,
          installMessage: ok ? "" : get().herdrInstall.installMessage,
        },
      });
      if (ok) void refreshHerdrConnection();
    });
  },

  retryHerdrInstall: () => {
    void (async () => {
      const online = await refreshHerdrConnection();
      const { state } = await assessHerdrReady(true);
      if (online || state === "ready") {
        await continuePendingHerdrAction(get);
        get().closeHerdrInstall();
        return;
      }
      get().openHerdrInstall({
        reason: get().herdrInstall.reason,
        pendingBind: get().herdrInstall.pendingBind,
        pendingHandoff: get().herdrInstall.pendingHandoff,
      });
    })();
  },

  bindHerdr: (terminalId, ptyId, cols = 80, rows = 24) => {
    void (async () => {
      const { state } = await assessHerdrReady(false);
      if (state === "missing" || state === "unsupported") {
        get().openHerdrInstall({
          reason: "bind",
          pendingBind: { terminalId, ptyId, cols, rows },
        });
        return;
      }
      if (state === "offline") {
        const online = await refreshHerdrConnection();
        if (!online) {
          get().openHerdrInstall({
            reason: "bind",
            pendingBind: { terminalId, ptyId, cols, rows },
          });
          return;
        }
      }
      await bindHerdrToTerminal(get, terminalId, ptyId, cols, rows);
    })();
  },

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  hydrate: (nodes, edges) => set({ nodes, edges }),

  setInitialized: (value) => set({ initialized: value }),

  setIntroActive: (value) => set({ introActive: value }),

  completeIntro: (keepDemo) => {
    void setAppSetting(APP_SETTING_INTRO_COMPLETED, "true");
    if (keepDemo) {
      set({ introActive: false });
    } else {
      set({ nodes: [], edges: [], introActive: false });
    }
  },

  setHerdrOnline: (value) => set({ herdrOnline: value }),
  setHerdrLifecycle: (value) => set({ herdrLifecycle: value }),
}));

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    const state = useCanvasStore.getState();
    setPendingHmrCanvasSnapshot({
      nodes: state.nodes,
      edges: state.edges,
      introActive: state.introActive,
    });
    if (state.initialized && !state.introActive) {
      void saveCanvas(state.workflowId, state.nodes, state.edges);
    }
  });
}
