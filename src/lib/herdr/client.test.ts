import { afterEach, describe, expect, it, vi } from "vitest";
import { readPaneRecent, readPaneText, readPaneVisible, setHerdrRunner } from "./client";

describe("readPaneText", () => {
  afterEach(() => setHerdrRunner(null));

  it("requests plain text from recent output", async () => {
    const run = vi.fn().mockResolvedValue("hello\n");
    setHerdrRunner(run);

    const out = await readPaneText("pane-1", 12);

    expect(out).toBe("hello");
    expect(run).toHaveBeenCalledWith([
      "pane",
      "read",
      "pane-1",
      "--lines",
      "12",
      "--source",
      "recent",
      "--format",
      "text",
    ]);
  });
});

describe("readPaneVisible", () => {
  afterEach(() => setHerdrRunner(null));

  it("requests ansi from visible output", async () => {
    const run = vi.fn().mockResolvedValue("\x1b[31merror\x1b[0m");
    setHerdrRunner(run);

    const out = await readPaneVisible("pane-2", 24);

    expect(out).toBe("\x1b[31merror\x1b[0m");
    expect(run).toHaveBeenCalledWith([
      "pane",
      "read",
      "pane-2",
      "--lines",
      "24",
      "--source",
      "visible",
      "--format",
      "ansi",
    ]);
  });
});

describe("readPaneRecent", () => {
  afterEach(() => setHerdrRunner(null));

  it("requests ansi from recent-unwrapped output", async () => {
    const run = vi.fn().mockResolvedValue("delta");
    setHerdrRunner(run);

    const out = await readPaneRecent("pane-3", 12);

    expect(out).toBe("delta");
    expect(run).toHaveBeenCalledWith([
      "pane",
      "read",
      "pane-3",
      "--lines",
      "12",
      "--source",
      "recent-unwrapped",
      "--format",
      "ansi",
    ]);
  });
});
