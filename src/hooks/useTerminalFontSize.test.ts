import { describe, expect, it, beforeEach } from "vitest";
import { readTerminalFontSize, TERMINAL_FONT_SIZES } from "./useTerminalFontSize";

describe("readTerminalFontSize", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults to 11", () => {
    expect(readTerminalFontSize()).toBe(11);
  });

  it("reads persisted size", () => {
    localStorage.setItem("canvas-orchestra-terminal-font-size", "9");
    expect(readTerminalFontSize()).toBe(9);
  });

  it("falls back for invalid stored value", () => {
    localStorage.setItem("canvas-orchestra-terminal-font-size", "99");
    expect(readTerminalFontSize()).toBe(11);
  });

  it("only allows configured sizes", () => {
    expect(TERMINAL_FONT_SIZES).toEqual([8, 9, 10, 11, 12, 14]);
  });
});
