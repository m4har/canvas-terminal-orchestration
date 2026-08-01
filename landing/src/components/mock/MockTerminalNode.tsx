import { useEffect, useState } from "react";
import type { AgentStatus } from "../../lib/constants";
import { MockStatusIcon } from "./MockStatusIcon";

const CYCLE: AgentStatus[] = ["idle", "working", "done"];
const CYCLE_MS = 4000;

export function MockTerminalNode({
  label,
  paneId,
  lines,
  delayMs = 0,
  className,
  style,
}: {
  label: string;
  paneId: string;
  lines: string[];
  delayMs?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [status, setStatus] = useState<AgentStatus>("idle");
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    let interval: ReturnType<typeof setInterval>;
    let lineInterval: ReturnType<typeof setInterval>;

    const start = () => {
      let step = 0;
      interval = setInterval(() => {
        step = (step + 1) % CYCLE.length;
        setStatus(CYCLE[step]);
        if (CYCLE[step] === "working") {
          setVisibleLines(0);
        }
      }, CYCLE_MS);

      lineInterval = setInterval(() => {
        setVisibleLines((n) => (n < lines.length ? n + 1 : n));
      }, 800);
    };

    timeout = setTimeout(start, delayMs);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
      clearInterval(lineInterval);
    };
  }, [delayMs, lines.length]);

  return (
    <div
      className={`absolute flex flex-col overflow-hidden rounded-md border border-[var(--border)] bg-[var(--node-fill)] shadow-sm ${className ?? ""}`}
      style={style}
    >
      <div className="flex min-h-0 items-center gap-1.5 border-b border-[var(--border)] px-2 py-1">
        <MockStatusIcon status={status} />
        <span className="truncate text-xs font-medium">{label}</span>
        <span className="ml-auto shrink-0 rounded bg-[var(--muted)] px-1 py-0.5 font-mono text-[8px] text-[var(--muted-foreground)]">
          {paneId}
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden p-1.5 font-mono text-[9px] leading-snug">
        {lines.slice(0, visibleLines).map((line, i) => (
          <p
            key={i}
            className="text-[var(--muted-foreground)]"
            style={{
              animation: `fade-in-line 0.3s ease-out ${i * 0.1}s both`,
            }}
          >
            {line}
          </p>
        ))}
        {status === "working" && (
          <span className="inline-block h-3 w-1.5 animate-blink-cursor bg-[var(--foreground)]" />
        )}
      </div>
    </div>
  );
}
