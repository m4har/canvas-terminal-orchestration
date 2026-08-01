import { Check, CircleNotch, Minus } from "@phosphor-icons/react";
import type { AgentStatus } from "../../lib/constants";

const ICON = 14;

export function MockStatusIcon({ status }: { status: AgentStatus }) {
  switch (status) {
    case "working":
      return (
        <CircleNotch
          size={ICON}
          className="animate-spin-slow text-[var(--foreground)]"
          aria-label="working"
        />
      );
    case "done":
      return (
        <Check size={ICON} className="text-[var(--foreground)]" aria-label="done" />
      );
    default:
      return (
        <Minus
          size={ICON}
          className="text-[var(--muted-foreground)]"
          aria-label="idle"
        />
      );
  }
}
