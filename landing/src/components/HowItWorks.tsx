import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Reveal, Stagger, StaggerItem } from "./motion/Reveal";

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
              Three moves to
              <br />
              orchestrate
            </h2>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-20">
          <Stagger className="relative space-y-10" stagger={0.15}>
            {STEPS.map(({ step, title, description }) => (
              <StaggerItem key={step}>
                <div className="flex gap-6">
                  <span className="font-mono text-sm text-[var(--accent)]">{step}</span>
                  <div>
                    <h3 className="text-xl font-medium tracking-tight">{title}</h3>
                    <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--muted-foreground)]">
                      {description}
                    </p>
                  </div>
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
              {STEPS.map(({ step, title }) => (
                <div key={step} className="flex items-center gap-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--muted)] font-mono text-xs">
                    {step}
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
