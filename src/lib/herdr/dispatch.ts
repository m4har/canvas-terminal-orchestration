import type { GetState, SetState } from "zustand";
import {
  dispatchToPane,
  herdrStatus,
  provisionTerminalPane,
} from "./client";
import { getProjectCwd } from "./env";
import type { TerminalNodeData } from "../types";

let herdrAvailable: boolean | null = null;
let herdrCheckedAt = 0;
const HERDR_CACHE_MS = 3000;

export function resetHerdrState() {
  herdrAvailable = null;
  herdrCheckedAt = 0;
}

export function isRealHerdrPane(paneId: string) {
  return /^w[a-zA-Z0-9]+:p\d+$/.test(paneId);
}

export async function checkHerdrAvailable(force = false) {
  const stale = Date.now() - herdrCheckedAt > HERDR_CACHE_MS;
  if (!force && herdrAvailable !== null && !stale) {
    return herdrAvailable;
  }
  herdrAvailable = await herdrStatus();
  herdrCheckedAt = Date.now();
  return herdrAvailable;
}

interface CanvasSlice {
  nodes: Array<{ id: string; type?: string; data: unknown }>;
  updateTerminalNode: (id: string, patch: Partial<TerminalNodeData>) => void;
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
    outputPreview: "$ connecting to Herdr pane...\n",
  });

  try {
    const pane = await provisionTerminalPane(cwd);
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
  const terminals = get().nodes.filter((n) => n.type === "terminal");
  await Promise.all(
    terminals.map(async (node) => {
      const data = node.data as TerminalNodeData;
      if (!isRealHerdrPane(data.herdrPaneId)) {
        await provisionNodePane(get, set, node.id);
      }
    })
  );
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

  if (!isRealHerdrPane(data.herdrPaneId) && (await checkHerdrAvailable(true))) {
    await provisionNodePane(get, set, terminalId);
    const refreshed = get().nodes.find((n) => n.id === terminalId);
    if (!refreshed || refreshed.type !== "terminal") return;
    const paneId = (refreshed.data as TerminalNodeData).herdrPaneId;
    if (!isRealHerdrPane(paneId)) return;
  }

  get().updateTerminalNode(terminalId, {
    status: "working",
    lastPrompt: prompt,
    outputPreview: `$ herdr\n> ${prompt.slice(0, 80)}...`,
  });

  const live = (await checkHerdrAvailable(true)) && isRealHerdrPane(
    (get().nodes.find((n) => n.id === terminalId)?.data as TerminalNodeData).herdrPaneId
  );

  if (!live) {
    simulateAgentRun(get, set, terminalId, prompt);
    return;
  }

  try {
    const paneId = (get().nodes.find((n) => n.id === terminalId)?.data as TerminalNodeData)
      .herdrPaneId;
    const { preview, status } = await dispatchToPane(paneId, prompt, data.agentName);
    get().updateTerminalNode(terminalId, {
      status,
      outputPreview: preview || data.outputPreview,
    });
  } catch (err) {
    get().updateTerminalNode(terminalId, {
      status: "blocked",
      outputPreview: `herdr error: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}
