import { afterEach, describe, expect, it, vi } from "vitest";
import { syncPaneOutput, startPaneTerminalSync } from "./paneTerminal";

vi.mock("./client", () => ({
  readPaneAnsi: vi.fn().mockResolvedValue("screen"),
  sendPaneInput: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./dispatch", () => ({
  isRealHerdrPane: vi.fn((id: string) => id === "wabc:p1"),
}));

import { readPaneAnsi, sendPaneInput } from "./client";

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

  it("skips empty poll while previous snapshot exists", () => {
    expect(syncPaneOutput("abc", "")).toEqual({ action: "skip" });
  });
});

describe("startPaneTerminalSync send", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("fires sendPaneInput without awaiting poll", async () => {
    vi.useFakeTimers();
    let pollCount = 0;
    vi.mocked(readPaneAnsi).mockImplementation(async () => {
      pollCount += 1;
      return `screen-${pollCount}`;
    });

    const sync = startPaneTerminalSync("wabc:p1", () => {}, () => {});
    const sendPromise = sync.send("a");

    await Promise.resolve();
    expect(sendPaneInput).toHaveBeenCalledWith("wabc:p1", "a");
    expect(pollCount).toBe(1);

    await sendPromise;
    expect(pollCount).toBe(1);

    vi.advanceTimersByTime(50);
    await Promise.resolve();
    expect(pollCount).toBe(2);

    sync.dispose();
  });

  it("suppresses reset polls during input grace window", async () => {
    vi.useFakeTimers();
    const onSync = vi.fn();
    let pollCount = 0;
    vi.mocked(readPaneAnsi).mockImplementation(async () => {
      pollCount += 1;
      return `screen-${pollCount}`;
    });

    const sync = startPaneTerminalSync("wabc:p1", onSync, () => {});
    await Promise.resolve();
    onSync.mockClear();

    sync.send("a");
    await Promise.resolve();
    vi.advanceTimersByTime(50);
    await Promise.resolve();

    expect(onSync).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    await Promise.resolve();
    expect(onSync).toHaveBeenCalled();

    sync.dispose();
  });

  it("does not poll when inactive", async () => {
    vi.useFakeTimers();
    let pollCount = 0;
    vi.mocked(readPaneAnsi).mockImplementation(async () => {
      pollCount += 1;
      return `screen-${pollCount}`;
    });

    const sync = startPaneTerminalSync("wabc:p1", () => {}, () => {}, 24, false);
    await Promise.resolve();
    vi.advanceTimersByTime(2000);
    await Promise.resolve();

    expect(pollCount).toBe(0);
    sync.dispose();
  });
});
