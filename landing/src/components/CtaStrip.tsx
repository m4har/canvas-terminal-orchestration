import { GithubLogo, ArrowUpRight } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { GITHUB_URL } from "../lib/constants";
import { Reveal } from "./motion/Reveal";

export function CtaStrip() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal>
          <div className="glass-panel relative overflow-hidden rounded-[2.5rem] px-8 py-16 md:px-16 md:py-20">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--accent)] opacity-[0.06] blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-[var(--foreground)] opacity-[0.03] blur-3xl" />

            <div className="relative grid grid-cols-1 items-center gap-8 md:grid-cols-2">
              <div>
                <h2 className="text-3xl font-semibold tracking-tighter md:text-4xl">
                  Ready to orchestrate
                  <br />
                  your agents?
                </h2>
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-[var(--muted-foreground)]">
                  Clone the repo, connect Herdr, and start laying out your agent
                  workflow on the canvas.
                </p>
              </div>

              <div className="flex flex-col items-start gap-4 md:items-end">
                <motion.a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary inline-flex items-center gap-2.5 rounded-xl bg-[var(--accent)] px-6 py-3.5 text-sm font-medium text-[var(--accent-foreground)]"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <GithubLogo size={20} weight="fill" />
                  View on GitHub
                  <ArrowUpRight size={16} className="opacity-70" />
                </motion.a>
                <p className="font-mono text-[10px] text-[var(--muted-foreground)]">
                  canvas-terminal-orchestration
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
