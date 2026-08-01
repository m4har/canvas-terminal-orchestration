import {
  Check,
  CircleNotch,
  Minus,
  Pause,
} from "@phosphor-icons/react";
import type { AgentStatus } from "../../lib/types";

const ICON = 14;

export function StatusIcon({ status }: { status: AgentStatus }) {
  switch (status) {
    case "working":
      return (
        <CircleNotch
          size={ICON}
          className="animate-spin text-[var(--foreground)]"
          aria-label="working"
        />
      );
    case "blocked":
      return <Pause size={ICON} className="text-yellow-500" aria-label="blocked" />;
    case "done":
      return <Check size={ICON} className="text-green-500" aria-label="done" />;
    default:
      return <Minus size={ICON} className="text-[var(--muted-foreground)]" aria-label="idle" />;
  }
}
