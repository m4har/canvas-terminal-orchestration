import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { XtermView } from "./XtermView";

const write = vi.fn();
const reset = vi.fn();
const onData = vi.fn();
const dispose = vi.fn();
const fit = vi.fn();
const open = vi.fn();
const writePty = vi.fn();
const spawnLocalPty = vi.fn().mockResolvedValue("pty-1");
const listenPtyOutput = vi.fn().mockResolvedValue(() => {});

vi.mock("../theme/ThemeProvider", () => ({
  useTheme: () => ({ resolved: "dark" as const }),
}));

vi.mock("../../lib/runtimeFlags", () => ({
  isAutomationMode: () => false,
}));

vi.mock("../../lib/workflow", () => ({
  isTauriRuntime: () => true,
}));

vi.mock("../../lib/pty/client", () => ({
  spawnLocalPty: (...args: unknown[]) => spawnLocalPty(...args),
  writePty: (...args: unknown[]) => writePty(...args),
  resizePty: vi.fn(),
  killPty: vi.fn(),
  listenPtyOutput: (...args: unknown[]) => listenPtyOutput(...args),
}));

const readPaneVisible = vi.fn().mockResolvedValue("$ herdr prompt\n");

vi.mock("../../lib/herdr/client", () => ({
  readPaneVisible: (...args: unknown[]) => readPaneVisible(...args),
}));

vi.mock("../../lib/terminal/xtermLoader", () => ({
  loadXterm: async () => ({
    Terminal: class {
      cols = 80;
      rows = 24;
      options = {};
      onData(cb: (data: string) => void) {
        onData.mockImplementation(cb);
      }
      write = write;
      reset = reset;
      open = open;
      resize = vi.fn();
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
  });

  beforeEach(() => {
    class ResizeObserverMock {
      observe = vi.fn();
      disconnect = vi.fn();
    }
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
  });

  it("spawns local pty when active and forwards keystrokes", async () => {
    const onPtyId = vi.fn();
    render(
      <XtermView
        cwd="/project"
        fallbackText="$ local\n"
        lines={10}
        active
        onPtyId={onPtyId}
      />
    );

    await waitFor(() => {
      expect(screen.queryByTestId("terminal-connecting")).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(spawnLocalPty).toHaveBeenCalled();
    });

    onData("a");
    expect(writePty).toHaveBeenCalledWith("pty-1", "a");
    expect(write).not.toHaveBeenCalledWith("a");
  });

  it("uses existing ptyId without spawning again", async () => {
    render(
      <XtermView ptyId="pty-existing" fallbackText="$ ready\n" lines={10} active />
    );

    await waitFor(() => {
      expect(screen.queryByTestId("terminal-connecting")).not.toBeInTheDocument();
    });

    expect(spawnLocalPty).not.toHaveBeenCalled();
    onData("x");
    expect(writePty).toHaveBeenCalledWith("pty-existing", "x");
  });

  it("seeds visible pane output when herdr bound", async () => {
    render(
      <XtermView
        ptyId="pty-1"
        herdrPaneId="w5:p1"
        herdrBound
        lines={10}
        active
      />
    );

    await waitFor(() => {
      expect(readPaneVisible).toHaveBeenCalledWith("w5:p1", 24);
    });

    await waitFor(() => {
      expect(write).toHaveBeenCalledWith("$ herdr prompt\r\n");
    });
    expect(reset).toHaveBeenCalled();
  });
});
