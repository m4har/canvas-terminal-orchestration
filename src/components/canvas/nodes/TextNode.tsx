import { useState } from "react";
import type { NodeProps } from "@xyflow/react";
import { useCanvasStore } from "../../../stores/canvasStore";
import type { TextNodeData } from "../../../lib/types";
import { NodeFontSize } from "./NodeFontSize";
import { NodeSizeResizer } from "./NodeSizeResizer";

export function TextNode({
  id,
  data,
  selected,
}: NodeProps & { data: TextNodeData }) {
  const updateTextNode = useCanvasStore((s) => s.updateTextNode);
  const [editing, setEditing] = useState(false);

  return (
    <div
      className="relative flex h-full min-h-[40px] min-w-[80px] flex-col gap-1 rounded-md border border-[var(--border)] bg-[var(--node-fill)] px-3 py-2 hover:bg-[var(--node-hover)]"
      style={{
        fontSize: `${data.fontSize}px`,
        fontWeight: data.fontWeight ?? "normal",
      }}
    >
      <NodeSizeResizer selected={!!selected} minWidth={80} minHeight={40} />

      {selected && (
        <div className="absolute -top-7 right-0 z-10">
          <NodeFontSize
            value={data.fontSize}
            onChange={(fontSize) => updateTextNode(id, { fontSize })}
          />
        </div>
      )}

      {editing ? (
        <input
          data-testid="text-label-input"
          className="nodrag nopan nowheel w-full bg-transparent outline-none"
          style={{
            fontSize: `${data.fontSize}px`,
            fontWeight: data.fontWeight ?? "normal",
          }}
          value={data.label}
          autoFocus
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter") setEditing(false);
            e.stopPropagation();
          }}
          onChange={(e) => updateTextNode(id, { label: e.target.value })}
        />
      ) : (
        <div
          data-testid="text-label"
          className="min-h-[1em] cursor-text"
          onDoubleClick={(e) => {
            e.stopPropagation();
            setEditing(true);
          }}
        >
          {data.label || "Label"}
        </div>
      )}
    </div>
  );
}
