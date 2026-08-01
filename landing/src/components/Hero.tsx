import { GithubLogo } from "@phosphor-icons/react";
import { GITHUB_URL } from "../lib/constants";

export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-6 pt-32 pb-16 text-center">
      <p className="mb-4 text-xs font-medium uppercase tracking-widest text-[var(--muted-foreground)]">
        Visual agent orchestration
      </p>
      <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
        See every agent.
        <br />
        Hand off with one click.
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[var(--muted-foreground)]">
        Canvas Orchestra is a visual workflow canvas for orchestrating AI coding
        agents via Herdr. Design your layout, supervise live terminal sessions,
        and route context between agents — without leaving the canvas.
      </p>
      <div className="mt-8 flex justify-center">
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md bg-[var(--foreground)] px-5 py-2.5 text-sm font-medium text-[var(--background)] transition-opacity hover:opacity-90"
        >
          <GithubLogo size={18} weight="fill" />
          View on GitHub
        </a>
      </div>
    </section>
  );
}
