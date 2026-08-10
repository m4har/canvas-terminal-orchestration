import { beforeEach, describe, expect, it, vi } from "vitest";
import { runHandoff } from "./dispatch";
import type { TerminalNodeData } from "../types";

const orchestratorDispatch = vi.fn();
const dispatchToPane = vi.fn();

vi.mock("../orchestrator/client", () => ({
  orchestratorDispatch: (...args: unknown[]) => orchestratorDispatch(...args),
}));

vi.mock("./client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./client")>();
  return {
    ...actual,
    dispatchToPane: (...args: unknown[]) => dispatchToPane(...args),
    herdrStatus: vi.fn(async () => true),
    paneExists: vi.fn(async () => true),
    provisionTerminalPane: vi.fn(),
  };
});

vi.mock("./connect", () => ({
  connectHerdr: vi.fn(async () => true),
}));

vi.mock("../workflow", () => ({
  isTauriRuntime: vi.fn(() => true),
}));

function makeStore(terminal: TerminalNodeData, id = "term-1") {
  const nodes = [{ id, type: "terminal", data: terminal }];
  const updates: Array<{ id: string; patch: Partial<TerminalNodeData> }> = [];

  const get = () => ({
    nodes,
    updateTerminalNode: (nodeId: string, patch: Partial<TerminalNodeData>) => {
      updates.push({ id: nodeId, patch });
      const node = nodes.find((n) => n.id === nodeId);
      if (node) node.data = { ...node.data, ...patch };
    },
    openHerdrInstall: vi.fn(),
  });

  const set = vi.fn();
  return { get, set, updates };
}

describe("runHandoff LocalShell", () => {
  beforeEach(() => {
    orchestratorDispatch.mockReset();
    dispatchToPane.mockReset();
    orchestratorDispatch.mockResolvedValue(undefined);
  });

  it("uses orchestrator dispatch without Herdr bind", async () => {
    const { get, set, updates } = makeStore({
      label: "Agent",
      herdrPaneId: "pane-local",
      cwd: "/project",
      status: "idle",
      outputPreview: "",
      ptyId: "pty-42",
      herdrBound: false,
    });

    await runHandoff(get, set, "term-1", "ship it");

    expect(orchestratorDispatch).toHaveBeenCalledWith("pty-42", "ship it", undefined);
    expect(dispatchToPane).not.toHaveBeenCalled();
    expect(updates.some((u) => u.patch.status === "working")).toBe(true);
  });

  it("keeps Herdr path when node is HerdrBound", async () => {
    dispatchToPane.mockResolvedValue({ preview: "$ done", status: "done" });
    const { get, set } = makeStore({
      label: "Agent",
      herdrPaneId: "w1:p9",
      cwd: "/project",
      status: "idle",
      outputPreview: "",
      ptyId: "pty-42",
      herdrBound: true,
    });

    await runHandoff(get, set, "term-1", "review");

    expect(orchestratorDispatch).not.toHaveBeenCalled();
    expect(dispatchToPane).toHaveBeenCalled();
  });
});
