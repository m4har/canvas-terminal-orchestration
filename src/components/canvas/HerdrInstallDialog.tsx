import { useState } from "react";
import { HERDR_INSTALL_CMD } from "../../lib/herdr/requireHerdr";
import type { HerdrInstallReason } from "../../lib/herdr/requireHerdr";
import { isTauriRuntime } from "../../lib/workflow";

interface HerdrInstallDialogProps {
  open: boolean;
  reason: HerdrInstallReason;
  installing: boolean;
  installProgress: number;
  installMessage: string;
  onClose: () => void;
  onRetry: () => void;
  onInstallViaApp: () => void;
}

function reasonTitle(reason: HerdrInstallReason) {
  switch (reason) {
    case "handoff":
      return "Herdr required for handoff";
    case "toolbar":
      return "Install Herdr";
    default:
      return "Herdr required to bind";
  }
}

function reasonBody(reason: HerdrInstallReason) {
  switch (reason) {
    case "handoff":
      return "Handoff delivers prompts through Herdr panes. Install and connect Herdr, then retry.";
    case "toolbar":
      return "Herdr powers agent orchestration. Install it to bind terminals and send handoffs.";
    default:
      return "Binding connects this terminal to a Herdr pane for agent status and handoffs.";
  }
}

export function HerdrInstallDialog({
  open,
  reason,
  installing,
  installProgress,
  installMessage,
  onClose,
  onRetry,
  onInstallViaApp,
}: HerdrInstallDialogProps) {
  const [copied, setCopied] = useState(false);
  const canInstallViaApp = isTauriRuntime();

  if (!open) return null;

  const copyCommand = () => {
    void navigator.clipboard.writeText(HERDR_INSTALL_CMD).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-label="Herdr install dialog"
    >
      <div className="w-full max-w-lg rounded-lg border border-[var(--border)] bg-[var(--background)] p-4 shadow-xl">
        <h2 className="mb-2 text-sm font-semibold">{reasonTitle(reason)}</h2>
        <p className="mb-3 text-xs text-[var(--muted-foreground)]">{reasonBody(reason)}</p>

        <div className="rounded-md border border-[var(--border)] bg-[var(--muted)] p-2">
          <pre
            data-testid="herdr-install-command"
            className="overflow-x-auto font-mono text-[11px] text-[var(--foreground)]"
          >
            {HERDR_INSTALL_CMD}
          </pre>
        </div>

        {installing && (
          <p
            data-testid="herdr-install-progress"
            className="mt-2 text-[10px] text-[var(--muted-foreground)]"
          >
            Installing… {Math.round(installProgress * 100)}%
            {installMessage ? ` — ${installMessage}` : ""}
          </p>
        )}

        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="rounded-md px-3 py-1.5 text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            data-testid="herdr-install-copy"
            className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm"
            onClick={copyCommand}
          >
            {copied ? "Copied" : "Copy command"}
          </button>
          {canInstallViaApp ? (
            <button
              type="button"
              data-testid="herdr-install-via-app"
              disabled={installing}
              className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm disabled:opacity-50"
              onClick={onInstallViaApp}
            >
              Install via app
            </button>
          ) : null}
          <button
            type="button"
            data-testid="herdr-install-retry"
            className="rounded-md bg-[var(--foreground)] px-3 py-1.5 text-sm text-[var(--background)]"
            onClick={onRetry}
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}
