import { useEffect } from "react";
import {
  listenOrchestraAgentChunk,
  listenOrchestraAgentStatus,
} from "../lib/orchestra/client";
import { useCanvasStore } from "../stores/canvasStore";
import type { AgentNodeData } from "../lib/types";

export function useOrchestraAgentStatus() {
  const updateAgentNode = useCanvasStore((s) => s.updateAgentNode);
  const writeAgentOutputToMarkdown = useCanvasStore((s) => s.writeAgentOutputToMarkdown);

  useEffect(() => {
    let unlistenChunk: (() => void) | undefined;
    let unlistenStatus: (() => void) | undefined;

    void listenOrchestraAgentChunk(({ nodeId, chunk }) => {
      const node = useCanvasStore.getState().nodes.find((n) => n.id === nodeId);
      if (!node || node.type !== "agent") return;
      const data = node.data as AgentNodeData;
      updateAgentNode(nodeId, {
        streamingResponse: (data.streamingResponse ?? "") + chunk,
        status: "working",
      });
    }).then((fn) => {
      unlistenChunk = fn;
    });

    void listenOrchestraAgentStatus(({ nodeId, status, fullResponse }) => {
      const patch: Partial<AgentNodeData> = {
        status: status as AgentNodeData["status"],
      };
      if (fullResponse) {
        patch.lastResponsePreview = fullResponse.slice(0, 500);
        patch.streamingResponse = "";
        if (status === "done") {
          writeAgentOutputToMarkdown(nodeId, fullResponse);
        }
      }
      updateAgentNode(nodeId, patch);
    }).then((fn) => {
      unlistenStatus = fn;
    });

    return () => {
      unlistenChunk?.();
      unlistenStatus?.();
    };
  }, [updateAgentNode, writeAgentOutputToMarkdown]);
}
