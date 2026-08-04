import { useCanvasStore } from "../../stores/canvasStore";
import { refreshHerdrConnection } from "../../hooks/useHerdrConnection";
import { readyStateFromStore } from "../../lib/herdr/requireHerdr";
import type { HerdrLifecycle } from "../../lib/herdr/status";

function lifecycleLabel(lifecycle: HerdrLifecycle | null, online: boolean) {
  const state = readyStateFromStore(online, lifecycle);
  if (state === "unsupported") return "n/a";
  if (lifecycle === "downloading") return "installing";
  if (lifecycle === "starting") return "starting";
  if (state === "ready") return "on";
  if (state === "missing") return "install";
  return "off";
}

function lifecycleTitle(lifecycle: HerdrLifecycle | null, online: boolean) {
  const state = readyStateFromStore(online, lifecycle);
  if (state === "unsupported") {
    return "Herdr on Windows is preview-only — use macOS or Linux";
  }
  if (lifecycle === "downloading") {
    return "Downloading Herdr to app storage";
  }
  if (lifecycle === "starting") {
    return "Starting Herdr server";
  }
  if (state === "ready") return "Herdr server connected — click to refresh";
  if (state === "missing") return "Herdr not installed — click to install";
  return "Herdr offline — click to connect";
}

export function HerdrStatusBadge() {
  const online = useCanvasStore((s) => s.herdrOnline);
  const lifecycle = useCanvasStore((s) => s.herdrLifecycle);
  const openHerdrInstall = useCanvasStore((s) => s.openHerdrInstall);

  if (online === null && lifecycle === null) return null;

  const isOnline = online === true;
  const state = readyStateFromStore(online, lifecycle);
  const label = lifecycleLabel(lifecycle, isOnline);
  const busy = lifecycle === "downloading" || lifecycle === "starting";
  const dotClass = busy
    ? "bg-[var(--warning)] animate-pulse"
    : state === "ready"
      ? "bg-[var(--success)]"
      : state === "unsupported"
        ? "bg-[var(--muted-foreground)]"
        : "bg-[var(--warning)]";

  const handleClick = () => {
    if (busy) return;
    if (state === "missing" || state === "unsupported") {
      openHerdrInstall({ reason: "toolbar" });
      return;
    }
    void refreshHerdrConnection();
  };

  return (
    <button
      type="button"
      data-testid="herdr-status-badge"
      className="hidden items-center gap-1 text-[10px] sm:inline-flex disabled:opacity-60"
      title={lifecycleTitle(lifecycle, isOnline)}
      disabled={busy}
      onClick={handleClick}
    >
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${dotClass}`} />
      <span className="text-[var(--muted-foreground)]">herdr {label}</span>
    </button>
  );
}
