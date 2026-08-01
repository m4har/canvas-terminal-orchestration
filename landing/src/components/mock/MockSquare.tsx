export function MockSquare({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`pointer-events-none absolute rounded-sm border-2 border-dashed border-[var(--border)] ${className ?? ""}`}
      style={style}
    />
  );
}
