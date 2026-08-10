import { GithubLogo, ArrowUpRight, Moon, Sun } from "@phosphor-icons/react";
import { CanvastorLogo } from "../brand/CanvastorLogo";
import { GITHUB_URL } from "../lib/constants";
import { useLandingTheme } from "./theme/LandingThemeProvider";

export function Navbar() {
  const { resolved, toggleTheme } = useLandingTheme();

  return (
    <nav className="fixed top-0 z-40 w-full">
      <div className="glass-panel mx-4 mt-4 rounded-2xl">
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-5">
          <a href="#" className="text-[var(--foreground)]">
            <CanvastorLogo iconSize={22} />
          </a>

          <div className="hidden items-center gap-6 text-xs text-[var(--muted-foreground)] md:flex">
            <a href="#demo" className="transition-colors hover:text-[var(--accent)]">
              Demo
            </a>
            <a href="#profiles" className="transition-colors hover:text-[var(--accent)]">
              Profiles
            </a>
            <a href="#capabilities" className="transition-colors hover:text-[var(--accent)]">
              Capabilities
            </a>
            <a href="#workflow" className="transition-colors hover:text-[var(--accent)]">
              Workflow
            </a>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--muted)]/60 text-[var(--muted-foreground)] transition-colors hover:text-[var(--accent)]"
              aria-label={resolved === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {resolved === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-[var(--accent-foreground)]"
            >
              <GithubLogo size={14} weight="fill" />
              GitHub
              <ArrowUpRight size={12} className="opacity-70" />
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
