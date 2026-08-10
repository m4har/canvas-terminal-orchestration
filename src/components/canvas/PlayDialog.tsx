import { useEffect, useState } from "react";

interface PlayDialogProps {
  open: boolean;
  targetLabel: string;
  payload: string;
  onClose: () => void;
  onPlay: (text: string) => void;
}

export function PlayDialog({
  open,
  targetLabel,
  payload,
  onClose,
  onPlay,
}: PlayDialogProps) {
  const [text, setText] = useState(payload);

  useEffect(() => {
    if (open) setText(payload);
  }, [open, payload]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-label="Play dialog"
    >
      <div className="w-full max-w-lg rounded-lg border border-[var(--border)] bg-[var(--background)] p-4 shadow-xl">
        <h2 className="mb-2 text-sm font-semibold">Play → {targetLabel}</h2>
        <textarea
          data-testid="play-payload"
          className="h-40 w-full resize-none rounded-md border border-[var(--border)] bg-[var(--muted)] p-2 font-mono text-xs"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-md px-3 py-1.5 text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            data-testid="play-send"
            className="rounded-md bg-[var(--foreground)] px-3 py-1.5 text-sm text-[var(--background)]"
            onClick={() => onPlay(text)}
          >
            Play
          </button>
        </div>
      </div>
    </div>
  );
}
