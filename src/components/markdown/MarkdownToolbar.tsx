import { useState } from "react";
import {
  DotsThree,
  Link as LinkIcon,
  ListBullets,
  ListChecks,
  ListNumbers,
  Paragraph,
  Quotes,
  TextB,
  TextHOne,
  TextHTwo,
  TextHThree,
  TextItalic,
  TextStrikethrough,
} from "@phosphor-icons/react";
import type { MarkdownCommand } from "../../lib/markdown/markdownCommands";

interface MarkdownToolbarProps {
  onCommand: (command: MarkdownCommand) => void;
}

function ToolbarButton({
  label,
  onClick,
  children,
  active = false,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      data-testid={`markdown-toolbar-${label.toLowerCase().replace(/\s+/g, "-")}`}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`inline-flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 text-xs transition-colors ${
        active
          ? "bg-[var(--muted)] text-[var(--foreground)]"
          : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
      }`}
    >
      {children}
    </button>
  );
}

function ToolbarSeparator() {
  return <div className="mx-0.5 h-4 w-px bg-[var(--border)]" aria-hidden />;
}

export function MarkdownToolbar({ onCommand }: MarkdownToolbarProps) {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div
      data-testid="markdown-toolbar"
      className="flex flex-wrap items-center gap-0.5 border-b border-[var(--border)] px-2 py-1"
    >
      <ToolbarButton label="Body text" onClick={() => onCommand("paragraph")}>
        <Paragraph size={14} />
      </ToolbarButton>
      <ToolbarButton label="Heading 1" onClick={() => onCommand("heading1")}>
        <TextHOne size={14} />
      </ToolbarButton>
      <ToolbarButton label="Heading 2" onClick={() => onCommand("heading2")}>
        <TextHTwo size={14} />
      </ToolbarButton>
      <ToolbarButton label="Heading 3" onClick={() => onCommand("heading3")}>
        <TextHThree size={14} />
      </ToolbarButton>

      <div className="relative">
        <button
          type="button"
          aria-label="More blocks"
          title="More blocks"
          data-testid="markdown-toolbar-more-trigger"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setMoreOpen((open) => !open)}
          className="inline-flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 text-xs text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
        >
          <DotsThree size={14} weight="bold" />
        </button>
        {moreOpen ? (
          <div className="absolute left-0 top-full z-10 mt-1 min-w-[10rem] rounded-md border border-[var(--border)] bg-[var(--background)] py-1 shadow-lg">
            <button
              type="button"
              className="block w-full px-3 py-1.5 text-left text-xs hover:bg-[var(--muted)]"
              onClick={() => {
                onCommand("heading4");
                setMoreOpen(false);
              }}
            >
              Heading 4
            </button>
            <button
              type="button"
              data-testid="markdown-toolbar-mermaid"
              className="block w-full px-3 py-1.5 text-left text-xs hover:bg-[var(--muted)]"
              onClick={() => {
                onCommand("mermaid");
                setMoreOpen(false);
              }}
            >
              Mermaid diagram
            </button>
          </div>
        ) : null}
      </div>

      <ToolbarSeparator />

      <ToolbarButton label="Bold" onClick={() => onCommand("bold")}>
        <TextB size={14} weight="bold" />
      </ToolbarButton>
      <ToolbarButton label="Italic" onClick={() => onCommand("italic")}>
        <TextItalic size={14} />
      </ToolbarButton>
      <ToolbarButton label="Strike" onClick={() => onCommand("strike")}>
        <TextStrikethrough size={14} />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton label="Bullet list" onClick={() => onCommand("bulletList")}>
        <ListBullets size={14} />
      </ToolbarButton>
      <ToolbarButton label="Numbered list" onClick={() => onCommand("orderedList")}>
        <ListNumbers size={14} />
      </ToolbarButton>
      <ToolbarButton label="Checklist" onClick={() => onCommand("taskList")}>
        <ListChecks size={14} />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton label="Quote" onClick={() => onCommand("quote")}>
        <Quotes size={14} />
      </ToolbarButton>
      <ToolbarButton label="Link" onClick={() => onCommand("link")}>
        <LinkIcon size={14} />
      </ToolbarButton>
    </div>
  );
}
