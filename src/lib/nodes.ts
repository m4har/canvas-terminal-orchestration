import type {
  CanvasNode,
  FlowNode,
  MarkdownNodeData,
  SquareNodeData,
  TerminalNodeData,
  TextNodeData,
} from "./types";

export function createTextNodeData(
  input: Pick<TextNodeData, "label"> & Partial<Pick<TextNodeData, "fontSize" | "fontWeight">>
): TextNodeData {
  return {
    label: input.label,
    fontSize: input.fontSize ?? 18,
    fontWeight: input.fontWeight,
  };
}

export function createSquareNodeData(
  input: Pick<SquareNodeData, "width" | "height"> &
    Partial<Pick<SquareNodeData, "strokeWidth" | "strokeStyle" | "strokeColor">>
): SquareNodeData {
  return {
    width: input.width,
    height: input.height,
    strokeWidth: input.strokeWidth ?? 2,
    strokeStyle: input.strokeStyle ?? "solid",
    strokeColor: input.strokeColor,
    fill: "none",
  };
}

export function createTerminalNodeData(
  input: Pick<TerminalNodeData, "label" | "herdrPaneId" | "cwd"> &
    Partial<Pick<TerminalNodeData, "status" | "agentKind" | "outputPreview" | "lastPrompt">>
): TerminalNodeData {
  return {
    label: input.label,
    herdrPaneId: input.herdrPaneId,
    cwd: input.cwd,
    status: input.status ?? "idle",
    agentKind: input.agentKind,
    outputPreview: input.outputPreview ?? "$ ready — start any agent via Herdr",
    lastPrompt: input.lastPrompt,
  };
}

export function createMarkdownNodeData(
  input: Partial<Pick<MarkdownNodeData, "title" | "content">>
): MarkdownNodeData {
  return {
    title: input.title ?? "Spec",
    content: input.content ?? "# Task\n\nDescribe the work here.",
  };
}

export function toFlowNode(node: CanvasNode): FlowNode {
  const flowNode: FlowNode = {
    id: node.id,
    type: node.type,
    position: node.position,
    data: node.data,
  };

  if (node.type === "square") {
    flowNode.zIndex = -1;
    const d = node.data as SquareNodeData;
    flowNode.style = { width: d.width, height: d.height };
  }

  return flowNode;
}
