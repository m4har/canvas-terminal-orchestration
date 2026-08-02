import { useEffect, useRef, useState } from "react";
import type { Terminal as XTerm } from "@xterm/xterm";
import type { FitAddon as FitAddonType } from "@xterm/addon-fit";
import { useTheme } from "../theme/ThemeProvider";
import { isRealHerdrPane } from "../../lib/herdr/dispatch";
import { isAutomationMode } from "../../lib/runtimeFlags";
import { startPaneTerminalSync } from "../../lib/herdr/paneTerminal";
import {
  getTerminalTheme,
  resolveTerminalContrastRatio,
} from "../../lib/terminal/theme";
import { loadFitAddon, loadXterm } from "../../lib/terminal/xtermLoader";

import "@xterm/xterm/css/xterm.css";

interface XtermViewProps {
  paneId: string;
  fallbackText?: string;
  lines?: number;
  fontSize?: number;
  active?: boolean;
  className?: string;
}

export function XtermView({
  paneId,
  fallbackText = "",
  lines = 12,
  fontSize = 11,
  active = false,
  className = "",
}: XtermViewProps) {
  const { resolved } = useTheme();
  const [ready, setReady] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<XTerm | null>(null);
  const fitRef = useRef<FitAddonType | null>(null);
  const syncRef = useRef<ReturnType<typeof startPaneTerminalSync> | null>(null);
  const paneIdRef = useRef(paneId);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let term: XTerm | null = null;
    let fitAddon: FitAddonType | null = null;
    let resizeObserver: ResizeObserver | null = null;

    const init = async () => {
      const [{ Terminal }, { FitAddon }] = await Promise.all([
        loadXterm(),
        loadFitAddon(),
      ]);

      if (disposed || !hostRef.current) return;

      const theme = getTerminalTheme(resolved);

      term = new Terminal({
        cols: 40,
        rows: lines,
        fontSize,
        lineHeight: 1.2,
        letterSpacing: 0,
        fontFamily: '"Geist Mono", ui-monospace, monospace',
        cursorBlink: true,
        convertEol: true,
        scrollback: 1000,
        theme,
        minimumContrastRatio: resolveTerminalContrastRatio(theme.background ?? "#0d0d0d"),
        disableStdin: false,
      });

      fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(hostRef.current);
      fitAddon.fit();
      termRef.current = term;
      fitRef.current = fitAddon;

      term.onData((data) => {
        term?.write(data);
        syncRef.current?.send(data);
      });

      resizeObserver = new ResizeObserver(() => {
        try {
          fitAddon?.fit();
        } catch {
          // host hidden during layout
        }
      });
      resizeObserver.observe(hostRef.current);
      setReady(true);
    };

    void init();

    return () => {
      disposed = true;
      syncRef.current?.dispose();
      syncRef.current = null;
      resizeObserver?.disconnect();
      term?.dispose();
      termRef.current = null;
      fitRef.current = null;
      setReady(false);
    };
  }, [lines]);

  useEffect(() => {
    const term = termRef.current;
    if (!term || !ready) return;

    const paneChanged = paneIdRef.current !== paneId;
    paneIdRef.current = paneId;

    syncRef.current?.dispose();

    if (paneChanged && isRealHerdrPane(paneId)) {
      term.reset();
    }

    const sync = startPaneTerminalSync(
      paneId,
      (update) => {
        if (!termRef.current) return;
        if (update.action === "append") termRef.current.write(update.text);
        else if (update.action === "reset") {
          termRef.current.reset();
          termRef.current.write(update.text);
        }
      },
      () => {},
      lines,
      active && !isAutomationMode()
    );
    syncRef.current = sync;

    if (!isRealHerdrPane(paneId) || isAutomationMode()) {
      const text = fallbackText || "";
      if (text) {
        if (paneChanged) {
          term.reset();
          term.write(text.replace(/\n/g, "\r\n"));
        }
        sync.pushMock(text);
      }
    }

    return () => {
      sync.dispose();
      if (syncRef.current === sync) syncRef.current = null;
    };
  }, [paneId, fallbackText, lines, ready, active]);

  useEffect(() => {
    const term = termRef.current;
    if (!term) return;

    const theme = getTerminalTheme(resolved);
    term.options.theme = theme;
    term.options.minimumContrastRatio = resolveTerminalContrastRatio(
      theme.background ?? "#0d0d0d"
    );
  }, [resolved]);

  useEffect(() => {
    const term = termRef.current;
    const fitAddon = fitRef.current;
    if (!term) return;

    term.options.fontSize = fontSize;
    try {
      fitAddon?.fit();
    } catch {
      // host hidden during layout
    }
  }, [fontSize]);

  return (
    <div
      data-testid="terminal-xterm"
      className={`relative nodrag nopan nowheel overflow-hidden ${className}`}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      {!ready && (
        <div
          data-testid="terminal-connecting"
          className="absolute inset-0 flex items-center justify-center font-mono text-[10px] text-[var(--muted-foreground)]"
        >
          connecting...
        </div>
      )}
      <div ref={hostRef} className="h-full w-full" />
    </div>
  );
}
