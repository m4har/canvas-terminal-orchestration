import { motion } from "framer-motion";
import { GithubLogo, ArrowRight, Terminal } from "@phosphor-icons/react";
import { GITHUB_URL } from "../lib/constants";

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

export function Hero() {
  return (
    <section className="relative min-h-[100dvh] overflow-hidden pt-28 pb-16">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div className="flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...spring, delay: 0.1 }}
            className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--muted)]/40 px-3 py-1"
          >
            <Terminal size={12} className="text-[var(--accent)]" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">
              Herdr-powered orchestration
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.2 }}
            className="text-4xl font-semibold tracking-tighter leading-none md:text-6xl"
          >
            Orchestrate agents.
            <br />
            <span className="text-[var(--muted-foreground)]">Play</span>
            <br />
            with one click.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.35 }}
            className="mt-6 max-w-[48ch] text-base leading-relaxed text-[var(--muted-foreground)]"
          >
            Canvastor is a visual workflow canvas for AI coding agents.
            Configure AgentProfiles and skills, run OrchestraAgents headless, and
            route specs downstream.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.5 }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-foreground)]"
            >
              <GithubLogo size={18} weight="fill" />
              View on GitHub
            </a>
            <a
              href="#demo"
              className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--accent)]"
            >
              Watch demo
              <ArrowRight size={14} />
            </a>
          </motion.div>

          <motion.dl
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...spring, delay: 0.65 }}
            className="mt-12 grid grid-cols-3 gap-6 border-t border-[var(--border)] pt-8"
          >
            {[
              { label: "Node types", value: "5" },
              { label: "Bundled profiles", value: "7" },
              { label: "Runtime", value: "Tauri" },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="font-mono text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">
                  {label}
                </dt>
                <dd className="mt-1 font-mono text-2xl font-medium tracking-tight text-[var(--accent)]">
                  {value}
                </dd>
              </div>
            ))}
          </motion.dl>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40, rotateX: 8 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ ...spring, delay: 0.3 }}
          className="animate-float relative perspective-[1200px] lg:pl-8"
        >
          <div className="glass-panel scanline relative overflow-hidden rounded-[2rem] p-1">
            <div className="absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-60" />
            <div
              className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.85rem]"
              style={{
                backgroundColor: "var(--canvas-bg)",
                backgroundImage:
                  "radial-gradient(circle, var(--canvas-dot) 1px, transparent 1px)",
                backgroundSize: "16px 16px",
              }}
            >
              <HeroMiniCanvas />
            </div>
          </div>
          <p className="mt-4 pl-2 font-mono text-[10px] text-[var(--muted-foreground)]">
            auth-refactor.workflow · spec → agent → terminal
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function HeroMiniCanvas() {
  const nodes = [
    { label: "Spec", x: "6%", y: "15%", w: "26%", h: "35%", type: "md" },
    { label: "Planner", x: "36%", y: "15%", w: "26%", h: "35%", type: "agent", status: "working" },
    { label: "Implement", x: "66%", y: "15%", w: "28%", h: "35%", type: "term", status: "idle" },
    { label: "FE (Pi)", x: "18%", y: "58%", w: "32%", h: "32%", type: "term", status: "idle" },
    { label: "BE", x: "56%", y: "58%", w: "32%", h: "32%", type: "term", status: "done" },
  ];

  return (
    <>
      <div
        className="absolute rounded-sm border border-dashed border-[var(--border)]"
        style={{ left: "5%", top: "10%", width: "90%", height: "82%" }}
      />
      <p
        className="absolute text-xs font-semibold"
        style={{ left: "8%", top: "5%" }}
      >
        Auth Refactor
      </p>
      {nodes.map((n) => (
        <div
          key={n.label}
          className="absolute overflow-hidden rounded-md border border-[var(--border)] bg-[var(--node-fill)]"
          style={{ left: n.x, top: n.y, width: n.w, height: n.h }}
        >
          <div className="flex items-center gap-1.5 border-b border-[var(--border)] px-2 py-1">
            {n.type === "agent" ? (
              <span className="text-[8px] text-[var(--muted-foreground)]">◇</span>
            ) : (
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  n.status === "working"
                    ? "bg-[var(--status-working)] animate-pulse-ring"
                    : n.status === "done"
                      ? "bg-[var(--status-done)]"
                      : "bg-[var(--status-idle)]"
                }`}
              />
            )}
            <span className="text-[9px] font-medium">{n.label}</span>
            {n.type === "agent" && (
              <span className="ml-auto rounded bg-[var(--muted)] px-1 font-mono text-[6px] text-[var(--muted-foreground)]">
                planner
              </span>
            )}
          </div>
          {n.type === "md" ? (
            <div className="p-1.5 font-mono text-[7px] leading-relaxed text-[var(--muted-foreground)]">
              <p># Auth Refactor</p>
              <p className="mt-0.5">1. Split login API</p>
              <p>2. Build login UI</p>
            </div>
          ) : n.type === "agent" ? (
            <div className="p-1.5 font-mono text-[7px] text-[var(--muted-foreground)]">
              <p>Reading spec...</p>
              <p>Tasks: FE, BE</p>
            </div>
          ) : (
            <div className="p-1.5 font-mono text-[7px] text-[var(--muted-foreground)]">
              <p>$ herdr agent start...</p>
            </div>
          )}
        </div>
      ))}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 400 300">
        <path
          d="M 128 97 C 136 97, 140 97, 144 97"
          fill="none"
          stroke="var(--edge-stroke)"
          strokeWidth="1"
          strokeDasharray="4 3"
          className="animate-dash-flow"
        />
        <path
          d="M 248 97 C 254 97, 258 97, 264 97"
          fill="none"
          stroke="var(--edge-stroke)"
          strokeWidth="1"
          strokeDasharray="4 3"
          className="animate-dash-flow"
          style={{ animationDelay: "0.3s" }}
        />
        <path
          d="M 320 142 C 320 155, 102 165, 102 174"
          fill="none"
          stroke="var(--edge-stroke)"
          strokeWidth="1"
          strokeDasharray="4 3"
          className="animate-dash-flow"
          style={{ animationDelay: "0.6s" }}
        />
        <path
          d="M 320 142 C 320 155, 280 165, 280 174"
          fill="none"
          stroke="var(--edge-stroke)"
          strokeWidth="1"
          strokeDasharray="4 3"
          className="animate-dash-flow"
          style={{ animationDelay: "0.9s" }}
        />
      </svg>
    </>
  );
}
