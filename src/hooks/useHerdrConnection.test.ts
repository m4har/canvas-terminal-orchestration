import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useHerdrConnection } from "./useHerdrConnection";

vi.mock("../lib/runtimeFlags", () => ({
  isAutomationMode: vi.fn(() => false),
}));

vi.mock("../lib/herdr/connect", () => ({
  connectHerdr: vi.fn().mockResolvedValue(true),
}));

vi.mock("../lib/herdr/status", () => ({
  fetchHerdrStatus: vi.fn().mockResolvedValue({
    platform: "macos",
    lifecycle: "connected",
    present: true,
    connected: true,
    spawnedByUs: false,
    progress: 1,
    message: "",
  }),
}));

vi.mock("../lib/workflow", () => ({
  isTauriRuntime: vi.fn(() => false),
}));

vi.mock("../lib/herdr/dispatch", () => ({
  checkHerdrAvailable: vi.fn().mockResolvedValue(true),
  reconcileTerminalPanes: vi.fn().mockResolvedValue(undefined),
}));

import { isAutomationMode } from "../lib/runtimeFlags";
import { connectHerdr } from "../lib/herdr/connect";
import { checkHerdrAvailable, reconcileTerminalPanes } from "../lib/herdr/dispatch";
import { useCanvasStore } from "../stores/canvasStore";

describe("useHerdrConnection", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("skips herdr sync in automation mode", async () => {
    vi.mocked(isAutomationMode).mockReturnValue(true);

    renderHook(() => useHerdrConnection());

    await waitFor(() => {
      expect(useCanvasStore.getState().herdrOnline).toBe(false);
    });
    expect(connectHerdr).not.toHaveBeenCalled();
    expect(reconcileTerminalPanes).not.toHaveBeenCalled();
  });

  it("connects and reconciles once when not in automation mode", async () => {
    vi.mocked(isAutomationMode).mockReturnValue(false);

    renderHook(() => useHerdrConnection());

    await waitFor(() => {
      expect(connectHerdr).toHaveBeenCalled();
      expect(checkHerdrAvailable).toHaveBeenCalledWith(false);
      expect(reconcileTerminalPanes).toHaveBeenCalled();
    });
  });
});
