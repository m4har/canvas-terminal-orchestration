import { describe, expect, it } from "vitest";
import { clampTerminalSize } from "./fitTerminal";

describe("clampTerminalSize", () => {
  it("enforces minimum cols and rows", () => {
    expect(clampTerminalSize(1, 2)).toEqual({ cols: 24, rows: 4 });
  });

  it("keeps larger dimensions", () => {
    expect(clampTerminalSize(80, 24)).toEqual({ cols: 80, rows: 24 });
  });
});
