import { invoke } from "@tauri-apps/api/core";
import { isTauriRuntime } from "../workflow";
import { encodeXtermInput } from "../terminal/xtermInput";
import { parseHerdrServerStatus } from "./connect";
import { bridgePaneReadRecent, bridgePaneReadVisible, bridgePaneResize, bridgePaneSend, bridgePaneSendKeys } from "./status";
import { normalizeAgentStatus, parseHerdrJson, tailLines } from "./parse";
import type {
  AgentListResult,
  AgentPromptResult,
  HerdrPane,
  PaneListResult,
  PaneSplitResult,
  WorkspaceCreatedResult,
  WorkspaceListResult,
} from "./types";
import { CANVAS_WORKSPACE_LABEL } from "./types";

export type HerdrRunner = (args: string[]) => Promise<string>;

let runner: HerdrRunner | null = null;
let workspaceCache: { workspaceId: string; rootPaneId: string } | null = null;
let ensureCanvasWorkspacePromise: Promise<{ workspaceId: string; rootPaneId: string }> | null =
  null;

async function defaultRunner(args: string[]): Promise<string> {
  if (isTauriRuntime()) {
    return invoke<string>("herdr_run", { args });
  }
  const res = await fetch("/api/herdr/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ args }),
  });
  if (!res.ok) {
    throw new Error((await res.text()) || `herdr proxy ${res.status}`);
  }
  return res.text();
}

export function setHerdrRunner(next: HerdrRunner | null) {
  runner = next;
  workspaceCache = null;
  ensureCanvasWorkspacePromise = null;
}

function getRunner(): HerdrRunner {
  return runner ?? defaultRunner;
}

export async function herdrRun(args: string[]): Promise<string> {
  return getRunner()(args);
}

export async function herdrStatus(): Promise<boolean> {
  try {
    const out = await herdrRun(["status", "server", "--json"]);
    return parseHerdrServerStatus(out);
  } catch {
    return false;
  }
}

export async function listWorkspaces() {
  const out = await herdrRun(["workspace", "list"]);
  return parseHerdrJson<WorkspaceListResult>(out);
}

export async function createWorkspace(cwd: string, label = CANVAS_WORKSPACE_LABEL) {
  const out = await herdrRun([
    "workspace",
    "create",
    "--cwd",
    cwd,
    "--label",
    label,
    "--no-focus",
  ]);
  return parseHerdrJson<WorkspaceCreatedResult>(out);
}

export async function ensureCanvasWorkspace(cwd: string) {
  if (workspaceCache) return workspaceCache;
  if (ensureCanvasWorkspacePromise) return ensureCanvasWorkspacePromise;

  ensureCanvasWorkspacePromise = (async () => {
    const list = await listWorkspaces();
    const existing = list.workspaces.find((w) => w.label === CANVAS_WORKSPACE_LABEL);
    if (existing) {
      const panes = await listPanes();
      const wsPanes = panes.filter((p) => p.workspace_id === existing.workspace_id);
      const root = wsPanes.sort((a, b) => a.pane_id.localeCompare(b.pane_id))[0];
      if (!root) throw new Error("herdr: workspace has no panes");
      workspaceCache = {
        workspaceId: existing.workspace_id,
        rootPaneId: root.pane_id,
      };
      return workspaceCache;
    }

    const created = await createWorkspace(cwd);
    workspaceCache = {
      workspaceId: created.workspace.workspace_id,
      rootPaneId: created.root_pane.pane_id,
    };
    return workspaceCache;
  })().finally(() => {
    ensureCanvasWorkspacePromise = null;
  });

  return ensureCanvasWorkspacePromise;
}

export async function splitPane(
  paneId: string,
  direction: "right" | "down" | "left" | "up" = "right"
) {
  const out = await herdrRun(["pane", "split", paneId, "--direction", direction]);
  return parseHerdrJson<PaneSplitResult>(out).pane;
}

export async function listPanes(): Promise<HerdrPane[]> {
  const out = await herdrRun(["pane", "list"]);
  return parseHerdrJson<PaneListResult>(out).panes;
}

export async function readPaneText(paneId: string, lines = 12): Promise<string> {
  const out = await herdrRun([
    "pane",
    "read",
    paneId,
    "--lines",
    String(lines),
    "--source",
    "recent",
    "--format",
    "text",
  ]);
  return out.trim();
}

