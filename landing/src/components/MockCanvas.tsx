import { Reveal } from "./motion/Reveal";
import { MockToolbar } from "./mock/MockToolbar";
import { MockSquare } from "./mock/MockSquare";
import { MockMarkdownNode } from "./mock/MockMarkdownNode";
import { MockTerminalNode } from "./mock/MockTerminalNode";
import { MockHandoffEdge, MockEdgeDefs } from "./mock/MockHandoffEdge";

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

export function MockCanvas() {
  return (
    <section id="demo" className="py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal>
          <div className="mb-10 max-w-xl">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--accent)]">
              Live simulation
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tighter md:text-4xl">
              Auth Refactor workflow
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
              A real layout from the demo canvas — status badges cycle, terminal
              output streams, handoff edges pulse.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="glass-panel scanline relative overflow-hidden rounded-[2rem] p-1">
            <div className="pointer-events-none absolute inset-x-8 top-0 z-20 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/60 to-transparent" />
            <MockToolbar />
            <div
              className="relative w-full"
              style={{
                aspectRatio: "800 / 540",
                backgroundColor: "var(--canvas-bg)",
                backgroundImage:
                  "radial-gradient(circle, var(--canvas-dot) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            >
              <p
                className="absolute font-semibold"
                style={{
                  left: "7.5%",
                  top: "7.4%",
                  fontSize: "clamp(14px, 2.5vw, 20px)",
                }}
              >
                Auth Refactor
              </p>

              <MockSquare
                style={{ left: "5%", top: "16.7%", width: "90%", height: "77.8%" }}
              />

              <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                viewBox="0 0 800 540"
                preserveAspectRatio="none"
              >
                <MockEdgeDefs />
                <MockHandoffEdge d="M 336 230 C 370 230, 390 230, 420 230" />
                <MockHandoffEdge
                  d="M 564 280 C 564 300, 424 310, 424 320"
                  delay={0.3}
                />
                <MockHandoffEdge
                  d="M 564 280 C 564 300, 520 310, 520 320"
                  delay={0.6}
                />
              </svg>

              <MockMarkdownNode
                style={{ left: "10%", top: "24%", width: "32%", height: "37%" }}
              />

              <MockTerminalNode
                label="Planner"
                paneId="pane-planner"
                lines={PLANNER_LINES}
                delayMs={0}
                style={{ left: "52.5%", top: "24%", width: "36%", height: "37%" }}
              />

              <MockTerminalNode
                label="FE (Pi)"
                paneId="pane-fe"
                lines={FE_LINES}
                delayMs={1200}
                style={{ left: "35%", top: "59%", width: "36%", height: "37%" }}
              />

              <MockTerminalNode
                label="BE (OpenCode)"
                paneId="pane-be"
                lines={BE_LINES}
                delayMs={2400}
                style={{ left: "65%", top: "59%", width: "36%", height: "37%" }}
              />
            </div>
          </div>
        </Reveal>

        <p className="mt-4 pl-1 font-mono text-[10px] text-[var(--muted-foreground)]">
          demo-workflow.ts · MarkdownNode → Planner → parallel FE / BE
        </p>
      </div>
    </section>
  );
}
