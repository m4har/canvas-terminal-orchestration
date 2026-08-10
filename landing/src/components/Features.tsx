import { Eye, Play, Sliders, BookOpenText } from "@phosphor-icons/react";
import { Reveal, Stagger, StaggerItem } from "./motion/Reveal";

const FEATURES = [
  {
    icon: Play,
    tag: "Orchestration",
    title: "Headless Play",
    description:
      "Run OrchestraAgents in-app. Play prefills from upstream markdown, streams into AgentNode, and optionally mirrors to a Herdr pane.",
    span: "lg:col-span-7",
  },
  {
    icon: Sliders,
    tag: "Profiles",
    title: "Agent Profiles",
    description:
      "Duplicate bundled roles in Settings, edit system prompts, and attach skills from ~/.agents/skills. Create SKILL.md files without leaving the app.",
    span: "lg:col-span-5",
  },
  {
    icon: BookOpenText,
    tag: "Skills",
    title: "Global skill discovery",
    description:
      "Browse installed skills from npx skills directories, select chips per profile, and resolve SKILL.md at Play time.",
    span: "lg:col-span-5",
  },
  {
    icon: Eye,
    tag: "Supervision",
    title: "Visual Supervision",
    description:
      "All agent statuses on one screen. TerminalNode badges show idle, working, blocked, and done, polled every 2 seconds from Herdr.",
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
              Canvas Orchestra supervises Herdr panes and headless OrchestraAgents.
              Configure profiles, skills, and LLM settings in one place.
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
