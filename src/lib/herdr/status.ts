import { invoke } from "@tauri-apps/api/core";
import { isTauriRuntime } from "../workflow";

export type HerdrLifecycle =
  | "unsupported"
  | "missing"
  | "downloading"
  | "present"
  | "starting"
  | "connected"
  | "offline";

export type OsPlatform = "macos" | "linux" | "windows" | "unknown";

export interface HerdrStatusSnapshot {
  platform: OsPlatform;
  lifecycle: HerdrLifecycle;
  present: boolean;
  connected: boolean;
  spawnedByUs: boolean;
  progress: number;
  message: string;
}

const DEFAULT_STATUS: HerdrStatusSnapshot = {
  platform: "unknown",
  lifecycle: "offline",
  present: false,
  connected: false,
  spawnedByUs: false,
  progress: 0,
  message: "",
};

export async function fetchHerdrStatus(): Promise<HerdrStatusSnapshot> {
  if (!isTauriRuntime()) return DEFAULT_STATUS;
  try {
    return await invoke<HerdrStatusSnapshot>("herdr_status");
  } catch {
    return DEFAULT_STATUS;
  }
}

export async function ensureHerdrPresent(): Promise<HerdrStatusSnapshot> {
  if (!isTauriRuntime()) return DEFAULT_STATUS;
  return invoke<HerdrStatusSnapshot>("herdr_ensure_present");
}

export async function bridgePaneSend(paneId: string, text: string): Promise<void> {
  if (!isTauriRuntime()) return;
  await invoke("herdr_pane_send", { paneId, text });
}

export async function bridgePaneSendKeys(paneId: string, keys: string[]): Promise<void> {
  if (!isTauriRuntime()) return;
  await invoke("herdr_pane_send_keys", { paneId, keys });
}

export async function bridgePaneReadVisible(paneId: string, lines = 24): Promise<string> {
  if (!isTauriRuntime()) return "";
  return invoke<string>("herdr_pane_read_visible", { paneId, lines });
}

export async function bridgePaneReadRecent(paneId: string, lines = 24): Promise<string> {
  if (!isTauriRuntime()) return "";
  return invoke<string>("herdr_pane_read_recent", { paneId, lines });
}

export async function bridgePaneResize(
  paneId: string,
  cols: number,
  rows: number
): Promise<void> {
  if (!isTauriRuntime()) return;
  await invoke("herdr_pane_resize", { paneId, cols, rows });
}
