import { GithubLogo } from "@phosphor-icons/react";
import { GITHUB_URL } from "../lib/constants";

export function Navbar() {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <a href="#" className="text-sm font-medium tracking-tight">
          Canvas Orchestra
        </a>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--muted)] px-3 py-1.5 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--node-hover)]"
        >
          <GithubLogo size={16} weight="fill" />
          View on GitHub
        </a>
      </div>
    </nav>
  );
}
