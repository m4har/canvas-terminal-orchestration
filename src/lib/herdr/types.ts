import type { AgentStatus } from "../types";

export interface HerdrError {
  code: string;
  message: string;
}

export interface HerdrEnvelope<T> {
  id: string;
  result?: T;
  error?: HerdrError;
}

export interface HerdrPane {
  pane_id: string;
  workspace_id: string;
  tab_id: string;
  cwd: string;
  agent_status: AgentStatus | "unknown";
  focused: boolean;
}

export interface WorkspaceCreatedResult {
  type: "workspace_created";
  workspace: {
    workspace_id: string;
    label: string;
    root_pane_id?: string;
    active_tab_id: string;
  };
  root_pane: HerdrPane;
}

export interface WorkspaceListResult {
  type: "workspace_list";
  workspaces: Array<{
    workspace_id: string;
    label: string;
    active_tab_id: string;
    pane_count: number;
  }>;
}

export interface PaneListResult {
  panes: HerdrPane[];
}

export interface PaneSplitResult {
  type: "pane_info";
  pane: HerdrPane;
}

export interface AgentListResult {
  type: "agent_list";
  agents: Array<{
    agent: string;
    pane_id: string;
    workspace_id: string;
    agent_status: AgentStatus | "unknown";
    cwd: string;
  }>;
}

export interface AgentPromptResult {
  type?: string;
  agent_status?: AgentStatus | "unknown";
}

export const CANVAS_WORKSPACE_LABEL = "canvas-orchestra";
