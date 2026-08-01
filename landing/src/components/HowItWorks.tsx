const STEPS = [
  {
    step: "01",
    title: "Layout",
    description:
      "Place Terminal, Markdown, Square, and Text nodes on an infinite canvas. Group by project with visual frames.",
  },
  {
    step: "02",
    title: "Supervise",
    description:
      "Watch live Herdr pane output and agent status badges. See idle, working, blocked, and done at a glance.",
  },
  {
    step: "03",
    title: "Hand off",
    description:
      "Draw edges and send composed prompts to downstream agents. Route specs from MarkdownNodes to terminal panes.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-center text-2xl font-semibold tracking-tight">
          How it works
        </h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {STEPS.map(({ step, title, description }) => (
            <div key={step} className="relative">
              <span className="font-mono text-xs text-[var(--muted-foreground)]">
                {step}
              </span>
              <h3 className="mt-2 text-lg font-medium">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
