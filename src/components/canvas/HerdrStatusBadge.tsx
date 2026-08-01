import { useEffect, useState } from "react";
import { checkHerdrAvailable } from "../../lib/herdr/dispatch";

export function HerdrStatusBadge() {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    void checkHerdrAvailable().then(setOnline);
  }, []);

  if (online === null) return null;

  return (
    <span
      className="hidden items-center gap-1 text-[10px] sm:inline-flex"
      title={online ? "Herdr server connected" : "Herdr offline — using mock handoff"}
    >
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${online ? "bg-emerald-500" : "bg-amber-500"}`}
      />
      <span className="text-[var(--muted-foreground)]">
        herdr {online ? "on" : "mock"}
      </span>
    </span>
  );
}
