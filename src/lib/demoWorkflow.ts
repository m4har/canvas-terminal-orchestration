import type { Edge, Node } from "@xyflow/react";
import {
  createMarkdownNodeData,
  createSquareNodeData,
  createTerminalNodeData,
  createTextNodeData,
} from "./nodes";

/** Hardcoded hackathon demo: Markdown → Planner → parallel FE/BE */
export function createDemoWorkflow(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [
    {
      id: "text-header",
      type: "text",
      position: { x: 60, y: 40 },
      style: { width: 220, height: 48 },
      data: createTextNodeData({ label: "Auth Refactor", fontSize: 24, fontWeight: "bold" }),
    },
    {
      id: "sq-auth",
      type: "square",
      position: { x: 40, y: 90 },
      zIndex: -1,
      dragHandle: ".square-drag-handle",
      style: { width: 720, height: 420 },
      data: createSquareNodeData({ width: 720, height: 420 }),
    },
    {
      id: "md-plan",
      type: "markdown",
      position: { x: 80, y: 130 },
      style: { width: 256, height: 200 },
      data: createMarkdownNodeData({
        title: "Plan",
        content:
          "# Auth Refactor Plan\n\nReference panes by id in handoff specs:\n\n- `pane-planner` → Planner terminal\n- `pane-fe` → FE (Pi)\n- `pane-be` → BE (OpenCode)\n\n## Steps\n\n1. Split login API (BE)\n2. Build login UI (FE)\n3. Wire JWT middleware\n\nHandoff this spec to Planner pane.",
      }),
    },
    {
      id: "term-planner",
      type: "terminal",
      position: { x: 420, y: 130 },
      style: { width: 288, height: 200 },
      data: createTerminalNodeData({
        label: "Planner",
        herdrPaneId: "pane-planner",
        cwd: "/project",
        agentKind: "opencode",
      }),
    },
    {
      id: "term-fe",
      type: "terminal",
      position: { x: 280, y: 320 },
      style: { width: 288, height: 200 },
      data: createTerminalNodeData({
        label: "FE (Pi)",
        herdrPaneId: "pane-fe",
        cwd: "/project/frontend",
        agentKind: "pi",
      }),
    },
    {
      id: "term-be",
      type: "terminal",
      position: { x: 520, y: 320 },
      style: { width: 288, height: 200 },
      data: createTerminalNodeData({
        label: "BE (OpenCode)",
        herdrPaneId: "pane-be",
        cwd: "/project/backend",
        agentKind: "opencode",
      }),
    },
  ];

  const edges: Edge[] = [
    { id: "e-plan-planner", source: "md-plan", target: "term-planner", type: "handoff" },
    { id: "e-planner-fe", source: "term-planner", target: "term-fe", type: "handoff" },
    { id: "e-planner-be", source: "term-planner", target: "term-be", type: "handoff" },
  ];

  return { nodes, edges };
}
