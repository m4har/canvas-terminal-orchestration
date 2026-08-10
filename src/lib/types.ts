export type NodeType = "terminal" | "markdown" | "square" | "text" | "agent";

export type AgentStatus = "idle" | "working" | "blocked" | "done";

export interface TextNodeData {
  label: string;
  fontSize: number;
  fontWeight?: "normal" | "bold";
}

export interface SquareNodeData {
  width: number;
  height: number;
  strokeWidth: number;
  strokeStyle: "solid" | "dashed";
  strokeColor?: string;
  fill: "none";
}

export interface TerminalNodeData {
  label: string;
  herdrPaneId: string;
  cwd: string;
  status: AgentStatus;
  agentKind?: string;
  agentName?: string;
  outputPreview: string;
  lastPrompt?: string;
  ptyId?: string;
  herdrBound?: boolean;
}

export interface MarkdownNodeData {
  title: string;
  content: string;
  fontSize?: number;
}

export interface AgentNodeData {
  label: string;
  orchestraAgentId: string;
  orchestraAgentSlug?: string;
  profileId?: string;
  cwd: string;
  status: AgentStatus;
  lastResponsePreview?: string;
  streamingResponse?: string;
}

export interface CanvasNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data:
    | TextNodeData
    | SquareNodeData
    | TerminalNodeData
    | MarkdownNodeData
    | AgentNodeData
    | Record<string, unknown>;
}

export interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: unknown;
  zIndex?: number;
  style?: { width?: number; height?: number };
}
