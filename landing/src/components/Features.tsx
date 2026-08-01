import { Eye, ArrowRight, SquaresFour } from "@phosphor-icons/react";

const FEATURES = [
  {
    icon: Eye,
    title: "Visual Supervision",
    description:
      "All agent statuses on one screen. No tab switching, no buried terminal panes.",
  },
  {
    icon: ArrowRight,
    title: "One-Click Handoff",
    description:
      "Route specs and context between agents via composed prompts. Draw an edge, edit, send.",
  },
  {
    icon: SquaresFour,
    title: "Project Grouping",
    description:
      "Frame agents by project with Square borders and Text headers. Keep parallel work organized.",
  },
];

export function Features() {
  return (
    <section className="border-t border-[var(--border)] bg-[var(--muted)]/30 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-center text-2xl font-semibold tracking-tight">
          Built for parallel agent work
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-[var(--muted-foreground)]">
          Canvas Orchestra supervises real Herdr panes — it does not replace your
          terminal or agent runtime.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-6"
            >
              <Icon
                size={24}
                className="text-[var(--muted-foreground)]"
                weight="light"
              />
              <h3 className="mt-4 text-sm font-medium">{title}</h3>
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
