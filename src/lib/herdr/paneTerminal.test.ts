import { afterEach, describe, expect, it, vi } from "vitest";
import { syncVisibleOutput, startPaneTerminalSync } from "./paneTerminal";

vi.mock("./client", () => ({
  readPaneVisible: vi.fn().mockResolvedValue("prompt"),
  readPaneRecent: vi.fn().mockResolvedValue(""),
  sendPaneInput: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./dispatch", () => ({
  isRealHerdrPane: vi.fn((id: string) => id === "wabc:p1"),
}));

import { readPaneRecent, readPaneVisible, sendPaneInput } from "./client";

describe("syncVisibleOutput", () => {
  it("skips identical snapshots", () => {
    expect(syncVisibleOutput("hello", "hello")).toEqual({ action: "skip" });
  });

  it("resets when visible screen changes", () => {
    expect(syncVisibleOutput("abc", "xyz")).toEqual({
      action: "reset",
      text: "xyz",
    });
  });

  it("skips empty poll while previous snapshot exists", () => {
    expect(syncVisibleOutput("abc", "")).toEqual({ action: "skip" });
  });
});

describe("startPaneTerminalSync", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("bootstraps with visible read on mount", async () => {
    vi.mocked(readPaneVisible).mockResolvedValue("$ prompt\n");
    const onSync = vi.fn();

    const sync = startPaneTerminalSync("wabc:p1", onSync, () => {});
    await Promise.resolve();
    await Promise.resolve();

    expect(readPaneVisible).toHaveBeenCalledWith("wabc:p1", 24);
    expect(onSync).toHaveBeenCalledWith({ action: "reset", text: "$ prompt\n" });
    sync.dispose();
  });

  it("appends recent deltas without reset", async () => {
    vi.useFakeTimers();
    vi.mocked(readPaneVisible).mockResolvedValue("$ ");
    vi.mocked(readPaneRecent).mockResolvedValue("ls");
    const onSync = vi.fn();

    const sync = startPaneTerminalSync("wabc:p1", onSync, () => {});
    await Promise.resolve();
    await Promise.resolve();
    onSync.mockClear();

    vi.advanceTimersByTime(150);
    await Promise.resolve();

    expect(readPaneRecent).toHaveBeenCalled();
    expect(onSync).toHaveBeenCalledWith({ action: "append", text: "ls" });
    sync.dispose();
  });

  it("empty recent does not clear screen", async () => {
    vi.useFakeTimers();
    vi.mocked(readPaneVisible).mockResolvedValue("$ ");
    vi.mocked(readPaneRecent).mockResolvedValue("");
    const onSync = vi.fn();

    const sync = startPaneTerminalSync("wabc:p1", onSync, () => {});
    await Promise.resolve();
    await Promise.resolve();
    onSync.mockClear();

    vi.advanceTimersByTime(150);
    await Promise.resolve();

    expect(onSync).not.toHaveBeenCalled();
    sync.dispose();
  });

  it("enter triggers visible resync after debounce", async () => {
    vi.useFakeTimers();
    vi.mocked(readPaneVisible).mockResolvedValueOnce("$ ").mockResolvedValueOnce("$ ls output\n");
    vi.mocked(readPaneRecent).mockResolvedValue("");
    const onSync = vi.fn();

    const sync = startPaneTerminalSync("wabc:p1", onSync, () => {});
    await Promise.resolve();
    await Promise.resolve();
    onSync.mockClear();
    vi.mocked(readPaneVisible).mockClear();

    sync.send("\r");
    await Promise.resolve();
    vi.advanceTimersByTime(80);
    await Promise.resolve();

    expect(sendPaneInput).toHaveBeenCalled();
    expect(readPaneVisible).toHaveBeenCalled();
    sync.dispose();
  });

  it("fires sendPaneInput without awaiting poll", async () => {
    vi.useFakeTimers();
    vi.mocked(readPaneVisible).mockResolvedValue("screen");
    vi.mocked(readPaneRecent).mockResolvedValue("");

    const sync = startPaneTerminalSync("wabc:p1", () => {}, () => {});
    await Promise.resolve();
    await Promise.resolve();

    sync.send("a");
    await Promise.resolve();
    expect(sendPaneInput).toHaveBeenCalledWith("wabc:p1", "a");

    sync.dispose();
  });

  it("polls on 150ms interval when active", async () => {
    vi.useFakeTimers();
    let recentCount = 0;
    vi.mocked(readPaneVisible).mockResolvedValue("screen");
    vi.mocked(readPaneRecent).mockImplementation(async () => {
      recentCount += 1;
      return "";
    });

    const sync = startPaneTerminalSync("wabc:p1", () => {}, () => {});
    await Promise.resolve();
    await Promise.resolve();
    const afterBootstrap = recentCount;

    vi.advanceTimersByTime(150);
    await Promise.resolve();
    expect(recentCount).toBeGreaterThan(afterBootstrap);

    sync.dispose();
  });

  it("resyncs visible after consecutive empty recent polls", async () => {
    vi.useFakeTimers();
    vi.mocked(readPaneVisible).mockResolvedValue("$ ");
    vi.mocked(readPaneRecent).mockResolvedValue("");
    const onSync = vi.fn();

    const sync = startPaneTerminalSync("wabc:p1", onSync, () => {});
    await Promise.resolve();
    await Promise.resolve();
    onSync.mockClear();
    vi.mocked(readPaneVisible).mockClear();

    for (let i = 0; i < 3; i++) {
      vi.advanceTimersByTime(150);
      await Promise.resolve();
    }

    expect(readPaneVisible).toHaveBeenCalled();
    sync.dispose();
  });

  it("does not poll when inactive", async () => {
    vi.useFakeTimers();
    vi.mocked(readPaneVisible).mockResolvedValue("screen");

    const sync = startPaneTerminalSync("wabc:p1", () => {}, () => {}, 24, false);
    await Promise.resolve();
    vi.advanceTimersByTime(2000);
    await Promise.resolve();

    expect(readPaneVisible).not.toHaveBeenCalled();
    expect(readPaneRecent).not.toHaveBeenCalled();
    sync.dispose();
  });
});
