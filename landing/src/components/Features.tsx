import { Eye, ArrowRight, SquaresFour, GitBranch } from "@phosphor-icons/react";
import { Reveal, Stagger, StaggerItem } from "./motion/Reveal";

const FEATURES = [
  {
    icon: Eye,
    tag: "Supervision",
    title: "Visual Supervision",
    description:
      "All agent statuses on one screen. TerminalNode badges show idle, working, blocked, and done, polled every 2 seconds from Herdr.",
    span: "lg:col-span-7",
  },
  {
    icon: ArrowRight,
    tag: "Routing",
    title: "One-Click Handoff",
    description:
      "Draw a Handoff edge, compose the prompt in a dialog, and send it to the target pane. MarkdownNode content flows downstream automatically.",
    span: "lg:col-span-5",
  },
  {
    icon: SquaresFour,
    tag: "Layout",
    title: "Project Grouping",
    description:
      "Square frames and Text headers organize parallel work. Interior is click-through; only the border stroke is draggable.",
    span: "lg:col-span-5",
  },
  {
    icon: GitBranch,
    tag: "Context",
    title: "Inspector Panel",
    description:
      "Click a TerminalNode to see cwd, folder tree, and git status. Read-only workspace context without switching panes.",
    span: "lg:col-span-7",
  },
];

export function Features() {
  return (
    <section id="capabilities" className="border-t border-[var(--border)] py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal>
          <div className="mb-14 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--accent)]">
                Capabilities
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tighter md:text-4xl">
                Built for parallel
                <br className="hidden md:block" />
                agent work
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-[var(--muted-foreground)]">
              Canvas Orchestra supervises real Herdr panes. It does not replace
              your terminal or agent runtime.
            </p>
          </div>
        </Reveal>

        <Stagger className="grid grid-cols-1 gap-4 lg:grid-cols-12" stagger={0.12}>
          {FEATURES.map(({ icon: Icon, tag, title, description, span }) => (
            <StaggerItem key={title} className={span}>
              <div className="group glass-panel h-full rounded-[1.5rem] p-8 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent)]/30">
                <div className="flex items-start justify-between">
                  <Icon
                    size={22}
                    className="text-[var(--muted-foreground)] transition-colors group-hover:text-[var(--accent)]"
                    weight="light"
                  />
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--muted-foreground)]">
                    {tag}
                  </span>
                </div>
                <h3 className="mt-6 text-lg font-medium tracking-tight">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
                  {description}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
