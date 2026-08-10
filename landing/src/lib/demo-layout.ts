/** Auth Refactor orchestration demo — shared by app demoWorkflow and landing mock. */
export const DEMO_CANVAS_W = 960;
export const DEMO_CANVAS_H = 680;

export const DEMO_LAYOUT = {
  header: { x: 56, y: 28, w: 280, h: 40 },
  square: { x: 28, y: 64, w: 904, h: 592 },
  mdPlan: { x: 56, y: 108, w: 220, h: 210 },
  agentPlanner: { x: 300, y: 108, w: 240, h: 210 },
  implement: { x: 564, y: 108, w: 240, h: 210 },
  fe: { x: 184, y: 388, w: 272, h: 210 },
  be: { x: 544, y: 388, w: 272, h: 210 },
} as const;

/** Handoff edge paths in DEMO_CANVAS_W × DEMO_CANVAS_H space (landing SVG mock). */
export const DEMO_EDGE_PATHS = [
  "M 276 213 C 288 213, 294 213, 300 213",
  "M 540 213 C 548 213, 556 213, 564 213",
  "M 684 318 C 684 350, 320 370, 320 388",
  "M 684 318 C 684 350, 680 370, 680 388",
] as const;

export const DEMO_MARKDOWN_CONTENT = `# Auth Refactor Spec

Upstream context for OrchestraAgent Play.

## Scope

1. Split login API (BE)
2. Build login UI (FE)

## Acceptance

- JWT middleware on /api/v2/auth
- Login form with useAuth hook`;

export const DEMO_AGENT_PREVIEW = [
  "Reading Auth Refactor Spec...",
  "Tasks: FE login UI, BE JWT API",
  "Mirror plan to pane-implement",
  "Ready for parallel handoff",
].join("\n");

export const DEMO_TERMINAL_PREVIEWS = {
  implement: [
    "[mirror] orchestra_agent_play planner",
    "Plan received from AgentNode",
    "Routing to pane-fe and pane-be",
  ].join("\n"),
  fe: [
    "$ herdr agent start pi --kind fe",
    "Building login form component...",
    "Added useAuth hook",
  ].join("\n"),
  be: [
    "$ herdr agent start opencode --kind be",
    "Splitting login API route...",
    "JWT middleware wired",
  ].join("\n"),
} as const;
