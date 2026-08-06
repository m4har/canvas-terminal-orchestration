import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

vi.mock("../lib/herdr/connect", () => ({
  connectHerdr: vi.fn().mockResolvedValue(false),
  parseHerdrServerStatus: vi.fn(),
  probeHerdrServer: vi.fn(),
}));

vi.mock("../lib/herdr/client", () => ({
  herdrStatus: vi.fn().mockResolvedValue(false),
  provisionTerminalPane: vi.fn(),
  dispatchToPane: vi.fn().mockResolvedValue({ preview: "$ ok\n", status: "working" }),
  setHerdrRunner: vi.fn(),
  resetHerdrCache: vi.fn(),
}));

vi.mock("../lib/herdr/dispatch", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/herdr/dispatch")>();
  return {
    ...actual,
    reconcileTerminalPanes: vi.fn().mockResolvedValue(undefined),
    provisionNodePane: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock("../lib/herdr/requireHerdr", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/herdr/requireHerdr")>();
  return {
    ...actual,
    assessHerdrReady: vi.fn().mockResolvedValue({ state: "missing", snapshot: {} }),
  };
});

vi.mock("../hooks/useHerdrConnection", () => ({
  refreshHerdrConnection: vi.fn().mockResolvedValue(false),
}));

vi.mock("../lib/herdr/bind", () => ({
  bindHerdrToTerminal: vi.fn().mockResolvedValue("w1:p9"),
  isHerdrBound: (data: { herdrBound?: boolean }) => data.herdrBound === true,
}));

vi.mock("../lib/workflow", () => ({
  setAppSetting: vi.fn().mockResolvedValue(undefined),
  saveCanvas: vi.fn().mockResolvedValue(undefined),
  APP_SETTING_INTRO_COMPLETED: "intro_completed",
  isTauriRuntime: vi.fn(() => false),
}));

import {
  createSquareFlowNode,
  createTextFlowNode,
  useCanvasStore,
} from "./canvasStore";

describe("canvasStore", () => {
  beforeEach(() => {
    useCanvasStore.setState({
      nodes: [],
      edges: [],
      initialized: false,
      introActive: false,
      herdrOnline: null,
      herdrLifecycle: null,
      handoff: { open: false, targetId: null, payload: "" },
      markdownEditor: { open: false, nodeId: null },
      herdrInstall: {
        open: false,
        reason: "bind",
        installing: false,
        installProgress: 0,
        installMessage: "",
      },
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("adds a text node", () => {
    useCanvasStore.getState().addTextNode("Auth Refactor", 24);

    const { nodes } = useCanvasStore.getState();
    expect(nodes).toHaveLength(1);
    expect(nodes[0].type).toBe("text");
    expect(nodes[0].data).toMatchObject({ label: "Auth Refactor", fontSize: 24 });
  });

  it("adds a square frame with default 400x300", () => {
    useCanvasStore.getState().addSquareNode();

    const { nodes } = useCanvasStore.getState();
    expect(nodes).toHaveLength(1);
    expect(nodes[0].type).toBe("square");
    expect(nodes[0].zIndex).toBe(-1);
    expect(nodes[0].data).toMatchObject({ width: 400, height: 300, fill: "none" });
  });

  it("adds terminal and markdown nodes", async () => {
    useCanvasStore.getState().addTerminalNode("Planner", "opencode");
    useCanvasStore.getState().addMarkdownNode("Plan");
    await Promise.resolve();

    const { nodes } = useCanvasStore.getState();
    expect(nodes).toHaveLength(2);
    expect(nodes.find((n) => n.type === "terminal")?.data).toMatchObject({
      label: "Planner",
      status: "idle",
    });
    expect(nodes.find((n) => n.type === "markdown")?.data).toMatchObject({
      title: "Plan",
    });
  });

  it("loads demo workflow with fan-out edges", () => {
    useCanvasStore.getState().loadDemoWorkflow();

    const { nodes, edges } = useCanvasStore.getState();
    expect(nodes.length).toBeGreaterThanOrEqual(6);
    expect(edges).toHaveLength(3);
  });

  it("opens handoff with markdown payload for connected terminal", () => {
    useCanvasStore.getState().loadDemoWorkflow();
    useCanvasStore.getState().openHandoff("term-planner");

    const { handoff } = useCanvasStore.getState();
    expect(handoff.open).toBe(true);
    expect(handoff.payload).toContain("Auth Refactor Plan");
  });

  it("sendHandoff opens herdr install when herdr missing", async () => {
    useCanvasStore.getState().loadDemoWorkflow();
    useCanvasStore.getState().openHandoff("term-planner");
    useCanvasStore.getState().sendHandoff("implement auth");
    await Promise.resolve();
    await Promise.resolve();

    expect(useCanvasStore.getState().herdrInstall.open).toBe(true);
    expect(useCanvasStore.getState().herdrInstall.reason).toBe("handoff");
  });

  it("bindHerdr opens install modal when herdr missing", async () => {
    useCanvasStore.getState().addTerminalNode("T1");
    const termId = useCanvasStore.getState().nodes.find((n) => n.type === "terminal")!.id;
    useCanvasStore.getState().bindHerdr(termId, "pty-1");
    await Promise.resolve();

    expect(useCanvasStore.getState().herdrInstall.open).toBe(true);
    expect(useCanvasStore.getState().herdrInstall.pendingBind?.terminalId).toBe(termId);
  });

  it("sendHandoff dispatches to pane when herdr ready and bound", async () => {
    const { assessHerdrReady } = await import("../lib/herdr/requireHerdr");
    const { dispatchToPane } = await import("../lib/herdr/client");
    vi.mocked(assessHerdrReady).mockResolvedValue({
      state: "ready",
      snapshot: {
        platform: "macos",
        lifecycle: "connected",
        present: true,
        connected: true,
        spawnedByUs: false,
        progress: 1,
        message: "",
      },
    });

    useCanvasStore.getState().loadDemoWorkflow();
    useCanvasStore.setState({
      nodes: useCanvasStore.getState().nodes.map((n) =>
        n.id === "term-planner" && n.type === "terminal"
          ? {
              ...n,
              data: {
                ...(n.data as Record<string, unknown>),
                herdrBound: true,
                herdrPaneId: "w1:p9",
              },
            }
          : n
      ),
    });
    useCanvasStore.getState().openHandoff("term-planner");
    useCanvasStore.getState().sendHandoff("implement auth");
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(dispatchToPane).toHaveBeenCalled();
    const terminal = useCanvasStore.getState().nodes.find((n) => n.id === "term-planner");
    expect(terminal?.data).toMatchObject({ status: "working" });
  });

  it("opens markdown editor for markdown node", () => {
    useCanvasStore.getState().addMarkdownNode("Plan");
    const mdId = useCanvasStore.getState().nodes.find((n) => n.type === "markdown")!.id;

    useCanvasStore.getState().openMarkdownEditor(mdId);

    expect(useCanvasStore.getState().markdownEditor).toEqual({
      open: true,
      nodeId: mdId,
    });
  });

  it("does not open markdown editor for non-markdown node", () => {
    useCanvasStore.getState().addTerminalNode("Planner");
    const termId = useCanvasStore.getState().nodes.find((n) => n.type === "terminal")!.id;

    useCanvasStore.getState().openMarkdownEditor(termId);

    expect(useCanvasStore.getState().markdownEditor).toEqual({
      open: false,
      nodeId: null,
    });
  });

  it("closes markdown editor", () => {
    useCanvasStore.getState().addMarkdownNode("Plan");
    const mdId = useCanvasStore.getState().nodes.find((n) => n.type === "markdown")!.id;
    useCanvasStore.getState().openMarkdownEditor(mdId);

    useCanvasStore.getState().closeMarkdownEditor();

    expect(useCanvasStore.getState().markdownEditor).toEqual({
      open: false,
      nodeId: null,
    });
  });

  it("runParallelFanOut opens install modal when herdr missing", async () => {
    useCanvasStore.getState().loadDemoWorkflow();
    useCanvasStore.getState().runParallelFanOut();
    await Promise.resolve();
    await Promise.resolve();

    expect(useCanvasStore.getState().herdrInstall.open).toBe(true);
  });

  it("completeIntro clears canvas when starting blank", async () => {
    useCanvasStore.getState().loadDemoWorkflow();
    useCanvasStore.setState({ introActive: true });
    useCanvasStore.getState().completeIntro(false);

    const { nodes, edges, introActive } = useCanvasStore.getState();
    expect(nodes).toHaveLength(0);
    expect(edges).toHaveLength(0);
    expect(introActive).toBe(false);
  });

  it("completeIntro keeps demo when requested", () => {
    useCanvasStore.getState().loadDemoWorkflow();
    const before = useCanvasStore.getState().nodes.length;
    useCanvasStore.setState({ introActive: true });
    useCanvasStore.getState().completeIntro(true);

    expect(useCanvasStore.getState().nodes.length).toBe(before);
    expect(useCanvasStore.getState().introActive).toBe(false);
  });
});

describe("createTextFlowNode", () => {
  it("creates xyflow text node", () => {
    const node = createTextFlowNode("Header", 18);
    expect(node.type).toBe("text");
    expect(node.data.label).toBe("Header");
  });
});

describe("createSquareFlowNode", () => {
  it("creates xyflow square node behind work nodes", () => {
    const node = createSquareFlowNode();
    expect(node.zIndex).toBe(-1);
    expect(node.style).toEqual({ width: 400, height: 300 });
  });
});
