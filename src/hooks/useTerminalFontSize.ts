import { useCallback, useState } from "react";

export const TERMINAL_FONT_SIZES = [8, 9, 10, 11, 12, 14] as const;
export type TerminalFontSize = (typeof TERMINAL_FONT_SIZES)[number];

const STORAGE_KEY = "canvas-orchestra-terminal-font-size";
const DEFAULT_FONT_SIZE: TerminalFontSize = 11;

function parseStoredFontSize(raw: string | null): TerminalFontSize {
  const parsed = Number(raw);
  if (TERMINAL_FONT_SIZES.includes(parsed as TerminalFontSize)) {
    return parsed as TerminalFontSize;
  }
  return DEFAULT_FONT_SIZE;
}

export function readTerminalFontSize(): TerminalFontSize {
  if (typeof window === "undefined") return DEFAULT_FONT_SIZE;
  return parseStoredFontSize(localStorage.getItem(STORAGE_KEY));
}

export function useTerminalFontSize() {
  const [fontSize, setFontSizeState] = useState<TerminalFontSize>(() =>
    readTerminalFontSize()
  );

  const setFontSize = useCallback((next: TerminalFontSize) => {
    setFontSizeState(next);
    localStorage.setItem(STORAGE_KEY, String(next));
  }, []);

  return { fontSize, setFontSize };
}
