import { useCallback, useEffect, useRef, useState } from "react";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { EditorSelection } from "@codemirror/state";
import { Code, Eye } from "@phosphor-icons/react";
import { useTheme } from "../theme/ThemeProvider";
import { MarkdownPreview } from "./MarkdownPreview";
import { MarkdownToolbar } from "./MarkdownToolbar";
import { runMarkdownCommand, type MarkdownCommand } from "../../lib/markdown/markdownCommands";

type EditorMode = "code" | "preview";

interface MarkdownEditorDialogProps {
  open: boolean;
  title: string;
  content: string;
  onClose: () => void;
  onChange: (content: string) => void;
}

export function MarkdownEditorDialog({
  open,
  title,
  content,
  onClose,
  onChange,
}: MarkdownEditorDialogProps) {
  const { resolved } = useTheme();
  const [mode, setMode] = useState<EditorMode>("code");
  const editorRef = useRef<ReactCodeMirrorRef>(null);

  useEffect(() => {
    if (!open) return;
    setMode("code");
  }, [open, title, content]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const runCommand = useCallback(
    (command: MarkdownCommand) => {
      const view = editorRef.current?.view;
      if (!view) {
        const { content: next } = runMarkdownCommand(command, content, {
          from: content.length,
          to: content.length,
        });
        onChange(next);
        return;
      }

      const selection = view.state.selection.main;
      const { content: next, selection: nextSelection } = runMarkdownCommand(command, view.state.doc.toString(), {
        from: selection.from,
        to: selection.to,
      });

      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: next,
        },
        selection: EditorSelection.range(nextSelection.from, nextSelection.to),
      });
      onChange(next);
      view.focus();
    },
    [content, onChange]
  );

  if (!open) return null;

  return (
    <div
      data-testid="markdown-editor-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-label={`Edit ${title}`}
      onClick={onClose}
    >
      <div
        className="flex h-[70vh] w-full max-w-3xl flex-col rounded-lg border border-[var(--border)] bg-[var(--background)] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-2">
          <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">{title}</h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              data-testid="markdown-mode-code"
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs ${
                mode === "code"
                  ? "bg-[var(--muted)] text-[var(--foreground)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
              }`}
              onClick={() => setMode("code")}
            >
              <Code size={14} />
              Code
            </button>
            <button
              type="button"
              data-testid="markdown-mode-preview"
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs ${
                mode === "preview"
                  ? "bg-[var(--muted)] text-[var(--foreground)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
              }`}
              onClick={() => setMode("preview")}
            >
              <Eye size={14} />
              Preview
            </button>
          </div>
          <button
            type="button"
            data-testid="markdown-editor-close"
            className="rounded-md px-2 py-1 text-xs text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        {mode === "code" ? <MarkdownToolbar onCommand={runCommand} /> : null}

        <div className="min-h-0 flex-1 overflow-hidden p-2">
          {mode === "code" ? (
            <CodeMirror
              ref={editorRef}
              value={content}
              height="100%"
              theme={resolved}
              extensions={[markdown()]}
              className="h-full overflow-hidden rounded-md border border-[var(--border)] font-mono text-xs [&_.cm-editor]:h-full [&_.cm-scroller]:overflow-auto"
              onChange={onChange}
            />
          ) : (
            <div className="h-full overflow-auto rounded-md border border-[var(--border)] bg-[var(--muted)] p-3 text-xs">
              <MarkdownPreview content={content} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
