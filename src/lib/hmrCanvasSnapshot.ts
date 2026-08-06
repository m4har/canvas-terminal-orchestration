import type { Edge, Node } from "@xyflow/react";

export type HmrCanvasSnapshot = {
  nodes: Node[];
  edges: Edge[];
  introActive: boolean;
};

let pending: HmrCanvasSnapshot | null = null;

export function setPendingHmrCanvasSnapshot(snapshot: HmrCanvasSnapshot) {
  pending = snapshot;
}

export function takePendingHmrCanvasSnapshot(): HmrCanvasSnapshot | null {
  const snapshot = pending;
  pending = null;
  return snapshot;
}
