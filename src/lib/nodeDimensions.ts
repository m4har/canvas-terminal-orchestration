import type { Node, NodeChange } from "@xyflow/react";
import { applyNodeChanges } from "@xyflow/react";
import type { SquareNodeData } from "./types";

export function applyCanvasNodeChanges(nodes: Node[], changes: NodeChange[]): Node[] {
  let next = applyNodeChanges(changes, nodes);

  for (const change of changes) {
    if (change.type !== "dimensions" || !change.dimensions) continue;

    next = next.map((node) => {
      if (node.id !== change.id) return node;

      const width = change.dimensions!.width;
      const height = change.dimensions!.height;
      const style = { ...node.style, width, height };

      if (node.type === "square") {
        const data = node.data as SquareNodeData;
        return {
          ...node,
          style,
          data: { ...data, width, height },
        };
      }

      return { ...node, style };
    });
  }

  return next;
}

export function sortNodesForRender(nodes: Node[]): Node[] {
  return [...nodes].sort((a, b) => {
    const za = a.zIndex ?? 0;
    const zb = b.zIndex ?? 0;
    return za - zb;
  });
}
