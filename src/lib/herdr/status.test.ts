import { describe, expect, it, vi } from "vitest";
import { fetchHerdrStatus } from "./status";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("../workflow", () => ({
  isTauriRuntime: vi.fn(() => true),
}));

import { invoke } from "@tauri-apps/api/core";

describe("fetchHerdrStatus", () => {
  it("returns snapshot from tauri invoke", async () => {
    vi.mocked(invoke).mockResolvedValue({
      platform: "macos",
      lifecycle: "connected",
      present: true,
      connected: true,
      spawnedByUs: false,
      progress: 1,
      message: "",
    });

    const status = await fetchHerdrStatus();
    expect(status.lifecycle).toBe("connected");
    expect(status.present).toBe(true);
  });
});
