import { bindPtyToHerdr, spawnLocalPty } from "../pty/client";
import { isTauriRuntime } from "../workflow";
import { provisionTerminalPane } from "./client";
import { checkHerdrAvailable, isRealHerdrPane } from "./dispatch";
import { getProjectCwd } from "./env";
import type { TerminalNodeData } from "../types";

interface CanvasSlice {
  nodes: Array<{ id: string; type?: string; data: unknown }>;
  updateTerminalNode: (id: string, patch: Partial<TerminalNodeData>) => void;
}

export function isHerdrBound(data: TerminalNodeData): boolean {
  return data.herdrBound === true && isRealHerdrPane(data.herdrPaneId);
}

export function isLocalShell(data: TerminalNodeData): boolean {
  return !isHerdrBound(data);
}

/** Pane id shown in the header badge — real Herdr ids only, not demo placeholders. */
export function terminalPaneIdLabel(data: TerminalNodeData): string | null {
  return isRealHerdrPane(data.herdrPaneId) ? data.herdrPaneId : null;
}

export async function bindHerdrToTerminal(
  get: () => CanvasSlice,
  nodeId: string,
  ptyId: string,
  cols = 80,
  rows = 24
): Promise<string | null> {
  if (!(await checkHerdrAvailable(true))) {
    return null;
  }

  if (isTauriRuntime() && !ptyId) {
    get().updateTerminalNode(nodeId, {
      status: "blocked",
      outputPreview: "$ open terminal — select node and wait for shell before binding Herdr\n",
    });
    return null;
  }

  const node = get().nodes.find((n) => n.id === nodeId);
  if (!node || node.type !== "terminal") return null;
  const data = node.data as TerminalNodeData;

  if (isHerdrBound(data)) {
    return data.herdrPaneId;
  }

  get().updateTerminalNode(nodeId, { status: "working" });

  try {
    let paneId = data.herdrPaneId;
    if (!isRealHerdrPane(paneId)) {
      const boundPaneIds = get()
        .nodes.filter((n) => n.type === "terminal" && n.id !== nodeId)
        .map((n) => (n.data as TerminalNodeData).herdrPaneId)
        .filter((id) => isRealHerdrPane(id));
      const cwd = data.cwd || getProjectCwd();
      const pane = await provisionTerminalPane(cwd, boundPaneIds);
      paneId = pane.pane_id;
      get().updateTerminalNode(nodeId, { herdrPaneId: paneId });
    }

    await bindPtyToHerdr(ptyId, paneId, cols, rows);
    get().updateTerminalNode(nodeId, {
      herdrPaneId: paneId,
      herdrBound: true,
      status: "idle",
      outputPreview: `$ pane ${paneId}\n# herdr bound\n`,
    });
    return paneId;
  } catch (err) {
    get().updateTerminalNode(nodeId, {
      status: "blocked",
      outputPreview: `herdr bind: ${err instanceof Error ? err.message : String(err)}`,
    });
    return null;
  }
}

/** Re-attach a fresh local PTY to a persisted Herdr pane (e.g. after app restart). */
export async function rebindHerdrToTerminal(
  get: () => CanvasSlice,
  nodeId: string,
  ptyId: string,
  cols = 80,
  rows = 24
): Promise<string | null> {
  if (!(await checkHerdrAvailable(true))) {
    return null;
  }

  if (isTauriRuntime() && !ptyId) {
    return null;
  }

  const node = get().nodes.find((n) => n.id === nodeId);
  if (!node || node.type !== "terminal") return null;
  const data = node.data as TerminalNodeData;
  if (!isRealHerdrPane(data.herdrPaneId)) return null;

  try {
    await bindPtyToHerdr(ptyId, data.herdrPaneId, cols, rows);
    get().updateTerminalNode(nodeId, {
      herdrBound: true,
      status: "idle",
      outputPreview: `$ pane ${data.herdrPaneId}\n# herdr reconnected\n`,
    });
    return data.herdrPaneId;
  } catch (err) {
    get().updateTerminalNode(nodeId, {
      status: "blocked",
      outputPreview: `herdr rebind: ${err instanceof Error ? err.message : String(err)}`,
    });
    return null;
  }
}

const reconnecting = new Set<string>();

/** Restore Herdr sessions for bound terminals on app open (no node select required). */
export async function reconnectBoundTerminals(get: () => CanvasSlice): Promise<void> {
  if (!isTauriRuntime()) return;
  if (!(await checkHerdrAvailable(true))) return;

  for (const node of get().nodes) {
    if (node.type !== "terminal") continue;
    const data = node.data as TerminalNodeData;
    if (!isHerdrBound(data)) continue;
    if (reconnecting.has(node.id)) continue;

    reconnecting.add(node.id);
    try {
      let ptyId = data.ptyId;
      if (!ptyId) {
        ptyId = await spawnLocalPty(data.cwd || getProjectCwd(), 80, 24);
        get().updateTerminalNode(node.id, { ptyId });
      }
      await rebindHerdrToTerminal(get, node.id, ptyId, 80, 24);
    } finally {
      reconnecting.delete(node.id);
    }
  }
}
