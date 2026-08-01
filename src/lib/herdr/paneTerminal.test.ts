import { describe, expect, it } from "vitest";
import { syncPaneOutput } from "./paneTerminal";

describe("syncPaneOutput", () => {
  it("skips identical snapshots", () => {
    expect(syncPaneOutput("hello", "hello")).toEqual({ action: "skip" });
  });

  it("appends new tail", () => {
    expect(syncPaneOutput("abc", "abcdef")).toEqual({
      action: "append",
      text: "def",
    });
  });

  it("resets on unrelated output", () => {
    expect(syncPaneOutput("abc", "xyz")).toEqual({
      action: "reset",
      text: "xyz",
    });
  });
});
