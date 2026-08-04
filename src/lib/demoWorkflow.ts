import type { Edge, Node } from "@xyflow/react";
import {
  DEMO_LAYOUT,
  DEMO_MARKDOWN_CONTENT,
  DEMO_TERMINAL_PREVIEWS,
} from "../../shared/demo-layout";
import {
  createMarkdownNodeData,
  createSquareNodeData,
  createTerminalNodeData,
  createTextNodeData,
} from "./nodes";

/** Hardcoded hackathon demo: Markdown → Planner → parallel FE/BE */
export function createDemoWorkflow(): { nodes: Node[]; edges: Edge[] } {
  const { header, square, mdPlan, planner, fe, be } = DEMO_LAYOUT;

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
      id: "md-plan",
      type: "markdown",
      position: { x: mdPlan.x, y: mdPlan.y },
      style: { width: mdPlan.w, height: mdPlan.h },
      data: createMarkdownNodeData({
        title: "Plan",
        content: DEMO_MARKDOWN_CONTENT,
      }),
    },
    {
      id: "term-planner",
      type: "terminal",
      position: { x: planner.x, y: planner.y },
      style: { width: planner.w, height: planner.h },
      data: createTerminalNodeData({
        label: "Planner",
        herdrPaneId: "pane-planner",
        cwd: "/project",
        agentKind: "opencode",
        outputPreview: DEMO_TERMINAL_PREVIEWS.planner,
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
      id: "e-plan-planner",
      source: "md-plan",
      target: "term-planner",
      type: "handoff",
      label: "handoff",
      animated: true,
    },
    {
      id: "e-planner-fe",
      source: "term-planner",
      target: "term-fe",
      type: "handoff",
      label: "handoff",
      animated: true,
    },
    {
      id: "e-planner-be",
      source: "term-planner",
      target: "term-be",
      type: "handoff",
      label: "handoff",
      animated: true,
    },
  ];

  return { nodes, edges };
}
