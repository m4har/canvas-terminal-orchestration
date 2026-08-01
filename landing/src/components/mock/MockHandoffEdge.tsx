export function MockHandoffEdge({
  d,
  delay = 0,
}: {
  d: string;
  delay?: number;
}) {
  return (
    <path
      d={d}
      fill="none"
      stroke="var(--edge-stroke)"
      strokeWidth={1.5}
      strokeDasharray="6 4"
      className="animate-dash-flow"
      style={{ animationDelay: `${delay}s` }}
      markerEnd="url(#arrowhead)"
    />
  );
}

export function MockEdgeDefs() {
  return (
    <defs>
      <marker
        id="arrowhead"
        markerWidth="8"
        markerHeight="8"
        refX="6"
        refY="3"
        orient="auto"
      >
        <polygon
          points="0 0, 8 3, 0 6"
          fill="var(--edge-stroke)"
        />
      </marker>
    </defs>
  );
}
