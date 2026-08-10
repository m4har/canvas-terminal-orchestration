interface CanvastorMarkProps {
  size?: number;
  className?: string;
}

/** Canvas frame with spec → agent → terminal nodes and loop edges. */
export function CanvastorMark({ size = 20, className }: CanvastorMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect x="4" y="4" width="24" height="24" rx="4" stroke="currentColor" strokeWidth="1.75" />
      <rect x="8" y="8" width="7" height="5" rx="1" fill="currentColor" opacity="0.92" />
      <circle cx="23" cy="14" r="2.75" className="fill-[var(--accent)]" />
      <rect x="8" y="21" width="9" height="5" rx="1" fill="currentColor" opacity="0.78" />
      <path
        d="M11.5 13.5C14.5 11.5 19 11.5 21 14"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M21 17C19 20.5 13.5 22 11.5 20.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M8.5 19.5C7 16 8 12.5 10.5 11"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

interface CanvastorLogoProps {
  iconSize?: number;
  showWordmark?: boolean;
  className?: string;
  wordmarkClassName?: string;
}

export function CanvastorLogo({
  iconSize = 20,
  showWordmark = true,
  className,
  wordmarkClassName,
}: CanvastorLogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <CanvastorMark
        size={iconSize}
        className="shrink-0 text-[var(--foreground)]"
      />
      {showWordmark && (
        <span
          className={`text-sm font-medium tracking-tight text-[var(--foreground)] ${wordmarkClassName ?? ""}`}
        >
          Canvastor
        </span>
      )}
    </span>
  );
}
