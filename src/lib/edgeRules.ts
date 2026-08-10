import type { Connection, Edge, Node } from "@xyflow/react";

export function isValidHandoffConnection(
  connection: Connection,
  sourceNode: Node | undefined,
  targetNode: Node | undefined
): boolean {
  const { source, target } = connection;
  if (!source || !target || source === target) return false;
  if (!sourceNode || !targetNode) return false;

  if (targetNode.type === "terminal") {
    if (sourceNode.type === "markdown") return true;
    if (sourceNode.type === "terminal") return true;
    if (sourceNode.type === "agent") return true;
    return false;
  }

  if (targetNode.type === "agent") {
    if (sourceNode.type === "markdown") return true;
    return false;
  }

  if (targetNode.type === "markdown") {
    if (sourceNode.type === "agent") return true;
    return false;
  }

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

export function findMirrorTerminalId(
  edges: Edge[],
  agentNodeId: string,
  nodes: Node[]
): string | undefined {
  const outgoing = edges.filter((e) => e.source === agentNodeId);
  for (const edge of outgoing) {
    const target = nodes.find((n) => n.id === edge.target);
    if (target?.type === "terminal") return edge.target;
  }
  return undefined;
}

export function findDownstreamMarkdownIds(
  edges: Edge[],
  agentNodeId: string,
  nodes: Node[]
): string[] {
  return edges
    .filter((e) => e.source === agentNodeId)
    .map((e) => nodes.find((n) => n.id === e.target))
    .filter((n): n is Node => n?.type === "markdown")
    .map((n) => n.id);
}
