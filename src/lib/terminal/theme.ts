import type { ITheme } from "@xterm/xterm";

const DARK_THEME: ITheme = {
  background: "#0d0d0d",
  foreground: "#e4e4e7",
  cursor: "#fafafa",
  cursorAccent: "#18181b",
  selectionBackground: "#3f3f46",
  selectionForeground: "#fafafa",
  black: "#18181b",
  red: "#f87171",
  green: "#4ade80",
  yellow: "#facc15",
  blue: "#60a5fa",
  magenta: "#c084fc",
  cyan: "#22d3ee",
  white: "#e4e4e7",
  brightBlack: "#52525b",
  brightRed: "#fca5a5",
  brightGreen: "#86efac",
  brightYellow: "#fde047",
  brightBlue: "#93c5fd",
  brightMagenta: "#d8b4fe",
  brightCyan: "#67e8f9",
  brightWhite: "#fafafa",
};

const LIGHT_THEME: ITheme = {
  background: "#f4f4f5",
  foreground: "#27272a",
  cursor: "#18181b",
  cursorAccent: "#fafafa",
  selectionBackground: "#d4d4d8",
  selectionForeground: "#18181b",
  black: "#27272a",
  red: "#dc2626",
  green: "#16a34a",
  yellow: "#ca8a04",
  blue: "#2563eb",
  magenta: "#9333ea",
  cyan: "#0891b2",
  white: "#52525b",
  brightBlack: "#71717a",
  brightRed: "#ef4444",
  brightGreen: "#22c55e",
  brightYellow: "#eab308",
  brightBlue: "#3b82f6",
  brightMagenta: "#a855f7",
  brightCyan: "#06b6d4",
  brightWhite: "#18181b",
};

function parseHexColor(hex: string): { r: number; g: number; b: number } | null {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const value = match[1];
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }) {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function getTerminalTheme(mode: "light" | "dark"): ITheme {
  return mode === "dark" ? DARK_THEME : LIGHT_THEME;
}

export function resolveTerminalContrastRatio(background: string): number {
  const color = parseHexColor(background);
  if (!color) return 1;
  return relativeLuminance(color) > 0.5 ? 4.5 : 1;
}
