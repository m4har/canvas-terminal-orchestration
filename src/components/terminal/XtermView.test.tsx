import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { XtermView } from "./XtermView";

const write = vi.fn();
const reset = vi.fn();
const onData = vi.fn();
const dispose = vi.fn();
const fit = vi.fn();
const open = vi.fn();

vi.mock("../theme/ThemeProvider", () => ({
  useTheme: () => ({ resolved: "dark" as const }),
}));

vi.mock("../../lib/herdr/dispatch", () => ({
  isRealHerdrPane: (id: string) => /^w[a-zA-Z0-9]+:p\d+$/.test(id),
}));

vi.mock("../../lib/runtimeFlags", () => ({
  isAutomationMode: () => false,
}));

const syncInstances: Array<{
  send: ReturnType<typeof vi.fn>;
  pushMock: ReturnType<typeof vi.fn>;
  dispose: ReturnType<typeof vi.fn>;
}> = [];

vi.mock("../../lib/herdr/paneTerminal", () => ({
  startPaneTerminalSync: vi.fn(() => {
    const instance = {
      send: vi.fn(),
      pushMock: vi.fn(),
      dispose: vi.fn(),
    };
    syncInstances.push(instance);
    return instance;
  }),
}));

vi.mock("../../lib/terminal/xtermLoader", () => ({
  loadXterm: async () => ({
    Terminal: class {
      options = {};
      onData(cb: (data: string) => void) {
        onData.mockImplementation(cb);
      }
      write = write;
      reset = reset;
      open = open;
      loadAddon = vi.fn();
      dispose = dispose;
    },
  }),
  loadFitAddon: async () => ({
    FitAddon: class {
      fit = fit;
    },
  }),
}));

describe("XtermView", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    syncInstances.length = 0;
  });

  beforeEach(() => {
    class ResizeObserverMock {
      observe = vi.fn();
      disconnect = vi.fn();
    }
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
  });

  it("does not show connecting again when paneId upgrades to live pane", async () => {
    const { rerender } = render(
      <XtermView paneId="pane-1" fallbackText="$ connecting\n" lines={10} />
    );

    await waitFor(() => {
      expect(screen.queryByTestId("terminal-connecting")).not.toBeInTheDocument();
    });

    rerender(
      <XtermView
        paneId="w1:p13"
        fallbackText="$ pane w1:p13\n# shell ready\n"
        lines={10}
      />
    );

    expect(screen.queryByTestId("terminal-connecting")).not.toBeInTheDocument();
    expect(syncInstances).toHaveLength(2);
    expect(reset).toHaveBeenCalled();
  });

  it("keeps terminal ready while typing on live pane", async () => {
    render(
      <XtermView paneId="w1:p13" fallbackText="$ pane w1:p13\n# shell ready\n" lines={10} />
    );

    await waitFor(() => {
      expect(screen.queryByTestId("terminal-connecting")).not.toBeInTheDocument();
    });

    onData("a");
    syncInstances.at(-1)?.send("a");

    expect(screen.queryByTestId("terminal-connecting")).not.toBeInTheDocument();
    expect(write).toHaveBeenCalledWith("a");
  });
});
