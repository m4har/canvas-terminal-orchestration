import type { Edge, Node } from "@xyflow/react";
import {
  DEMO_AGENT_PREVIEW,
  DEMO_LAYOUT,
  DEMO_MARKDOWN_CONTENT,
  DEMO_TERMINAL_PREVIEWS,
} from "../../shared/demo-layout";
import {
  createAgentNodeData,
  createMarkdownNodeData,
  createSquareNodeData,
  createTerminalNodeData,
  createTextNodeData,
} from "./nodes";

/** Demo: Spec → Planner Agent → terminal mirror → parallel FE/BE */
export function createDemoWorkflow(): { nodes: Node[]; edges: Edge[] } {
  const { header, square, mdPlan, agentPlanner, implement, fe, be } = DEMO_LAYOUT;

  const nodes: Node[] = [
    {
      id: "text-header",
      type: "text",
      position: { x: header.x, y: header.y },
      style: { width: header.w, height: header.h },
      data: createTextNodeData({
        label: "Auth Refactor",
        fontSize: 18,
        fontWeight: "bold",
      }),
    },
    {
      id: "sq-auth",
      type: "square",
      position: { x: square.x, y: square.y },
      zIndex: -1,
      dragHandle: ".square-drag-handle",
      style: { width: square.w, height: square.h },
      data: createSquareNodeData({
        width: square.w,
        height: square.h,
        strokeStyle: "dashed",
      }),
    },
    {
      id: "md-spec",
      type: "markdown",
      position: { x: mdPlan.x, y: mdPlan.y },
      style: { width: mdPlan.w, height: mdPlan.h },
      data: createMarkdownNodeData({
        title: "Spec",
        content: DEMO_MARKDOWN_CONTENT,
      }),
    },
    {
      id: "agent-planner",
      type: "agent",
      position: { x: agentPlanner.x, y: agentPlanner.y },
      style: { width: agentPlanner.w, height: agentPlanner.h },
      data: createAgentNodeData({
        label: "Planner",
        orchestraAgentId: "demo-planner",
        orchestraAgentSlug: "planner",
        profileId: "planner",
        cwd: "/project",
        status: "done",
        lastResponsePreview: DEMO_AGENT_PREVIEW,
      }),
    },
    {
      id: "term-implement",
      type: "terminal",
      position: { x: implement.x, y: implement.y },
      style: { width: implement.w, height: implement.h },
      data: createTerminalNodeData({
        label: "Implement (Claude)",
        herdrPaneId: "pane-implement",
        cwd: "/project",
        agentKind: "claude",
        outputPreview: DEMO_TERMINAL_PREVIEWS.implement,
      }),
    },
    {
      id: "term-fe",
      type: "terminal",
      position: { x: fe.x, y: fe.y },
      style: { width: fe.w, height: fe.h },
      data: createTerminalNodeData({
        label: "FE (Pi)",
        herdrPaneId: "pane-fe",
        cwd: "/project/frontend",
        agentKind: "pi",
        outputPreview: DEMO_TERMINAL_PREVIEWS.fe,
      }),
    },
    {
      id: "term-be",
      type: "terminal",
      position: { x: be.x, y: be.y },
      style: { width: be.w, height: be.h },
      data: createTerminalNodeData({
        label: "BE (OpenCode)",
        herdrPaneId: "pane-be",
        cwd: "/project/backend",
        agentKind: "opencode",
        outputPreview: DEMO_TERMINAL_PREVIEWS.be,
      }),
    },
  ];

  const edges: Edge[] = [
    {
      id: "e-spec-planner",
      source: "md-spec",
      target: "agent-planner",
      type: "handoff",
      label: "handoff",
      animated: true,
    },
    {
      id: "e-planner-implement",
      source: "agent-planner",
      target: "term-implement",
      type: "handoff",
      label: "handoff",
      animated: true,
    },
    {
      id: "e-implement-fe",
      source: "term-implement",
      target: "term-fe",
      type: "handoff",
      label: "handoff",
      animated: true,
    },
    {
      id: "e-implement-be",
      source: "term-implement",
      target: "term-be",
      type: "handoff",
      label: "handoff",
      animated: true,
    },
  ];

  return { nodes, edges };
}
