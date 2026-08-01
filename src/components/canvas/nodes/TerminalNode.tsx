import { useState } from "react";
import type { NodeProps } from "@xyflow/react";
import { useCanvasStore } from "../../../stores/canvasStore";
import { isRealHerdrPane } from "../../../lib/herdr/dispatch";
import type { TerminalNodeData } from "../../../lib/types";
import { XtermView } from "../../terminal/XtermView";
import { NodeSizeResizer } from "./NodeSizeResizer";
import { StatusIcon } from "./StatusIcon";

function PaneIdBadge({ paneId }: { paneId: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      data-testid="terminal-pane-id"
      title="Copy pane id for markdown references"
      className="nodrag nopan nowheel ml-auto shrink-0 rounded bg-[var(--muted)] px-1.5 py-0.5 font-mono text-[9px] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      onClick={(e) => {
        e.stopPropagation();
        void navigator.clipboard.writeText(paneId).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1200);
        });
      }}
    >
      {copied ? "copied" : paneId}
    </button>
  );
}

export function TerminalNode({
  id,
  data,
  selected,
}: NodeProps & { data: TerminalNodeData }) {
  const updateTerminal = useCanvasStore((s) => s.updateTerminalNode);
  const [editingLabel, setEditingLabel] = useState(false);

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingLabel(true);
  };

  return (
    <div
      className={`relative flex h-full min-h-[160px] min-w-[240px] flex-col rounded-md border border-[var(--border)] bg-[var(--node-fill)] shadow-sm ${
        selected ? "ring-1 ring-[var(--ring)]" : ""
      }`}
    >
      <NodeSizeResizer selected={!!selected} minWidth={240} minHeight={160} />

      <div className="flex items-center gap-2 border-b border-[var(--border)] px-2 py-1.5">
        <StatusIcon status={data.status} />
        {editingLabel || selected ? (
          <input
            data-testid="terminal-label-input"
            className="nodrag nopan nowheel min-w-0 flex-1 bg-transparent text-sm font-medium outline-none"
            value={data.label}
            autoFocus={editingLabel}
            onBlur={() => setEditingLabel(false)}
            onFocus={() => setEditingLabel(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setEditingLabel(false);
              e.stopPropagation();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) => updateTerminal(id, { label: e.target.value })}
          />
        ) : (
          <span
            data-testid="terminal-label"
            className="min-w-0 flex-1 cursor-text truncate text-sm font-medium"
            onDoubleClick={startEdit}
          >
            {data.label}
          </span>
        )}
        {data.agentKind && (
          <span className="shrink-0 rounded bg-[var(--muted)] px-1.5 py-0.5 text-[10px] uppercase text-[var(--muted-foreground)]">
            {data.agentKind}
          </span>
        )}
        {data.status === "working" && !isRealHerdrPane(data.herdrPaneId) ? (
          <span className="shrink-0 text-[9px] text-amber-500">connecting</span>
        ) : null}
        <PaneIdBadge paneId={data.herdrPaneId} />
      </div>
      <XtermView
        paneId={data.herdrPaneId}
        fallbackText={data.outputPreview || `$ ${data.label}\n`}
        lines={10}
        className="min-h-0 flex-1 border-t border-[var(--border)] bg-[#0d0d0d] p-1 dark:bg-[#0d0d0d]"
      />
    </div>
  );
}
