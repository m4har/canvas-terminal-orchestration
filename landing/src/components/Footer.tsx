import { GITHUB_URL } from "../lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-6 md:flex-row md:items-center lg:px-8">
        <div>
          <p className="text-sm font-medium tracking-tight">Canvas Orchestra</p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Visual agent orchestration via{" "}
            <a
              href="https://herdr.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 transition-colors hover:text-[var(--foreground)]"
            >
              Herdr
            </a>
          </p>
        </div>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[10px] text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
        >
          github.com/m4har/canvas-terminal-orchestration
        </a>
      </div>
    </footer>
  );
}
