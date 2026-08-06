export function flowPositionAtViewportCenter(
  screenToFlowPosition: (pos: { x: number; y: number }) => { x: number; y: number },
  container: HTMLElement | null,
  nodeWidth: number,
  nodeHeight: number
): { x: number; y: number } {
  if (!container) {
    return { x: 0, y: 0 };
  }

  const rect = container.getBoundingClientRect();
  const center = screenToFlowPosition({
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  });

  return {
    x: center.x - nodeWidth / 2,
    y: center.y - nodeHeight / 2,
  };
}
