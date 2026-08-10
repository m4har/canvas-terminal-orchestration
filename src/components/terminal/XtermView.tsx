import { useEffect, useRef, useState } from "react";
import type { Terminal as XTerm } from "@xterm/xterm";
import type { FitAddon as FitAddonType } from "@xterm/addon-fit";
import { useTheme } from "../theme/ThemeProvider";
import { isAutomationMode } from "../../lib/runtimeFlags";
import {
  killPty,
  listenPtyOutput,
  resizePty,
  spawnLocalPty,
  writePty,
} from "../../lib/pty/client";
import { isTauriRuntime } from "../../lib/workflow";
import {
  getTerminalTheme,
  resolveTerminalContrastRatio,
} from "../../lib/terminal/theme";
import { loadFitAddon, loadXterm } from "../../lib/terminal/xtermLoader";
import {
  canFitTerminal,
  clampTerminalSize,
} from "../../lib/terminal/fitTerminal";
import { normalizePtyInput } from "../../lib/terminal/xtermInput";
import { readPaneVisible } from "../../lib/herdr/client";

import "@xterm/xterm/css/xterm.css";

interface XtermViewProps {
  ptyId?: string;
  cwd?: string;
  herdrPaneId?: string;
  fallbackText?: string;
  lines?: number;
  fontSize?: number;
  active?: boolean;
  herdrBound?: boolean;
  className?: string;
  onPtyId?: (ptyId: string) => void;
  onTerminalSize?: (cols: number, rows: number) => void;
}

export function XtermView({
  ptyId: ptyIdProp,
  cwd = "",
  herdrPaneId,
  fallbackText = "",
  lines = 12,
  fontSize = 11,
  active = false,
  className = "",
  onPtyId,
  onTerminalSize,
  herdrBound = false,
}: XtermViewProps) {
  const { resolved } = useTheme();
  const [ready, setReady] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<XTerm | null>(null);
  const fitRef = useRef<FitAddonType | null>(null);
  const ptyIdRef = useRef(ptyIdProp);
  const unlistenRef = useRef<(() => void) | null>(null);
  const spawnedHereRef = useRef(false);
  const seededHerdrRef = useRef<string | null>(null);

  const fitTerminal = () => {
    const host = hostRef.current;
    const term = termRef.current;
    const fitAddon = fitRef.current;
    const canFit = !!(host && canFitTerminal(host));
    if (!host || !term || !fitAddon || !canFit) return;
    try {
      fitAddon.fit();
      const { cols, rows } = clampTerminalSize(term.cols, term.rows);
      if (cols !== term.cols || rows !== term.rows) {
        term.resize(cols, rows);
      }
      onTerminalSize?.(term.cols, term.rows);
      const ptyId = ptyIdRef.current;
      if (ptyId && isTauriRuntime()) {
        void resizePty(ptyId, term.cols, term.rows);
      }
    } catch {
      // host hidden during layout
    }
  };

  useEffect(() => {
    ptyIdRef.current = ptyIdProp;
  }, [ptyIdProp]);

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
        cols: 80,
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
      requestAnimationFrame(() => fitTerminal());
      termRef.current = term;
      fitRef.current = fitAddon;

      term.onData((data) => {
        const ptyId = ptyIdRef.current;
        if (ptyId) {
          void writePty(ptyId, normalizePtyInput(data));
        }
      });

      resizeObserver = new ResizeObserver(() => {
        fitTerminal();
      });
      resizeObserver.observe(hostRef.current);
      setReady(true);
    };

    void init();

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      term?.dispose();
      termRef.current = null;
      fitRef.current = null;
      setReady(false);
    };
  }, [lines]);

  useEffect(() => {
    if (!ready || !active || isAutomationMode()) return;
    if (!isTauriRuntime()) return;
    if (ptyIdRef.current) return;

    let cancelled = false;
    const cols = termRef.current?.cols ?? 80;
    const rows = termRef.current?.rows ?? lines;

    void spawnLocalPty(cwd || undefined, cols, rows).then((ptyId) => {
      if (cancelled || !ptyId) return;
      ptyIdRef.current = ptyId;
      spawnedHereRef.current = true;
      onPtyId?.(ptyId);
    });

    return () => {
      cancelled = true;
    };
  }, [ready, active, cwd, lines, onPtyId]);

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;
    void listenPtyOutput(({ ptyId, data, full }) => {
      if (cancelled || ptyId !== ptyIdRef.current) return;
      const term = termRef.current;
      if (!term) return;
      if (full) term.reset();
      if (data) term.write(data);
    }).then((unlisten) => {
      if (cancelled) {
        unlisten();
        return;
      }
      unlistenRef.current = unlisten;
    });

    return () => {
      cancelled = true;
      unlistenRef.current?.();
      unlistenRef.current = null;
    };
  }, [ready]);

  useEffect(() => {
    if (!ready || !herdrBound || !herdrPaneId || !ptyIdProp) return;

    const seedKey = `${ptyIdProp}:${herdrPaneId}`;
    if (seededHerdrRef.current === seedKey) return;

    let cancelled = false;
    const term = termRef.current;
    term?.reset();

    void readPaneVisible(herdrPaneId, term?.rows ?? lines).then((text) => {
      if (cancelled) return;
      seededHerdrRef.current = seedKey;
      const live = termRef.current;
      if (!live) return;
      if (text) {
        live.write(text.replace(/\n/g, "\r\n"));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [herdrBound, herdrPaneId, lines, ptyIdProp, ready]);

  useEffect(() => {
    if (!herdrBound) {
      seededHerdrRef.current = null;
    }
  }, [herdrBound]);

  useEffect(() => {
    if (!ready || isTauriRuntime() || isAutomationMode()) return;
    const term = termRef.current;
    if (!term) return;
    const text = fallbackText || "";
    if (!text) return;
    term.reset();
    term.write(text.replace(/\n/g, "\r\n"));
  }, [fallbackText, ready]);

  useEffect(() => {
    return () => {
      if (spawnedHereRef.current && ptyIdRef.current) {
        void killPty(ptyIdRef.current);
      }
    };
  }, []);

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
    if (!ready) return;
    const id = requestAnimationFrame(() => fitTerminal());
    return () => cancelAnimationFrame(id);
  }, [ready, active, fontSize, lines]);

  useEffect(() => {
    const term = termRef.current;
    if (!term) return;

    term.options.fontSize = fontSize;
    fitTerminal();
  }, [fontSize, ready]);

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
