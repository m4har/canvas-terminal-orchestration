import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { isTauriRuntime } from "../workflow";

export interface OrchestratorStatusEvent {
  ptyId: string;
  status: string;
  outputTail: string;
}

export async function orchestratorDispatch(
  ptyId: string,
  text: string,
  agentKind?: string
): Promise<void> {
  if (!isTauriRuntime()) return;
  await invoke("orchestrator_dispatch", {
    ptyId,
    text,
    agentKind: agentKind ?? null,
  });
}

export async function orchestratorForceDone(ptyId: string): Promise<void> {
  if (!isTauriRuntime()) return;
  await invoke("orchestrator_force_done", { ptyId });
}

export async function orchestratorGetStatus(
  ptyId: string
): Promise<OrchestratorStatusEvent | null> {
  if (!isTauriRuntime()) return null;
  const result = await invoke<{
    status: string;
    output_tail: string;
  } | null>("orchestrator_get_status", { ptyId });
  if (!result) return null;
  return {
    ptyId,
    status: result.status,
    outputTail: result.output_tail,
  };
}

export function listenOrchestratorStatus(
  handler: (event: OrchestratorStatusEvent) => void
): Promise<UnlistenFn> {
  if (!isTauriRuntime()) {
    return Promise.resolve(() => {});
  }
  return listen<{
    pty_id: string;
    status: string;
    output_tail: string;
  }>("orchestrator-status", (e) => {
    handler({
      ptyId: e.payload.pty_id,
      status: e.payload.status,
      outputTail: e.payload.output_tail,
    });
  });
}
