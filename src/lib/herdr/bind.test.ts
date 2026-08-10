import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../workflow", () => ({
  isTauriRuntime: vi.fn(() => false),
}));

vi.mock("./dispatch", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./dispatch")>();
  return {
    ...actual,
    checkHerdrAvailable: vi.fn(async () => true),
  };
});

vi.mock("./client", () => ({
  provisionTerminalPane: vi.fn(),
}));

vi.mock("../pty/client", () => ({
  bindPtyToHerdr: vi.fn(),
  spawnLocalPty: vi.fn().mockResolvedValue("pty-new"),
}));

import {
  bindHerdrToTerminal,
  isHerdrBound,
  isLocalShell,
  rebindHerdrToTerminal,
  reconnectBoundTerminals,
  terminalPaneIdLabel,
} from "./bind";
import { isTauriRuntime } from "../workflow";
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

describe("terminalPaneIdLabel", () => {
  it("shows real pane ids even when herdrBound flag is stale", () => {
    expect(
      terminalPaneIdLabel(
        terminal({ herdrBound: false, herdrPaneId: "w3:p2" })
      )
    ).toBe("w3:p2");
  });

  it("hides demo placeholder pane ids", () => {
    expect(
      terminalPaneIdLabel(
        terminal({ herdrPaneId: "pane-implement" })
      )
    ).toBeNull();
  });
});

describe("bindHerdrToTerminal", () => {
  beforeEach(() => {
    vi.mocked(isTauriRuntime).mockReturnValue(true);
  });

  it("requires a pty id in tauri before binding", async () => {
    const updates: Partial<TerminalNodeData>[] = [];
    const paneId = await bindHerdrToTerminal(
      () => ({
        nodes: [
          {
            id: "t1",
            type: "terminal",
            data: terminal({ label: "T", cwd: "/p" }),
          },
        ],
        updateTerminalNode: (_id, patch) => {
          updates.push(patch);
        },
      }),
      "t1",
      "",
      80,
      24
    );

    expect(paneId).toBeNull();
    expect(updates.at(-1)?.outputPreview).toMatch(/wait for shell/i);
  });

  it("rebinds a fresh pty to a persisted herdr pane", async () => {
    const { bindPtyToHerdr } = await import("../pty/client");
    const updates: Partial<TerminalNodeData>[] = [];
    const paneId = await rebindHerdrToTerminal(
      () => ({
        nodes: [
          {
            id: "t1",
            type: "terminal",
            data: terminal({
              herdrBound: true,
              herdrPaneId: "w3:p2",
              ptyId: "pty-old",
            }),
          },
        ],
        updateTerminalNode: (_id, patch) => {
          updates.push(patch);
        },
      }),
      "t1",
      "pty-new",
      100,
      30
    );

    expect(paneId).toBe("w3:p2");
    expect(bindPtyToHerdr).toHaveBeenCalledWith("pty-new", "w3:p2", 100, 30);
    expect(updates.at(-1)?.outputPreview).toMatch(/reconnected/i);
  });
});

describe("reconnectBoundTerminals", () => {
  beforeEach(() => {
    vi.mocked(isTauriRuntime).mockReturnValue(true);
  });

  it("spawns pty and rebinds each herdr-bound terminal on app open", async () => {
    const { bindPtyToHerdr, spawnLocalPty } = await import("../pty/client");
    const updates: Array<{ id: string; patch: Partial<TerminalNodeData> }> = [];

    await reconnectBoundTerminals(() => ({
      nodes: [
        {
          id: "t1",
          type: "terminal",
          data: terminal({
            herdrBound: true,
            herdrPaneId: "w5:p1",
            cwd: "/project",
          }),
        },
        {
          id: "t2",
          type: "terminal",
          data: terminal({ label: "local", cwd: "/p" }),
        },
      ],
      updateTerminalNode: (id, patch) => {
        updates.push({ id, patch });
      },
    }));

    expect(spawnLocalPty).toHaveBeenCalledWith("/project", 80, 24);
    expect(bindPtyToHerdr).toHaveBeenCalledWith("pty-new", "w5:p1", 80, 24);
    expect(updates.some((u) => u.id === "t1" && u.patch.ptyId === "pty-new")).toBe(
      true
    );
  });
});
