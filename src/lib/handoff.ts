import type { Edge, Node } from "@xyflow/react";
import type { MarkdownNodeData, TerminalNodeData } from "./types";

export function buildHandoffPayload(
  source: Node | undefined,
  target: Node | undefined
): string {
  if (!source || !target) return "";

  if (source.type === "markdown") {
    const data = source.data as MarkdownNodeData;
    return `# ${data.title}\n\n${data.content}`;
  }

  if (source.type === "terminal") {
    const data = source.data as TerminalNodeData;
    const tail = data.outputPreview.split("\n").slice(-8).join("\n");
    return `Continue from upstream terminal (${data.label}):\n\n${tail}`;
  }

  return "";
}

export function findEdgeSource(
  edges: Edge[],
  targetId: string
): Edge | undefined {
  return edges.find((e) => e.target === targetId);
}
