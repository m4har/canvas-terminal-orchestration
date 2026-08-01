import { useEffect, useRef } from "react";
import type { Terminal as XTerm } from "@xterm/xterm";
import type { FitAddon as FitAddonType } from "@xterm/addon-fit";
import { isRealHerdrPane } from "../../lib/herdr/dispatch";
import { startPaneTerminalSync } from "../../lib/herdr/paneTerminal";

import "@xterm/xterm/css/xterm.css";

function terminalTheme() {
  const dark = document.documentElement.classList.contains("dark");
  return {
    background: dark ? "#1f1f1f" : "#f4f4f5",
    foreground: dark ? "#e4e4e7" : "#27272a",
    cursor: dark ? "#fafafa" : "#18181b",
    cursorAccent: dark ? "#18181b" : "#fafafa",
    selectionBackground: dark ? "#3f3f46" : "#d4d4d8",
  };
}

interface XtermViewProps {
  paneId: string;
  fallbackText?: string;
  lines?: number;
  className?: string;
}

export function XtermView({
  paneId,
  fallbackText = "",
  lines = 12,
  className = "",
}: XtermViewProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<XTerm | null>(null);
  const fitRef = useRef<FitAddonType | null>(null);
  const syncRef = useRef<ReturnType<typeof startPaneTerminalSync> | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let term: XTerm | null = null;
    let fitAddon: FitAddonType | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let sync: ReturnType<typeof startPaneTerminalSync> | null = null;

    const init = async () => {
      const [{ Terminal }, { FitAddon }] = await Promise.all([
        import("@xterm/xterm"),
        import("@xterm/addon-fit"),
      ]);

      if (disposed || !hostRef.current) return;

      term = new Terminal({
        cols: 40,
        rows: lines,
        fontSize: 11,
        fontFamily: "var(--font-mono), ui-monospace, monospace",
        cursorBlink: true,
        convertEol: true,
        scrollback: 1000,
        theme: terminalTheme(),
        disableStdin: false,
      });

      fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(hostRef.current);
      fitAddon.fit();
      termRef.current = term;
      fitRef.current = fitAddon;

      if (fallbackText) {
        term.write(fallbackText.replace(/\n/g, "\r\n"));
      }

      sync = startPaneTerminalSync(
        paneId,
        (update) => {
          if (!term) return;
          if (update.action === "append") term.write(update.text);
          else if (update.action === "reset") {
            term.reset();
            term.write(update.text);
          }
        },
        () => {},
        lines
      );
      syncRef.current = sync;

      if (!isRealHerdrPane(paneId) && fallbackText) {
        sync.pushMock(fallbackText);
      }

      term.onData((data) => {
        void sync?.send(data);
        if (!isRealHerdrPane(paneId) && term) {
          term.write(data);
        }
      });

      resizeObserver = new ResizeObserver(() => {
        try {
          fitAddon?.fit();
        } catch {
          // host hidden during layout
        }
      });
      resizeObserver.observe(hostRef.current);
    };

    void init();

    return () => {
      disposed = true;
      sync?.dispose();
      syncRef.current = null;
      resizeObserver?.disconnect();
      term?.dispose();
      termRef.current = null;
      fitRef.current = null;
    };
  }, [paneId, lines]);

  useEffect(() => {
    if (!fallbackText || isRealHerdrPane(paneId)) return;
    syncRef.current?.pushMock(fallbackText);
  }, [fallbackText, paneId]);

  return (
    <div
      data-testid="terminal-xterm"
      className={`nodrag nopan nowheel overflow-hidden ${className}`}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <div ref={hostRef} className="h-full w-full" />
    </div>
  );
}
