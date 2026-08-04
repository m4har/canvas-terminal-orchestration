import { Check, CircleNotch, Minus, Pause } from "@phosphor-icons/react";
import type { AgentStatus } from "../../lib/constants";

const ICON = 14;

export function MockStatusIcon({ status }: { status: AgentStatus }) {
  switch (status) {
    case "working":
      return (
        <CircleNotch
          size={ICON}
          className="animate-spin-slow text-[var(--status-working)]"
          aria-label="working"
        />
      );
    case "blocked":
      return (
        <Pause size={ICON} className="text-[var(--status-blocked)]" aria-label="blocked" />
      );
    case "done":
      return (
        <Check size={ICON} className="text-[var(--status-done)]" aria-label="done" />
      );
    default:
      return (
        <Minus size={ICON} className="text-[var(--status-idle)]" aria-label="idle" />
      );
  }
}
