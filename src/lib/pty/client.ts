import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { isTauriRuntime } from "../workflow";

export interface PtyOutputEvent {
  ptyId: string;
  data: string;
  full?: boolean;
}

export async function spawnLocalPty(
  cwd?: string,
  cols = 80,
  rows = 24
): Promise<string> {
  if (!isTauriRuntime()) return "mock-pty";
  return invoke<string>("pty_spawn", { cwd, cols, rows });
}

export async function writePty(ptyId: string, data: string): Promise<void> {
  if (!isTauriRuntime() || ptyId === "mock-pty") return;
  await invoke("pty_write", { ptyId, data });
}

export async function resizePty(
  ptyId: string,
  cols: number,
  rows: number
): Promise<void> {
  if (!isTauriRuntime() || ptyId === "mock-pty") return;
  await invoke("pty_resize", { ptyId, cols, rows });
}

export async function killPty(ptyId: string): Promise<void> {
  if (!isTauriRuntime() || ptyId === "mock-pty") return;
  await invoke("pty_kill", { ptyId });
}

export async function bindPtyToHerdr(
  ptyId: string,
  paneId: string,
  cols: number,
  rows: number
): Promise<void> {
  if (!isTauriRuntime()) return;
  await invoke("pty_bind_herdr", { ptyId, paneId, cols, rows });
}

export function listenPtyOutput(
  handler: (event: PtyOutputEvent) => void
): Promise<UnlistenFn> {
  if (!isTauriRuntime()) {
    return Promise.resolve(() => {});
  }
  return listen<PtyOutputEvent>("pty-output", (e) => handler(e.payload));
}
