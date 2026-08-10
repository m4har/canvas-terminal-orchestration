const TERMS = [
  "AgentNode",
  "OrchestraAgent",
  "AgentProfile",
  "SKILL.md",
  "Play",
  "Handoff",
  "Settings",
  "TerminalNode",
  "MarkdownNode",
  "HerdrBridge",
];

export function Marquee() {
  const row = TERMS.join("  ·  ");

  return (
    <section className="border-y border-[var(--border)] bg-[var(--muted)]/20 py-4 overflow-hidden">
      <div className="marquee-track flex whitespace-nowrap">
        <span className="marquee-content px-4 font-mono text-xs tracking-widest text-[var(--muted-foreground)] uppercase">
          {row}
        </span>
        <span
          className="marquee-content px-4 font-mono text-xs tracking-widest text-[var(--muted-foreground)] uppercase"
          aria-hidden
        >
          {row}
        </span>
      </div>
    </section>
  );
}
