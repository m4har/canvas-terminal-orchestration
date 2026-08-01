import type { Connection, Edge, Node } from "@xyflow/react";

export function isValidHandoffConnection(
  connection: Connection,
  sourceNode: Node | undefined,
  targetNode: Node | undefined
): boolean {
  const { source, target } = connection;
  if (!source || !target || source === target) return false;
  if (!sourceNode || !targetNode) return false;

  if (targetNode.type !== "terminal") return false;

  if (sourceNode.type === "markdown") return true;
  if (sourceNode.type === "terminal") return true;

  return false;
}

export function hasDuplicateEdge(edges: Edge[], source: string, target: string): boolean {
  return edges.some((e) => e.source === source && e.target === target);
}

export function hasIncomingEdge(edges: Edge[], targetId: string): boolean {
  return edges.some((e) => e.target === targetId);
}

export function canAddHandoffEdge(
  connection: Connection,
  edges: Edge[],
  sourceNode: Node | undefined,
  targetNode: Node | undefined
): boolean {
  const { source, target } = connection;
  if (!source || !target) return false;
  if (!isValidHandoffConnection(connection, sourceNode, targetNode)) return false;
  if (hasDuplicateEdge(edges, source, target)) return false;
  if (hasIncomingEdge(edges, target)) return false;
  return true;
}

export function createHandoffEdge(connection: Connection): Edge {
  return {
    id: `e-${connection.source}-${connection.target}`,
    source: connection.source!,
    target: connection.target!,
    type: "handoff",
    label: "handoff",
    animated: true,
  };
}
