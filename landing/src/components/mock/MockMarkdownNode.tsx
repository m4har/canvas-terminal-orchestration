export function MockMarkdownNode({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`absolute flex flex-col overflow-hidden rounded-md border border-[var(--border)] bg-[var(--node-fill)] shadow-sm ${className ?? ""}`}
      style={style}
    >
      <div className="border-b border-[var(--border)] px-2 py-1 text-xs font-medium">
        Plan
      </div>
      <div className="min-h-0 flex-1 overflow-hidden p-1.5 font-mono text-[9px] leading-snug text-[var(--muted-foreground)]">
        <p className="font-semibold text-[var(--foreground)]"># Auth Refactor Plan</p>
        <p className="mt-1">Reference panes by id:</p>
        <p className="mt-1">• pane-planner → Planner</p>
        <p>• pane-fe → FE (Pi)</p>
        <p>• pane-be → BE (OpenCode)</p>
        <p className="mt-1 text-[var(--foreground)]">1. Split login API (BE)</p>
        <p className="text-[var(--foreground)]">2. Build login UI (FE)</p>
      </div>
    </div>
  );
}
