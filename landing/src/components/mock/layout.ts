/** Fixed design canvas — positions in px, scaled to fit container width. */
export const CANVAS_W = 960;
export const CANVAS_H = 680;

export const DEMO_LAYOUT = {
  header: { x: 56, y: 28 },
  square: { x: 28, y: 64, w: 904, h: 592 },
  mdPlan: { x: 56, y: 108, w: 248, h: 210 },
  planner: { x: 392, y: 108, w: 272, h: 210 },
  fe: { x: 184, y: 388, w: 272, h: 210 },
  be: { x: 544, y: 388, w: 272, h: 210 },
} as const;

/** Handoff edge paths in CANVAS_W × CANVAS_H coordinate space. */
export const DEMO_EDGES = [
  "M 304 213 C 340 213, 360 213, 392 213",
  "M 528 318 C 528 350, 320 370, 320 388",
  "M 528 318 C 528 350, 680 370, 680 388",
] as const;
