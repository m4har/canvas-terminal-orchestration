import { useCallback, useEffect, useState } from "react";
import { useCanvasStore } from "../../stores/canvasStore";

const MODAL_STEPS = [
  {
    title: "Canvas Orchestra",
    body: "A visual orchestration layer for AI coding agents. Layout workflows on a canvas and route work between agents via Herdr.",
  },
  {
    title: "Node types",
    body: "MarkdownNode holds specs and context. TerminalNode runs agents in a PTY. Square frames group areas. Text labels sections.",
  },
  {
    title: "Handoff",
    body: "Connect nodes with handoff edges. Compose a prompt in the dialog, then send it to the downstream agent pane.",
  },
] as const;

const SPOTLIGHT_STEPS = [
  {
    nodeId: "md-plan",
    title: "MarkdownNode — Plan",
    body: "Upstream specs live here. Handoff sends this content to downstream TerminalNodes.",
  },
  {
    nodeId: "term-planner",
    title: "TerminalNode — Planner",
    body: "Agents run in terminal panes. This demo shows mock output — no live Herdr required.",
  },
  {
    nodeId: "term-fe",
    title: "Fan-out handoff",
    body: "One planner can hand off to parallel branches (FE and BE). Edges show the routing path.",
  },
] as const;

function findNodeRect(nodeId: string): DOMRect | null {
  const el = document.querySelector(
    `.react-flow__node[data-id="${nodeId}"]`
  );
  return el?.getBoundingClientRect() ?? null;
}

export function IntroOverlay() {
  const introActive = useCanvasStore((state) => state.introActive);
  const completeIntro = useCanvasStore((state) => state.completeIntro);
  const [step, setStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);

  const modalPhase = step < MODAL_STEPS.length;
  const spotlightPhase =
    step >= MODAL_STEPS.length &&
    step < MODAL_STEPS.length + SPOTLIGHT_STEPS.length;
  const finalPhase = step >= MODAL_STEPS.length + SPOTLIGHT_STEPS.length;

  const updateSpotlight = useCallback(() => {
    if (!spotlightPhase) {
      setSpotlightRect(null);
      return;
    }
    const spotlightIndex = step - MODAL_STEPS.length;
    const nodeId = SPOTLIGHT_STEPS[spotlightIndex]?.nodeId;
    if (!nodeId) return;
    setSpotlightRect(findNodeRect(nodeId));
  }, [spotlightPhase, step]);

  useEffect(() => {
    if (!introActive) return;
    updateSpotlight();
    const onResize = () => updateSpotlight();
    window.addEventListener("resize", onResize);
    const timer = window.setInterval(updateSpotlight, 300);
    return () => {
      window.removeEventListener("resize", onResize);
      window.clearInterval(timer);
    };
  }, [introActive, updateSpotlight]);

  if (!introActive) return null;

  const spotlightIndex = step - MODAL_STEPS.length;
  const spotlight = SPOTLIGHT_STEPS[spotlightIndex];
  const modal = MODAL_STEPS[step];

  return (
    <div className="fixed inset-0 z-[55] pointer-events-none">
      {spotlightPhase && (
        <>
          <div
            className="fixed inset-0 z-[55] bg-black/65 pointer-events-auto"
            aria-hidden
          />
          {spotlightRect && (
            <div
              className="fixed z-[56] rounded-md ring-2 ring-[var(--accent)] pointer-events-none"
              style={{
                left: spotlightRect.left - 4,
                top: spotlightRect.top - 4,
                width: spotlightRect.width + 8,
                height: spotlightRect.height + 8,
              }}
            />
          )}
          <div
            className={`fixed z-[57] max-w-sm rounded-lg border border-[var(--border)] bg-[var(--background)] p-4 shadow-xl pointer-events-auto ${
              spotlightRect ? "" : "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            }`}
            style={
              spotlightRect
                ? {
                    left: Math.min(spotlightRect.left, window.innerWidth - 320),
                    top: Math.min(spotlightRect.bottom + 12, window.innerHeight - 180),
                  }
                : undefined
            }
            role="dialog"
            aria-label="Intro spotlight"
          >
            <h2 className="mb-2 text-sm font-semibold">{spotlight.title}</h2>
            <p className="text-sm text-[var(--muted-foreground)]">{spotlight.body}</p>
            <div className="mt-4 flex justify-between gap-2">
              <button
                type="button"
                className="rounded-md px-3 py-1.5 text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                onClick={() => setStep((s) => s - 1)}
              >
                Back
              </button>
              <button
                type="button"
                data-testid="intro-next"
                className="rounded-md bg-[var(--foreground)] px-3 py-1.5 text-sm text-[var(--background)]"
                onClick={() => setStep((s) => s + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {modalPhase && (
        <div
          className="fixed inset-0 z-[57] flex items-center justify-center bg-black/40 p-4 pointer-events-auto"
          role="dialog"
          aria-label="Intro"
        >
          <div className="w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--background)] p-4 shadow-xl">
            <h2 className="mb-2 text-sm font-semibold">{modal.title}</h2>
            <p className="text-sm text-[var(--muted-foreground)]">{modal.body}</p>
            <div className="mt-4 flex justify-between gap-2">
              {step > 0 ? (
                <button
                  type="button"
                  className="rounded-md px-3 py-1.5 text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                  onClick={() => setStep((s) => s - 1)}
                >
                  Back
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                data-testid="intro-next"
                className="rounded-md bg-[var(--foreground)] px-3 py-1.5 text-sm text-[var(--background)]"
                onClick={() => setStep((s) => s + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {finalPhase && (
        <div
          className="fixed inset-0 z-[57] flex items-center justify-center bg-black/40 p-4 pointer-events-auto"
          role="dialog"
          aria-label="Intro complete"
        >
          <div className="w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--background)] p-4 shadow-xl">
            <h2 className="mb-2 text-sm font-semibold">Ready to start</h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              Keep the Auth Refactor demo as a reference, or start with a blank canvas.
            </p>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                data-testid="intro-start-blank"
                className="rounded-md px-3 py-1.5 text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                onClick={() => completeIntro(false)}
              >
                Start blank
              </button>
              <button
                type="button"
                data-testid="intro-keep-demo"
                className="rounded-md bg-[var(--foreground)] px-3 py-1.5 text-sm text-[var(--background)]"
                onClick={() => completeIntro(true)}
              >
                Keep this demo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
