import { useCanvasStore } from "../../stores/canvasStore";
import { refreshHerdrConnection } from "../../hooks/useHerdrConnection";

export function HerdrStatusBadge() {
  const online = useCanvasStore((s) => s.herdrOnline);

  if (online === null) return null;

  return (
    <button
      type="button"
      className="hidden items-center gap-1 text-[10px] sm:inline-flex"
      title={
        online
          ? "Herdr server connected — click to refresh"
          : "Herdr offline — click to connect (starts herdr server)"
      }
      onClick={() => void refreshHerdrConnection()}
    >
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${online ? "bg-emerald-500" : "bg-amber-500"}`}
      />
      <span className="text-[var(--muted-foreground)]">
        herdr {online ? "on" : "off"}
      </span>
    </button>
  );
}
