import { invoke } from "@tauri-apps/api/core";
import { isTauriRuntime } from "../workflow";

let cachedProjectCwd: string | null = null;

const REPO_NAME = "canvas-orchestra-loop-engineer";

function browserDevCwd(): string {
  return `/workspace/${REPO_NAME}`;
}

/** Resolve and cache project cwd (Tauri: dir where app was launched). */
export async function resolveProjectCwd(): Promise<string> {
  if (cachedProjectCwd) return cachedProjectCwd;

  if (isTauriRuntime()) {
    cachedProjectCwd = await invoke<string>("get_project_cwd");
    return cachedProjectCwd;
  }

  const { hostname } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    cachedProjectCwd = browserDevCwd();
    return cachedProjectCwd;
  }

  cachedProjectCwd = "/project";
  return cachedProjectCwd;
}

/** Sync read — returns cached cwd or browser fallback. Tauri returns "" until resolved. */
export function getProjectCwd(): string {
  if (cachedProjectCwd) return cachedProjectCwd;

  if (typeof window === "undefined") {
    return browserDevCwd();
  }

  if (isTauriRuntime()) {
    return "";
  }

  const { hostname } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return browserDevCwd();
  }

  return "/project";
}
