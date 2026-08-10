import { useEffect, useState } from "react";
import { Lock, Check } from "@phosphor-icons/react";

const PROFILES = [
  { id: "planner", name: "Planner", bundled: true },
  { id: "planner-custom", name: "Planner (custom)", bundled: false },
  { id: "architect", name: "Architect", bundled: true },
];

const SKILLS = [
  { id: "domain-modeling", source: "agents", active: true },
  { id: "tdd", source: "agents", active: true },
  { id: "brainstorming", source: "cursor", active: false },
  { id: "codebase-design", source: "agents", active: false },
];

export function MockProfilesSettings() {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const pulse = () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    };
    const first = setTimeout(pulse, 1800);
    const loop = setInterval(pulse, 5200);
    return () => {
      clearTimeout(first);
      clearInterval(loop);
    };
  }, []);

  return (
    <div className="flex h-full min-h-[260px] flex-col rounded-xl border border-[var(--border)] bg-[var(--background)]/80 text-[10px]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2">
        <span className="font-medium">Settings</span>
        <span className="font-mono text-[9px] text-[var(--muted-foreground)]">Agent Profiles</span>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-2 p-2">
        <ul className="space-y-1 overflow-hidden rounded border border-[var(--border)] p-1">
          {PROFILES.map((p) => (
            <li
              key={p.id}
              className={`flex items-center justify-between gap-1 rounded px-2 py-1.5 ${
                p.id === "planner-custom"
                  ? "bg-[var(--foreground)] text-[var(--background)]"
                  : "text-[var(--muted-foreground)]"
              }`}
            >
              <span className="truncate">
                {p.name}{" "}
                <span className="font-mono opacity-70">({p.id})</span>
              </span>
              {p.bundled && (
                <Lock
                  size={10}
                  className={
                    p.id === "planner-custom"
                      ? "text-[var(--background)]"
                      : "text-[var(--muted-foreground)]"
                  }
                />
              )}
            </li>
          ))}
        </ul>

        <div className="flex min-w-0 flex-col gap-2">
          <label className="block">
            <span className="text-[var(--muted-foreground)]">System prompt</span>
            <div className="mt-1 rounded border border-[var(--border)] bg-[var(--muted)]/50 p-2 font-mono leading-relaxed text-[9px] text-[var(--muted-foreground)]">
              You are a strategic planner. Break work into phases with acceptance criteria.
            </div>
          </label>

          <div>
            <p className="mb-1 text-[var(--muted-foreground)]">Default skills</p>
            <div className="flex flex-wrap gap-1">
              {SKILLS.map((s) => (
                <span
                  key={s.id}
                  className={`rounded border px-1.5 py-0.5 font-mono text-[8px] ${
                    s.active
                      ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                      : "border-[var(--border)] text-[var(--muted-foreground)]"
                  }`}
                >
                  {s.id}
                </span>
              ))}
            </div>
            <p className="mt-1 font-mono text-[8px] text-[var(--muted-foreground)]">
              ~/.agents/skills · ~/.cursor/skills-cursor
            </p>
          </div>

          <div className="mt-auto space-y-1.5">
            {saved && (
              <div
                className="flex items-center gap-1.5 rounded border border-[var(--border)] bg-[var(--muted)] px-2 py-1 text-[var(--foreground)]"
                role="status"
              >
                <Check size={10} weight="bold" />
                Profile saved.
              </div>
            )}
            <div className="flex gap-2">
              <span className="cursor-pointer rounded bg-[var(--foreground)] px-2.5 py-1 text-[var(--background)]">
                Save
              </span>
              <span className="cursor-pointer rounded border border-[var(--border)] px-2.5 py-1 text-[var(--muted-foreground)]">
                Duplicate
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
