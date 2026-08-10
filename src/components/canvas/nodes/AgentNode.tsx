import type { NodeProps } from "@xyflow/react";
import { Robot } from "@phosphor-icons/react";
import { useCanvasStore } from "../../../stores/canvasStore";
import type { AgentNodeData } from "../../../lib/types";
import { SourceHandle, TargetHandle } from "./NodeHandles";
import { StatusIcon } from "./StatusIcon";
import { NodeSizeResizer } from "./NodeSizeResizer";

export function AgentNode({
  id,
  data,
  selected,
}: NodeProps & { data: AgentNodeData }) {
  const openPlay = useCanvasStore((s) => s.openPlay);
  const openAgentInspector = useCanvasStore((s) => s.openAgentInspector);

  const preview =
    data.streamingResponse ||
    data.lastResponsePreview ||
    "Configure agent, connect markdown upstream, then Play.";

  return (
    <div
      className={`relative flex h-full min-h-[160px] min-w-[240px] flex-col rounded-lg border bg-[var(--background)] shadow-sm ${
        selected ? "border-[var(--foreground)]" : "border-[var(--border)]"
      }`}
    >
      <TargetHandle />
      <SourceHandle />

      <div className="flex items-center gap-2 border-b border-[var(--border)] px-2 py-1.5">
        <Robot size={14} className="shrink-0 text-[var(--muted-foreground)]" />
        <span className="truncate text-xs font-medium">{data.label}</span>
        {data.orchestraAgentSlug && (
          <span className="rounded bg-[var(--muted)] px-1.5 py-0.5 font-mono text-[9px] text-[var(--muted-foreground)]">
            {data.orchestraAgentSlug}
          </span>
        )}
        <StatusIcon status={data.status} />
      </div>

      <div className="flex-1 overflow-hidden p-2">
        <p
          data-testid="agent-response-preview"
          className="line-clamp-6 whitespace-pre-wrap font-mono text-[10px] leading-relaxed text-[var(--muted-foreground)]"
        >
          {preview}
        </p>
      </div>

      <div className="flex gap-1 border-t border-[var(--border)] p-1.5">
        <button
          type="button"
          data-testid="agent-play"
          className="nodrag nopan nowheel flex-1 rounded bg-[var(--foreground)] px-2 py-1 text-[10px] text-[var(--background)]"
          onClick={(e) => {
            e.stopPropagation();
            openPlay(id);
          }}
        >
          Play
        </button>
        <button
          type="button"
          data-testid="agent-config"
          className="nodrag nopan nowheel rounded border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--muted-foreground)]"
          onClick={(e) => {
            e.stopPropagation();
            openAgentInspector(id);
          }}
        >
          Config
        </button>
      </div>

      <NodeSizeResizer selected={selected} minWidth={240} minHeight={160} />
    </div>
  );
}
