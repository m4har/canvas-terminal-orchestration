import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../stores/canvasStore", () => ({
  useCanvasStore: vi.fn(),
}));

vi.mock("../lib/runtimeFlags", () => ({
  isAutomationMode: vi.fn(() => false),
}));

vi.mock("../lib/workflow", () => ({
  loadCanvas: vi.fn(),
  saveCanvas: vi.fn(),
  getAppSetting: vi.fn(),
  dtoToFlowNodes: vi.fn((nodes) => nodes),
  dtoToFlowEdges: vi.fn((edges) => edges),
  APP_SETTING_INTRO_COMPLETED: "intro_completed",
  isTauriRuntime: vi.fn(() => false),
}));

import { useCanvasStore } from "../stores/canvasStore";
import { loadCanvas, saveCanvas, getAppSetting } from "../lib/workflow";
import { useCanvasPersistence } from "./useCanvasPersistence";
import { renderHook, waitFor } from "@testing-library/react";

describe("useCanvasPersistence", () => {
  const hydrate = vi.fn();
  const loadDemoWorkflow = vi.fn();
  const setIntroActive = vi.fn();
  const setInitialized = vi.fn();

  beforeEach(() => {
    hydrate.mockClear();
    loadDemoWorkflow.mockClear();
    setIntroActive.mockClear();
    setInitialized.mockClear();
    vi.mocked(loadCanvas).mockResolvedValue({ nodes: [], edges: [] });
    vi.mocked(saveCanvas).mockResolvedValue(undefined);
    vi.mocked(getAppSetting).mockResolvedValue(null);

    vi.mocked(useCanvasStore).mockImplementation((selector) =>
      selector({
        workflowId: "default",
        nodes: [],
        edges: [],
        introActive: false,
        hydrate,
        loadDemoWorkflow,
        setIntroActive,
        initialized: false,
        setInitialized,
      } as never)
    );
  });

  it("loads demo and activates intro when db is empty and intro not completed", async () => {
    renderHook(() => useCanvasPersistence());

    await waitFor(() => {
      expect(loadDemoWorkflow).toHaveBeenCalled();
      expect(setIntroActive).toHaveBeenCalledWith(true);
      expect(setInitialized).toHaveBeenCalledWith(true);
    });
  });

  it("leaves empty canvas when intro was completed", async () => {
    vi.mocked(getAppSetting).mockResolvedValue("true");

    renderHook(() => useCanvasPersistence());

    await waitFor(() => {
      expect(loadDemoWorkflow).not.toHaveBeenCalled();
      expect(setIntroActive).not.toHaveBeenCalled();
      expect(setInitialized).toHaveBeenCalledWith(true);
    });
  });

  it("hydrates saved canvas when db has nodes", async () => {
    vi.mocked(loadCanvas).mockResolvedValue({
      nodes: [{ id: "n1", node_type: "text", position_x: 0, position_y: 0, data_json: "{}" }],
      edges: [],
    });

    renderHook(() => useCanvasPersistence());

    await waitFor(() => {
      expect(hydrate).toHaveBeenCalled();
      expect(loadDemoWorkflow).not.toHaveBeenCalled();
    });
  });

  it("does not save while intro is active", async () => {
    vi.mocked(useCanvasStore).mockImplementation((selector) =>
      selector({
        workflowId: "default",
        nodes: [{ id: "n1" }],
        edges: [],
        introActive: true,
        hydrate,
        loadDemoWorkflow,
        setIntroActive,
        initialized: true,
        setInitialized,
      } as never)
    );

    renderHook(() => useCanvasPersistence());

    await waitFor(() => {
      expect(saveCanvas).not.toHaveBeenCalled();
    });
  });
});
