import { Handle, Position } from "@xyflow/react";

const handleClass =
  "!h-2.5 !w-2.5 !border !border-[var(--edge-stroke)] !bg-[var(--node-fill)] hover:!bg-[var(--muted)]";

export function SourceHandle() {
  return (
    <Handle
      type="source"
      position={Position.Right}
      className={handleClass}
      data-testid="node-handle-source"
    />
  );
}

export function TargetHandle() {
  return (
    <Handle
      type="target"
      position={Position.Left}
      className={handleClass}
      data-testid="node-handle-target"
    />
  );
}