export async function readPaneVisible(paneId: string, lines = 24): Promise<string> {
  if (isTauriRuntime()) {
    return bridgePaneReadVisible(paneId, lines);
  }
  const out = await herdrRun([
    "pane",
    "read",
    paneId,
    "--lines",
    String(lines),
    "--source",
    "visible",
    "--format",
    "ansi",
  ]);
  return out;
}

export async function readPaneRecent(paneId: string, lines = 24): Promise<string> {
  if (isTauriRuntime()) {
    return bridgePaneReadRecent(paneId, lines);
  }
  const out = await herdrRun([
    "pane",
    "read",
    paneId,
    "--lines",
    String(lines),
    "--source",
    "recent-unwrapped",
    "--format",
    "ansi",
  ]);
  return out;
}

/** @deprecated Use readPaneVisible or readPaneRecent */
export async function readPaneAnsi(paneId: string, lines = 24): Promise<string> {
  return readPaneRecent(paneId, lines);
}

export async function sendPaneText(paneId: string, text: string) {
  await herdrRun(["pane", "send-text", paneId, text]);
}

export async function sendPaneKeys(paneId: string, keys: string[]) {
  if (!keys.length) return;
  if (isTauriRuntime()) {
    await bridgePaneSendKeys(paneId, keys);
    return;
  }
  await herdrRun(["pane", "send-keys", paneId, ...keys]);
}

export async function sendPaneInput(paneId: string, data: string) {
  if (!data) return;
  const input = encodeXtermInput(data);
  if (input.kind === "keys") {
    await sendPaneKeys(paneId, input.keys);
    return;
  }
  if (!input.text) return;
  if (isTauriRuntime()) {
    await bridgePaneSend(paneId, input.text);
    return;
  }
  await herdrRun(["pane", "send-text", paneId, input.text]);
}

export async function promptAgent(target: string, text: string) {
  const out = await herdrRun(["agent", "prompt", target, text]);
  return parseHerdrJson<AgentPromptResult>(out);
}

export async function listAgents() {
  const out = await herdrRun(["agent", "list"]);
  return parseHerdrJson<AgentListResult>(out).agents;
}

export async function getPaneStatus(paneId: string) {
  const panes = await listPanes();
  const pane = panes.find((p) => p.pane_id === paneId);
  return normalizeAgentStatus(pane?.agent_status);
}

export async function resizePaneTerminal(paneId: string, cols: number, rows: number) {
  if (isTauriRuntime()) {
    await bridgePaneResize(paneId, cols, rows);
    return;
  }
  await herdrRun([
    "terminal",
    "session",
    "control",
    paneId,
    "--takeover",
    "--cols",
    String(cols),
    "--rows",
    String(rows),
  ]);
}

export async function paneExists(paneId: string): Promise<boolean> {
  const panes = await listPanes();
  return panes.some((p) => p.pane_id === paneId);
}

export async function findReusableCanvasPane(
  cwd: string,
  boundPaneIds: ReadonlySet<string>
): Promise<HerdrPane | null> {
  const { workspaceId } = await ensureCanvasWorkspace(cwd);
  const panes = await listPanes();
  const wsPanes = panes.filter((p) => p.workspace_id === workspaceId);
  if (wsPanes.length > 10) {
    console.warn(
      `[canvas] Herdr workspace has ${wsPanes.length} panes — consider closing stale panes with herdr pane close`
    );
  }
  return wsPanes.find((p) => !boundPaneIds.has(p.pane_id)) ?? null;
}

export async function provisionTerminalPane(
  cwd: string,
  boundPaneIds: string[] = []
): Promise<HerdrPane> {
  const bound = new Set(boundPaneIds);
  const reusable = await findReusableCanvasPane(cwd, bound);
  if (reusable) {
    await resizePaneTerminal(reusable.pane_id, 80, 24);
    return reusable;
  }
  const { rootPaneId } = await ensureCanvasWorkspace(cwd);
  const pane = await splitPane(rootPaneId, "right");
  await resizePaneTerminal(pane.pane_id, 80, 24);
  return pane;
}

export async function dispatchToPane(
  paneId: string,
  text: string,
  agentName?: string
): Promise<{ preview: string; status: ReturnType<typeof normalizeAgentStatus> }> {
  if (agentName) {
    await promptAgent(agentName, text);
  } else {
    await sendPaneText(paneId, text);
  }

  const preview = tailLines(await readPaneText(paneId));
  const status = await getPaneStatus(paneId);
  return { preview, status: status === "idle" ? "working" : status };
}

export function resetHerdrCache() {
  workspaceCache = null;
  ensureCanvasWorkspacePromise = null;
}
