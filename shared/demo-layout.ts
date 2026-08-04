/** Auth Refactor demo canvas — shared by app demoWorkflow and landing mock. */
export const DEMO_CANVAS_W = 960;
export const DEMO_CANVAS_H = 680;

export const DEMO_LAYOUT = {
  header: { x: 56, y: 28, w: 280, h: 40 },
  square: { x: 28, y: 64, w: 904, h: 592 },
  mdPlan: { x: 56, y: 108, w: 248, h: 210 },
  planner: { x: 392, y: 108, w: 272, h: 210 },
  fe: { x: 184, y: 388, w: 272, h: 210 },
  be: { x: 544, y: 388, w: 272, h: 210 },
} as const;

/** Handoff edge paths in DEMO_CANVAS_W × DEMO_CANVAS_H space (landing SVG mock). */
export const DEMO_EDGE_PATHS = [
  "M 304 213 C 340 213, 360 213, 392 213",
  "M 528 318 C 528 350, 320 370, 320 388",
  "M 528 318 C 528 350, 680 370, 680 388",
] as const;

export const DEMO_MARKDOWN_CONTENT = `# Auth Refactor Plan

Reference panes by id:

- \`pane-planner\` → Planner
- \`pane-fe\` → FE (Pi)
- \`pane-be\` → BE (OpenCode)

## Steps

1. Split login API (BE)
2. Build login UI (FE)`;

export const DEMO_TERMINAL_PREVIEWS = {
  planner: [
    "$ herdr agent start opencode --kind planner",
    "Reading Auth Refactor Plan...",
    "Splitting tasks: FE login UI, BE JWT API",
    "Handing off to pane-fe and pane-be",
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
