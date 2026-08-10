import { useEffect } from "react";
import { isLocalShell } from "../lib/herdr/bind";
import { listenOrchestratorStatus } from "../lib/orchestrator/client";
import { isAutomationMode } from "../lib/runtimeFlags";
import type { AgentStatus, TerminalNodeData } from "../lib/types";
import { isTauriRuntime } from "../lib/workflow";
import { useCanvasStore } from "../stores/canvasStore";

export function useOrchestratorStatus() {
  useEffect(() => {
    if (!isTauriRuntime() || isAutomationMode()) return;

    let unlisten: (() => void) | undefined;

    void listenOrchestratorStatus((event) => {
      const { nodes, updateTerminalNode } = useCanvasStore.getState();
      for (const node of nodes) {
        if (node.type !== "terminal") continue;
        const data = node.data as TerminalNodeData;
        if (!isLocalShell(data) || data.ptyId !== event.ptyId) continue;
        updateTerminalNode(node.id, {
          status: event.status as AgentStatus,
          outputPreview: event.outputTail || data.outputPreview,
        });
      }
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      unlisten?.();
    };
  }, []);
}
