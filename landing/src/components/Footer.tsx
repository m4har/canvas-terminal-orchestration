import { GITHUB_URL } from "../lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
        <p className="text-xs text-[var(--muted-foreground)]">
          Canvas Orchestra — visual agent orchestration via{" "}
          <a
            href="https://herdr.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-[var(--foreground)]"
          >
            Herdr
          </a>
        </p>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[var(--muted-foreground)] underline underline-offset-2 hover:text-[var(--foreground)]"
        >
          github.com/m4har/canvas-terminal-orchestration
        </a>
      </div>
    </footer>
  );
}
