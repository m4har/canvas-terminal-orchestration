import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Reveal } from "./motion/Reveal";
import { MockProfilesSettings } from "./mock/MockProfilesSettings";

const PROMPTS = [
  "Break down Auth Refactor into FE and BE tasks...",
  "Acceptance: JWT on /api/v2/auth, login form with useAuth...",
  "Mirror plan to pane-implement for parallel handoff...",
];

const STATUSES = [
  { pane: "agent-planner", state: "working", runtime: "orchestra" },
  { pane: "pane-implement", state: "idle", runtime: "claude" },
  { pane: "pane-fe", state: "done", runtime: "pi" },
];

function TypewriterPrompt() {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const target = PROMPTS[index];
    const timeout = setTimeout(
      () => {
        if (!deleting) {
          if (text.length < target.length) {
            setText(target.slice(0, text.length + 1));
          } else {
            setTimeout(() => setDeleting(true), 1800);
          }
        } else if (text.length > 0) {
          setText(text.slice(0, -1));
        } else {
          setDeleting(false);
          setIndex((i) => (i + 1) % PROMPTS.length);
        }
      },
      deleting ? 30 : 45,
    );
    return () => clearTimeout(timeout);
  }, [text, deleting, index]);

  return (
    <div className="font-mono text-xs">
      <span className="text-[var(--muted-foreground)]">orchestra_agent_play </span>
      <span className="text-[var(--accent)]">planner</span>
      <span className="text-[var(--muted-foreground)]"> &quot;</span>
      <span>{text}</span>
      <span className="animate-blink-cursor inline-block h-3.5 w-0.5 translate-y-0.5 bg-[var(--accent)]" />
      <span className="text-[var(--muted-foreground)]">&quot;</span>
    </div>
  );
}

function LiveStatusList() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % STATUSES.length), 2800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-2">
      {STATUSES.map((s, i) => (
        <motion.div
          key={s.pane}
          layout
          className={`flex items-center justify-between rounded-lg border px-3 py-2 font-mono text-[10px] transition-colors ${
            i === active
              ? "border-[var(--accent)]/40 bg-[var(--accent)]/5"
              : "border-[var(--border)] bg-[var(--muted)]/30"
          }`}
        >
          <span className="text-[var(--muted-foreground)]">{s.pane}</span>
          <span className="flex items-center gap-2">
            <span className="text-[var(--muted-foreground)]">{s.runtime}</span>
            <span
              className={`rounded px-1.5 py-0.5 uppercase tracking-wider ${
                s.state === "working"
                  ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                  : s.state === "done"
                    ? "bg-[var(--success)]/15 text-[var(--success)]"
                    : "text-[var(--muted-foreground)]"
              }`}
            >
              {s.state}
            </span>
          </span>
        </motion.div>
      ))}
    </div>
  );
}

export function CapabilitiesBento() {
  return (
    <section className="pb-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <Reveal className="lg:col-span-7" delay={0.1}>
            <div className="glass-panel flex h-full min-h-[280px] flex-col justify-between rounded-[2rem] p-8">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">
                  Command input
                </p>
                <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--background)]/60 p-4">
                  <TypewriterPrompt />
                </div>
              </div>
              <div className="mt-8 h-1 overflow-hidden rounded-full bg-[var(--muted)]">
                <div className="shimmer-bar h-full w-full rounded-full" />
              </div>
            </div>
            <p className="mt-3 pl-1 font-mono text-[10px] text-[var(--muted-foreground)]">
              Play prompt composition
            </p>
          </Reveal>

          <Reveal className="lg:col-span-5" delay={0.2}>
            <div className="glass-panel h-full min-h-[280px] rounded-[2rem] p-8">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">
                Live pane status
              </p>
              <div className="mt-6">
                <LiveStatusList />
              </div>
            </div>
            <p className="mt-3 pl-1 font-mono text-[10px] text-[var(--muted-foreground)]">
              Polled every 2s via HerdrBridge
            </p>
          </Reveal>

          <Reveal className="lg:col-span-4" delay={0.15}>
            <div className="glass-panel flex h-full min-h-[280px] flex-col rounded-[2rem] p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">
                Profile editor
              </p>
              <div className="mt-3 min-h-0 flex-1">
                <MockProfilesSettings />
              </div>
            </div>
            <p className="mt-3 pl-1 font-mono text-[10px] text-[var(--muted-foreground)]">
              Duplicate bundled · attach global skills
            </p>
          </Reveal>

          <Reveal className="lg:col-span-8" delay={0.25}>
            <div className="glass-panel rounded-[2rem] p-8">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">
                Stack
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["Tauri 2", "React 19", "@xyflow/react", "Herdr", "SQLite", "SKILL.md", "Zustand"].map(
                  (tech) => (
                    <span
                      key={tech}
                      className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 px-3 py-1.5 font-mono text-xs text-[var(--muted-foreground)] transition-colors hover:border-[var(--accent)]/30 hover:text-[var(--foreground)]"
                    >
                      {tech}
                    </span>
                  ),
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
