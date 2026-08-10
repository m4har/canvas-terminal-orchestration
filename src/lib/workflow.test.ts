import { describe, it, expect, vi, beforeEach } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { saveCanvas } from "./workflow";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

describe("workflow persistence", () => {
  beforeEach(() => {
    vi.stubGlobal("__TAURI_INTERNALS__", {});
    vi.mocked(invoke).mockReset();
    vi.mocked(invoke).mockResolvedValue(undefined);
  });

  it("wraps save_canvas payload for tauri command", async () => {
    await saveCanvas("default", [], []);

    expect(invoke).toHaveBeenCalledWith("save_canvas", {
      payload: {
        workflowId: "default",
        nodes: [],
        edges: [],
      },
    });
  });
});
