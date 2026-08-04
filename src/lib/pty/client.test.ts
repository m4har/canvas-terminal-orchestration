import { describe, expect, it, vi, beforeEach } from "vitest";

const invoke = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invoke(...args),
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn().mockResolvedValue(() => {}),
}));

vi.mock("../workflow", () => ({
  isTauriRuntime: () => false,
}));

import { spawnLocalPty, writePty } from "./client";

describe("pty client (browser)", () => {
  beforeEach(() => {
    invoke.mockReset();
  });

  it("returns mock pty id without invoke", async () => {
    const id = await spawnLocalPty("/tmp");
    expect(id).toBe("mock-pty");
    expect(invoke).not.toHaveBeenCalled();
  });

  it("skips write for mock pty", async () => {
    await writePty("mock-pty", "ls\n");
    expect(invoke).not.toHaveBeenCalled();
  });
});
