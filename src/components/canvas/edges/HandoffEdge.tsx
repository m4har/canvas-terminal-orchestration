import {
  BaseEdge,
  EdgeLabelRenderer,
  MarkerType,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";

export function HandoffEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={{
          type: MarkerType.ArrowClosed,
          width: 12,
          height: 12,
          color: "var(--edge-stroke)",
        }}
        style={{
          stroke: "var(--edge-stroke)",
          strokeWidth: selected ? 2 : 1.5,
          strokeDasharray: "6 4",
        }}
        className="handoff-edge-path"
      />
      <EdgeLabelRenderer>
        <div
          data-testid="handoff-edge-label"
          className="nodrag nopan pointer-events-none absolute rounded bg-[var(--accent-muted)] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-[var(--accent)]"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
        >
          handoff
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
