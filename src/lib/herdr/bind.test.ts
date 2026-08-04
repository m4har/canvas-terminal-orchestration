import { describe, expect, it } from "vitest";
import { isHerdrBound, isLocalShell } from "./bind";
import type { TerminalNodeData } from "../types";

function terminal(partial: Partial<TerminalNodeData>): TerminalNodeData {
  return {
    label: "T",
    herdrPaneId: "",
    cwd: "/p",
    status: "idle",
    outputPreview: "",
    ...partial,
  };
}

describe("isHerdrBound", () => {
  it("is true when herdrBound and real pane id", () => {
    expect(
      isHerdrBound(
        terminal({ herdrBound: true, herdrPaneId: "w1:p9" })
      )
    ).toBe(true);
  });

  it("is false for local shell", () => {
    expect(isHerdrBound(terminal({ herdrBound: false }))).toBe(false);
    expect(isLocalShell(terminal({ herdrBound: false }))).toBe(true);
  });

  it("is false when flag set but pane id is placeholder", () => {
    expect(
      isHerdrBound(
        terminal({ herdrBound: true, herdrPaneId: "pane-1" })
      )
    ).toBe(false);
  });
});
