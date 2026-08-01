import { GithubLogo } from "@phosphor-icons/react";
import { GITHUB_URL } from "../lib/constants";

export function CtaStrip() {
  return (
    <section className="border-t border-[var(--border)] py-20">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">
          Ready to orchestrate your agents?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-[var(--muted-foreground)]">
          Canvas Orchestra is open source. Clone the repo, connect Herdr, and
          start laying out your agent workflow.
        </p>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center gap-2 rounded-md bg-[var(--foreground)] px-5 py-2.5 text-sm font-medium text-[var(--background)] transition-opacity hover:opacity-90"
        >
          <GithubLogo size={18} weight="fill" />
          View on GitHub
        </a>
      </div>
    </section>
  );
}
