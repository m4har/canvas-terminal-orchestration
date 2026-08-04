import type { GetState, SetState } from "zustand";
import { bindHerdrToTerminal, isHerdrBound } from "./bind";
import {
  dispatchToPane,
  herdrStatus,
  paneExists,
  provisionTerminalPane,
} from "./client";
import { connectHerdr } from "./connect";
import { getProjectCwd } from "./env";
import { assessHerdrReady } from "./requireHerdr";
import { isAutomationMode } from "../runtimeFlags";
import type { TerminalNodeData } from "../types";

let herdrAvailable: boolean | null = null;
let herdrCheckedAt = 0;
let reconcilePromise: Promise<void> | null = null;
const HERDR_CACHE_MS = 3000;

export function resetHerdrState() {
  herdrAvailable = null;
  herdrCheckedAt = 0;
}

export function isRealHerdrPane(paneId: string) {
  return /^w[a-zA-Z0-9]+:p[a-zA-Z0-9]+$/.test(paneId);
}

export async function checkHerdrAvailable(force = false) {
  const stale = Date.now() - herdrCheckedAt > HERDR_CACHE_MS;
  if (!force && herdrAvailable !== null && !stale) {
    return herdrAvailable;
  }
  if (force || herdrAvailable !== true) {
    await connectHerdr();
  }
  herdrAvailable = await herdrStatus();
  herdrCheckedAt = Date.now();
  return herdrAvailable;
}

interface CanvasSlice {
  nodes: Array<{ id: string; type?: string; data: unknown }>;
  updateTerminalNode: (id: string, patch: Partial<TerminalNodeData>) => void;
  openHerdrInstall: (input: {
    reason: "bind" | "handoff" | "toolbar";
    pendingBind?: {
      terminalId: string;
      ptyId: string;
      cols: number;
      rows: number;
    };
    pendingHandoff?: { terminalId: string; prompt: string };
  }) => void;
}

export async function provisionNodePane(
  get: GetState<CanvasSlice>,
  set: SetState<CanvasSlice>,
  nodeId: string,
  cwd = getProjectCwd()
) {
  if (!(await checkHerdrAvailable(true))) {
    get().updateTerminalNode(nodeId, {
      status: "idle",
      outputPreview: "$ herdr offline — mock shell (start: herdr server)\n",
    });
    return;
  }

  get().updateTerminalNode(nodeId, {
    status: "working",
  });

  try {
    const boundPaneIds = get()
      .nodes.filter((n) => n.type === "terminal" && n.id !== nodeId)
      .map((n) => (n.data as TerminalNodeData).herdrPaneId)
      .filter((id) => isRealHerdrPane(id));
    const pane = await provisionTerminalPane(cwd, boundPaneIds);
    get().updateTerminalNode(nodeId, {
      herdrPaneId: pane.pane_id,
      cwd: pane.cwd,
      status: "idle",
      outputPreview: `$ pane ${pane.pane_id}\n# shell ready — type or start an agent\n`,
    });
  } catch (err) {
    get().updateTerminalNode(nodeId, {
      status: "blocked",
      outputPreview: `herdr: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}

export async function reconcileTerminalPanes(
  get: GetState<CanvasSlice>,
  set: SetState<CanvasSlice>
) {
  if (isAutomationMode()) return;
  if (reconcilePromise) return reconcilePromise;

  reconcilePromise = (async () => {
    const terminals = get().nodes.filter((n) => n.type === "terminal");
    for (const node of terminals) {
      const data = node.data as TerminalNodeData;
      if (!isHerdrBound(data)) continue;
      if (
        isRealHerdrPane(data.herdrPaneId) &&
        !(await paneExists(data.herdrPaneId))
      ) {
        get().updateTerminalNode(node.id, {
          herdrBound: false,
          status: "blocked",
          outputPreview: "$ herdr pane missing — bind again\n",
        });
      }
    }
  })().finally(() => {
    reconcilePromise = null;
  });

  return reconcilePromise;
}

export function simulateAgentRun(
  get: GetState<CanvasSlice>,
  set: SetState<CanvasSlice>,
  terminalId: string,
  prompt: string
) {
  get().updateTerminalNode(terminalId, {
    status: "working",
    lastPrompt: prompt,
    outputPreview: `$ herdr agent prompt\n> ${prompt.slice(0, 80)}...\n[working]`,
  });

  window.setTimeout(() => {
    const node = get().nodes.find((n) => n.id === terminalId);
    if (!node || node.type !== "terminal") return;
    const data = node.data as TerminalNodeData;
    if (data.status !== "working") return;
    get().updateTerminalNode(terminalId, {
      status: "done",
      outputPreview: `$ done\n✓ Task completed\n${prompt.slice(0, 60)}...`,
    });
  }, 1500);
}

export async function runHandoff(
  get: GetState<CanvasSlice>,
  set: SetState<CanvasSlice>,
  terminalId: string,
  prompt: string
) {
  const node = get().nodes.find((n) => n.id === terminalId);
  if (!node || node.type !== "terminal") return;
  const data = node.data as TerminalNodeData;

  if (!isHerdrBound(data)) {
    const { state } = await assessHerdrReady(true);
    if (state !== "ready") {
      get().openHerdrInstall({
        reason: "handoff",
        pendingHandoff: { terminalId, prompt },
      });
      return;
    }
    const ptyId = data.ptyId ?? "mock-pty";
    const paneId = await bindHerdrToTerminal(get, terminalId, ptyId);
    if (!paneId) {
      get().openHerdrInstall({
        reason: "handoff",
        pendingHandoff: { terminalId, prompt },
      });
      return;
    }
  }

  const refreshed = get().nodes.find((n) => n.id === terminalId);
  if (!refreshed || refreshed.type !== "terminal") return;
  const paneData = refreshed.data as TerminalNodeData;

  get().updateTerminalNode(terminalId, {
    status: "working",
    lastPrompt: prompt,
    outputPreview: `$ herdr\n> ${prompt.slice(0, 80)}...`,
  });

  const live =
    isHerdrBound(paneData) && isRealHerdrPane(paneData.herdrPaneId);

  if (!live) {
    get().openHerdrInstall({
      reason: "handoff",
      pendingHandoff: { terminalId, prompt },
    });
    return;
  }

  try {
    const paneId = paneData.herdrPaneId;
    const { preview, status } = await dispatchToPane(paneId, prompt, paneData.agentName);
    get().updateTerminalNode(terminalId, {
      status,
      outputPreview: preview || paneData.outputPreview,
    });
  } catch (err) {
    get().updateTerminalNode(terminalId, {
      status: "blocked",
      outputPreview: `herdr error: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}
