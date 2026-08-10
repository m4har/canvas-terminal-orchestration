import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Reveal, Stagger, StaggerItem } from "./motion/Reveal";

const STEPS = [
  {
    title: "Layout",
    description:
      "Place Markdown, Agent, Terminal, Square, and Text nodes on an infinite canvas. Group by project with visual frames.",
  },
  {
    title: "Configure",
    description:
      "Open Settings to duplicate bundled profiles, edit system prompts, and pick skills from ~/.agents/skills or create new SKILL.md files.",
  },
  {
    title: "Play",
    description:
      "Connect spec to AgentNode and hit Play. OrchestraAgent streams a response headless, with optional mirror to a Herdr pane.",
  },
  {
    title: "Supervise",
    description:
      "Watch live pane output and status badges. Route work downstream with handoff edges between terminals.",
  },
];

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const lineHeight = useTransform(scrollYProgress, [0.1, 0.8], ["0%", "100%"]);

  return (
    <section id="workflow" className="border-t border-[var(--border)] py-24" ref={ref}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal>
          <div className="mb-14">
            <h2 className="text-3xl font-semibold tracking-tighter md:text-4xl">
              Four moves to
              <br />
              orchestrate
            </h2>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-20">
          <Stagger className="relative space-y-10" stagger={0.15}>
            {STEPS.map(({ title, description }) => (
              <StaggerItem key={title}>
                <div>
                  <h3 className="text-xl font-medium tracking-tight">{title}</h3>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--muted-foreground)]">
                    {description}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>

          <Reveal delay={0.2} className="relative hidden lg:block">
            <div className="absolute left-4 top-0 h-full w-px bg-[var(--border)]">
              <motion.div
                className="w-full bg-[var(--accent)]"
                style={{ height: lineHeight }}
              />
            </div>
            <div className="space-y-16 pl-12">
              {STEPS.map(({ title }) => (
                <div key={title} className="flex items-center gap-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--muted)] text-xs font-medium">
                    {title.charAt(0)}
                  </span>
                  <span className="text-lg font-medium">{title}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
