const FONT_SIZES = [12, 14, 18, 24, 32] as const;

interface NodeFontSizeProps {
  value: number;
  onChange: (size: number) => void;
}

export function NodeFontSize({ value, onChange }: NodeFontSizeProps) {
  return (
    <select
      data-testid="font-size-select"
      className="nodrag nopan nowheel rounded border border-[var(--border)] bg-[var(--muted)] px-1 py-0.5 text-[10px] text-[var(--foreground)]"
      value={value}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onChange={(e) => onChange(Number(e.target.value))}
    >
      {FONT_SIZES.map((size) => (
        <option key={size} value={size}>
          {size}px
        </option>
      ))}
    </select>
  );
}
