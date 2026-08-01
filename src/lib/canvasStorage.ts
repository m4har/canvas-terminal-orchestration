import type { Edge, Node } from "@xyflow/react";
import { flowToSnapshot, snapshotToFlow } from "./canvasSerde";

const storageKey = (workflowId: string) => `canvas-orchestra:${workflowId}`;

export function loadCanvasFromStorage(workflowId: string): {
  nodes: Node[];
  edges: Edge[];
} {
  try {
    const raw = localStorage.getItem(storageKey(workflowId));
    if (!raw) return { nodes: [], edges: [] };
    const snapshot = JSON.parse(raw) as ReturnType<typeof flowToSnapshot>;
    return snapshotToFlow(snapshot);
  } catch {
    return { nodes: [], edges: [] };
  }
}

export function saveCanvasToStorage(
  workflowId: string,
  nodes: Node[],
  edges: Edge[]
): void {
  localStorage.setItem(storageKey(workflowId), JSON.stringify(flowToSnapshot(nodes, edges)));
}
