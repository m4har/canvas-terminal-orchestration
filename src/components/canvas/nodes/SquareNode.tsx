import type { NodeProps } from "@xyflow/react";
import type { SquareNodeData } from "../../../lib/types";
import { NodeSizeResizer } from "./NodeSizeResizer";

export function SquareNode({
  data,
  selected,
}: NodeProps & { data: SquareNodeData }) {
  const border = Math.max(8, data.strokeWidth * 3);

  return (
    <div
      className="relative"
      style={{ width: data.width, height: data.height }}
    >
      <NodeSizeResizer
        selected={!!selected}
        minWidth={120}
        minHeight={80}
      />

      <svg
        className="absolute inset-0"
        width={data.width}
        height={data.height}
        style={{ pointerEvents: "none" }}
      >
        <rect
          x={1}
          y={1}
          width={data.width - 2}
          height={data.height - 2}
          fill={data.fill}
          stroke={data.strokeColor ?? "var(--edge-stroke)"}
          strokeWidth={data.strokeWidth}
          strokeDasharray={data.strokeStyle === "dashed" ? "8 4" : undefined}
        />
      </svg>

      {/* Drag handles on edges only — interior clicks pass through */}
      {(["top", "right", "bottom", "left"] as const).map((edge) => (
        <div
          key={edge}
          data-testid={`square-handle-${edge}`}
          className="square-drag-handle absolute pointer-events-auto"
          style={{
            top: edge === "bottom" ? undefined : edge === "top" ? 0 : border,
            bottom: edge === "bottom" ? 0 : edge === "top" ? undefined : border,
            left: edge === "right" ? undefined : edge === "left" ? 0 : border,
            right: edge === "right" ? 0 : edge === "left" ? undefined : border,
            width:
              edge === "left" || edge === "right" ? border : `calc(100% - ${border * 2}px)`,
            height:
              edge === "top" || edge === "bottom" ? border : `calc(100% - ${border * 2}px)`,
            cursor: "move",
          }}
        />
      ))}

      <div data-testid="square-interior" className="absolute inset-0" style={{ pointerEvents: "none" }} />
    </div>
  );
}
