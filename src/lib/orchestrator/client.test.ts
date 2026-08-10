import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  orchestratorDispatch,
  orchestratorForceDone,
} from "./client";

const invoke = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invoke(...args),
}));

vi.mock("../workflow", () => ({
  isTauriRuntime: vi.fn(() => true),
}));

describe("orchestrator client", () => {
  beforeEach(() => {
    invoke.mockReset();
  });

  it("dispatches handoff payload to Tauri bus", async () => {
    await orchestratorDispatch("pty-1", "implement feature", "claude");
    expect(invoke).toHaveBeenCalledWith("orchestrator_dispatch", {
      ptyId: "pty-1",
      text: "implement feature",
      agentKind: "claude",
    });
  });

  it("forces done on a pty session", async () => {
    await orchestratorForceDone("pty-1");
    expect(invoke).toHaveBeenCalledWith("orchestrator_force_done", {
      ptyId: "pty-1",
    });
  });
});
