import { useState } from "react";
import type { NodeProps } from "@xyflow/react";
import { useCanvasStore } from "../../../stores/canvasStore";
import type { MarkdownNodeData } from "../../../lib/types";
import { NodeFontSize } from "./NodeFontSize";
import { NodeSizeResizer } from "./NodeSizeResizer";

export function MarkdownNode({
  id,
  data,
  selected,
}: NodeProps & { data: MarkdownNodeData }) {
  const updateMarkdown = useCanvasStore((s) => s.updateMarkdownNode);
  const [editingTitle, setEditingTitle] = useState(false);
  const fontSize = data.fontSize ?? 11;

  return (
    <div className="relative flex h-full min-h-[120px] min-w-[200px] flex-col rounded-md border border-[var(--border)] bg-[var(--node-fill)] shadow-sm">
      <NodeSizeResizer selected={!!selected} minWidth={200} minHeight={120} />

      <div className="flex items-center gap-2 border-b border-[var(--border)] px-2 py-1.5">
        {editingTitle ? (
          <input
            data-testid="markdown-title-input"
            className="nodrag nopan nowheel min-w-0 flex-1 bg-transparent text-sm font-medium outline-none"
            value={data.title}
            autoFocus
            onBlur={() => setEditingTitle(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setEditingTitle(false);
              e.stopPropagation();
            }}
            onChange={(e) => updateMarkdown(id, { title: e.target.value })}
          />
        ) : (
          <span
            data-testid="markdown-title"
            className="min-w-0 flex-1 cursor-text truncate text-sm font-medium"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditingTitle(true);
            }}
          >
            {data.title}
          </span>
        )}
        {selected && (
          <NodeFontSize
            value={fontSize}
            onChange={(size) => updateMarkdown(id, { fontSize: size })}
          />
        )}
      </div>
      <textarea
        data-testid="markdown-editor"
        className="nodrag nopan nowheel min-h-0 flex-1 w-full resize-none bg-transparent p-2 font-mono leading-relaxed text-[var(--foreground)] outline-none"
        style={{ fontSize: `${fontSize}px` }}
        value={data.content}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onChange={(e) => updateMarkdown(id, { content: e.target.value })}
      />
    </div>
  );
}
