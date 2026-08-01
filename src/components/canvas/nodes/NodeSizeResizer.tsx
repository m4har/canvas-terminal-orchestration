import { NodeResizer } from "@xyflow/react";

interface NodeSizeResizerProps {
  selected: boolean;
  minWidth?: number;
  minHeight?: number;
}

export function NodeSizeResizer({
  selected,
  minWidth = 120,
  minHeight = 64,
}: NodeSizeResizerProps) {
  return (
    <NodeResizer
      isVisible={selected}
      minWidth={minWidth}
      minHeight={minHeight}
      lineClassName="!border-[var(--ring)]"
      handleClassName="!h-2 !w-2 !rounded-sm !bg-[var(--ring)] !border-0"
    />
  );
}
