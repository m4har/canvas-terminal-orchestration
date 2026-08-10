import type {
  AgentNodeData,
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
  input: Pick<TerminalNodeData, "label" | "cwd"> &
    Partial<
      Pick<
        TerminalNodeData,
        | "herdrPaneId"
        | "status"
        | "agentKind"
        | "outputPreview"
        | "lastPrompt"
        | "ptyId"
        | "herdrBound"
      >
    >
): TerminalNodeData {
  return {
    label: input.label,
    herdrPaneId: input.herdrPaneId ?? "",
    cwd: input.cwd,
    status: input.status ?? "idle",
    agentKind: input.agentKind,
    outputPreview: input.outputPreview ?? "$ local shell — bind Herdr when ready",
    lastPrompt: input.lastPrompt,
    ptyId: input.ptyId,
    herdrBound: input.herdrBound ?? false,
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

export function createAgentNodeData(
  input: Pick<AgentNodeData, "label" | "orchestraAgentId" | "cwd"> &
    Partial<
      Pick<
        AgentNodeData,
        | "orchestraAgentSlug"
        | "profileId"
        | "status"
        | "lastResponsePreview"
        | "streamingResponse"
      >
    >
): AgentNodeData {
  return {
    label: input.label,
    orchestraAgentId: input.orchestraAgentId,
    orchestraAgentSlug: input.orchestraAgentSlug,
    profileId: input.profileId,
    cwd: input.cwd,
    status: input.status ?? "idle",
    lastResponsePreview: input.lastResponsePreview,
    streamingResponse: input.streamingResponse,
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
