import { useReactFlow } from "@xyflow/react";
import { flowPositionAtViewportCenter } from "../lib/viewportCenter";

export function useViewportCenter() {
  const { screenToFlowPosition } = useReactFlow();

  return (nodeWidth: number, nodeHeight: number) => {
    const container = document.querySelector(".react-flow");
    return flowPositionAtViewportCenter(
      screenToFlowPosition,
      container instanceof HTMLElement ? container : null,
      nodeWidth,
      nodeHeight
    );
  };
}
