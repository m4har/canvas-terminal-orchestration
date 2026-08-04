import { Reveal } from "./motion/Reveal";
import { MockToolbar } from "./mock/MockToolbar";
import { MockSquare } from "./mock/MockSquare";
import { MockMarkdownNode } from "./mock/MockMarkdownNode";
import { MockTerminalNode } from "./mock/MockTerminalNode";
import { MockHandoffEdge, MockEdgeDefs } from "./mock/MockHandoffEdge";
import { MockCanvasStage } from "./mock/MockCanvasStage";
import { CANVAS_W, CANVAS_H, DEMO_LAYOUT, DEMO_EDGES } from "./mock/layout";

const PLANNER_LINES = [
  "$ herdr agent start opencode --kind planner",
  "Reading Auth Refactor Plan...",
  "Splitting tasks: FE login UI, BE JWT API",
  "Handing off to pane-fe and pane-be",
];

const FE_LINES = [
  "$ herdr agent start pi --kind fe",
  "Building login form component...",
  "Added useAuth hook",
];

const BE_LINES = [
  "$ herdr agent start opencode --kind be",
  "Splitting login API route...",
  "JWT middleware wired",
];

function pxBox(box: { x: number; y: number; w: number; h: number }) {
  return {
    left: box.x,
    top: box.y,
    width: box.w,
    height: box.h,
  };
}

export function MockCanvas() {
  return (
    <section id="demo" className="py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal>
          <div className="mb-10 max-w-xl">
            <h2 className="text-3xl font-semibold tracking-tighter md:text-4xl">
              Auth Refactor workflow
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
              A real layout from the demo canvas. Status badges cycle, terminal
              output streams, handoff edges pulse.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="glass-panel scanline relative overflow-hidden rounded-[2rem] p-1">
            <div className="pointer-events-none absolute inset-x-8 top-0 z-20 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/60 to-transparent" />
            <MockToolbar />
            <MockCanvasStage width={CANVAS_W} height={CANVAS_H}>
              <div
                className="relative"
                style={{
                  width: CANVAS_W,
                  height: CANVAS_H,
                  backgroundColor: "var(--canvas-bg)",
                  backgroundImage:
                    "radial-gradient(circle, var(--canvas-dot) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              >
                <p
                  className="absolute text-lg font-semibold"
                  style={{
                    left: DEMO_LAYOUT.header.x,
                    top: DEMO_LAYOUT.header.y,
                  }}
                >
                  Auth Refactor
                </p>

                <MockSquare style={pxBox(DEMO_LAYOUT.square)} />

                <svg
                  className="pointer-events-none absolute inset-0"
                  width={CANVAS_W}
                  height={CANVAS_H}
                  viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
                >
                  <MockEdgeDefs />
                  {DEMO_EDGES.map((d, i) => (
                    <MockHandoffEdge key={d} d={d} delay={i * 0.3} />
                  ))}
                </svg>

                <MockMarkdownNode style={pxBox(DEMO_LAYOUT.mdPlan)} />

                <MockTerminalNode
                  label="Planner"
                  paneId="pane-planner"
                  lines={PLANNER_LINES}
                  delayMs={0}
                  style={pxBox(DEMO_LAYOUT.planner)}
                />

                <MockTerminalNode
                  label="FE (Pi)"
                  paneId="pane-fe"
                  lines={FE_LINES}
                  delayMs={1200}
                  style={pxBox(DEMO_LAYOUT.fe)}
                />

                <MockTerminalNode
                  label="BE (OpenCode)"
                  paneId="pane-be"
                  lines={BE_LINES}
                  delayMs={2400}
                  style={pxBox(DEMO_LAYOUT.be)}
                />
              </div>
            </MockCanvasStage>
          </div>
        </Reveal>

        <p className="mt-4 pl-1 font-mono text-[10px] text-[var(--muted-foreground)]">
          demo-workflow.ts · MarkdownNode → Planner → parallel FE / BE
        </p>
      </div>
    </section>
  );
}
