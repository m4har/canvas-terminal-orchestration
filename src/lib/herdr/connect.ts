import { invoke } from "@tauri-apps/api/core";
import { isTauriRuntime } from "../workflow";
import { ensureHerdrPresent } from "./status";
import { herdrRun } from "./client";

export function parseHerdrServerStatus(json: string): boolean {
  try {
    const parsed = JSON.parse(json.trim()) as { status?: string; running?: boolean };
    return parsed.status === "running" || parsed.running === true;
  } catch {
    return false;
  }
}

export async function probeHerdrServer(): Promise<boolean> {
  try {
    const out = await herdrRun(["status", "server", "--json"]);
    return parseHerdrServerStatus(out);
  } catch {
    return false;
  }
}

export async function connectHerdr(): Promise<boolean> {
  if (await probeHerdrServer()) return true;

  if (isTauriRuntime()) {
    try {
      await ensureHerdrPresent();
      return await invoke<boolean>("herdr_connect");
    } catch {
      return false;
    }
  }

  try {
    const res = await fetch("/api/herdr/connect", { method: "POST" });
    if (!res.ok) return false;
    const data = (await res.json()) as { online?: boolean };
    return data.online === true;
  } catch {
    return false;
  }
}
