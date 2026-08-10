import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const reconnectBoundTerminals = vi.fn().mockResolvedValue(undefined);

vi.mock("../lib/herdr/bind", () => ({
  reconnectBoundTerminals: (...args: unknown[]) => reconnectBoundTerminals(...args),
}));

vi.mock("../lib/workflow", () => ({
  isTauriRuntime: vi.fn(() => true),
}));

vi.mock("../lib/runtimeFlags", () => ({
  isAutomationMode: vi.fn(() => false),
}));

import { isTauriRuntime } from "../lib/workflow";
import { useHerdrTerminalReconnect } from "./useHerdrTerminalReconnect";
import { useCanvasStore } from "../stores/canvasStore";

describe("useHerdrTerminalReconnect", () => {
  afterEach(() => {
    reconnectBoundTerminals.mockClear();
    useCanvasStore.setState({
      initialized: false,
      introActive: false,
      herdrOnline: null,
    });
  });

  it("reconnects bound terminals when canvas is ready and herdr is online", async () => {
    useCanvasStore.setState({
      initialized: true,
      introActive: false,
      herdrOnline: true,
    });

    renderHook(() => useHerdrTerminalReconnect());

    await waitFor(() => {
      expect(reconnectBoundTerminals).toHaveBeenCalled();
    });
  });

  it("does not reconnect before canvas is initialized", () => {
    useCanvasStore.setState({
      initialized: false,
      introActive: false,
      herdrOnline: true,
    });

    renderHook(() => useHerdrTerminalReconnect());

    expect(reconnectBoundTerminals).not.toHaveBeenCalled();
  });

  it("skips in browser dev mode", () => {
    vi.mocked(isTauriRuntime).mockReturnValue(false);
    useCanvasStore.setState({
      initialized: true,
      introActive: false,
      herdrOnline: true,
    });

    renderHook(() => useHerdrTerminalReconnect());

    expect(reconnectBoundTerminals).not.toHaveBeenCalled();
  });
});
