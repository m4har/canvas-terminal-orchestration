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
    <section className="mx-auto max-w-6xl px-6 pb-20">
      <div className="overflow-hidden rounded-xl border border-[var(--border)] shadow-2xl">
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
          {/* Text header */}
          <p
            className="absolute font-semibold"
            style={{ left: "7.5%", top: "7.4%", fontSize: "clamp(14px, 2.5vw, 20px)" }}
          >
            Auth Refactor
          </p>

          <MockSquare
            style={{ left: "5%", top: "16.7%", width: "90%", height: "77.8%" }}
          />

          {/* Handoff edges */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 800 540"
            preserveAspectRatio="none"
          >
            <MockEdgeDefs />
            <MockHandoffEdge d="M 336 230 C 370 230, 390 230, 420 230" />
            <MockHandoffEdge d="M 564 280 C 564 300, 424 310, 424 320" delay={0.3} />
            <MockHandoffEdge d="M 564 280 C 564 300, 520 310, 520 320" delay={0.6} />
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
      <p className="mt-4 text-center text-xs text-[var(--muted-foreground)]">
        Live mock — Auth Refactor workflow from the demo canvas
      </p>
    </section>
  );
}
