import { describe, expect, it } from "vitest";
import { getTerminalTheme, resolveTerminalContrastRatio } from "./theme";

const ANSI_SLOTS = [
  "black",
  "red",
  "green",
  "yellow",
  "blue",
  "magenta",
  "cyan",
  "white",
  "brightBlack",
  "brightRed",
  "brightGreen",
  "brightYellow",
  "brightBlue",
  "brightMagenta",
  "brightCyan",
  "brightWhite",
] as const;

describe("getTerminalTheme", () => {
  it("defines all ansi colors for dark mode", () => {
    const theme = getTerminalTheme("dark");
    for (const slot of ANSI_SLOTS) {
      expect(theme[slot], slot).toMatch(/^#[0-9a-f]{6}$/i);
    }
    expect(theme.background).toBe("#0d0d0d");
    expect(theme.foreground).toBe("#e4e4e7");
  });

  it("defines all ansi colors for light mode", () => {
    const theme = getTerminalTheme("light");
    for (const slot of ANSI_SLOTS) {
      expect(theme[slot], slot).toMatch(/^#[0-9a-f]{6}$/i);
    }
    expect(theme.background).toBe("#f4f4f5");
    expect(theme.foreground).toBe("#27272a");
  });
});

describe("resolveTerminalContrastRatio", () => {
  it("returns 4.5 for light backgrounds", () => {
    expect(resolveTerminalContrastRatio("#f4f4f5")).toBe(4.5);
  });

  it("returns 1 for dark backgrounds", () => {
    expect(resolveTerminalContrastRatio("#0d0d0d")).toBe(1);
  });
});
