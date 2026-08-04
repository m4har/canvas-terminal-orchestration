import { bindPtyToHerdr } from "../pty/client";
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
