import {
  ArrowsOut,
  ArrowRight,
  FileText,
  Square,
  Sun,
  Terminal,
  TextT,
} from "@phosphor-icons/react";

export function MockToolbar() {
  return (
    <div className="flex h-10 shrink-0 items-center gap-1 border-b border-[var(--border)] bg-[var(--background)] px-3">
      <ToolbarBtn icon={<Terminal size={14} />} label="+ Terminal" />
      <ToolbarBtn icon={<FileText size={14} />} label="+ Markdown" />
      <ToolbarBtn icon={<Square size={14} />} label="+ Square" />
      <ToolbarBtn icon={<TextT size={14} />} label="+ Text" />
      <div className="flex-1" />
      <ToolbarBtn icon={<ArrowsOut size={14} />} label="Fit" />
      <ToolbarBtn icon={<Sun size={14} />} label="Theme" />
      <ToolbarBtn icon={<ArrowRight size={14} />} label="Handoff" />
    </div>
  );
}

function ToolbarBtn({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs text-[var(--muted-foreground)]">
      {icon}
      {label}
    </span>
  );
}
