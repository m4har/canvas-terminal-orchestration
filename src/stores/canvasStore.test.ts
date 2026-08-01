import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

vi.mock("../lib/herdr/client", () => ({
  herdrStatus: vi.fn().mockResolvedValue(false),
  provisionTerminalPane: vi.fn(),
  dispatchToPane: vi.fn(),
  setHerdrRunner: vi.fn(),
  resetHerdrCache: vi.fn(),
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
      handoff: { open: false, targetId: null, payload: "" },
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

  it("sendHandoff sets terminal working then done", async () => {
    useCanvasStore.getState().loadDemoWorkflow();
    useCanvasStore.getState().openHandoff("term-planner");
    useCanvasStore.getState().sendHandoff("implement auth");
    await Promise.resolve();
    await Promise.resolve();

    let terminal = useCanvasStore.getState().nodes.find((n) => n.id === "term-planner");
    expect(terminal?.data).toMatchObject({ status: "working" });

    vi.advanceTimersByTime(1600);
    await vi.runAllTimersAsync();
    terminal = useCanvasStore.getState().nodes.find((n) => n.id === "term-planner");
    expect(terminal?.data).toMatchObject({ status: "done" });
  });

  it("runParallelFanOut dispatches to fe and be", async () => {
    useCanvasStore.getState().loadDemoWorkflow();
    useCanvasStore.getState().runParallelFanOut();
    await Promise.resolve();
    await Promise.resolve();

    const fe = useCanvasStore.getState().nodes.find((n) => n.id === "term-fe");
    const be = useCanvasStore.getState().nodes.find((n) => n.id === "term-be");
    expect(fe?.data).toMatchObject({ status: "working" });
    expect(be?.data).toMatchObject({ status: "working" });
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
