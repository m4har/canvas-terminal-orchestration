import { GithubLogo, ArrowUpRight } from "@phosphor-icons/react";
import { GITHUB_URL } from "../lib/constants";

export function Navbar() {
  return (
    <nav className="fixed top-0 z-40 w-full">
      <div className="glass-panel mx-4 mt-4 rounded-2xl border border-[var(--glass-border)]">
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-5">
          <a href="#" className="flex items-center gap-2.5 text-sm font-medium tracking-tight">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-[var(--accent)] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--accent)]" />
            </span>
            Canvas Orchestra
          </a>

          <div className="hidden items-center gap-6 text-xs text-[var(--muted-foreground)] md:flex">
            <a href="#demo" className="transition-colors hover:text-[var(--foreground)]">
              Demo
            </a>
            <a href="#capabilities" className="transition-colors hover:text-[var(--foreground)]">
              Capabilities
            </a>
            <a href="#workflow" className="transition-colors hover:text-[var(--foreground)]">
              Workflow
            </a>
          </div>

          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex items-center gap-1.5 rounded-lg border border-[var(--glass-border)] bg-[var(--muted)]/60 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--node-hover)]"
          >
            <GithubLogo size={14} weight="fill" />
            GitHub
            <ArrowUpRight size={12} className="opacity-60" />
          </a>
        </div>
      </div>
    </nav>
  );
}
