import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { Canvas } from "./Canvas";
import { useCanvasStore } from "../../stores/canvasStore";

vi.mock("../theme/ThemeProvider", () => ({
  useTheme: () => ({
    theme: "light",
    resolved: "light",
    setTheme: vi.fn(),
    toggleTheme: vi.fn(),
  }),
}));

vi.mock("@xyflow/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@xyflow/react")>();
  return {
    ...actual,
    ReactFlow: ({
      children,
      nodes,
      nodeTypes,
    }: {
      children?: React.ReactNode;
      nodes: unknown[];
      nodeTypes?: Record<string, unknown>;
    }) => (
      <div
        data-testid="react-flow"
        data-node-count={nodes.length}
        data-node-types={Object.keys(nodeTypes ?? {}).join(",")}
      >
        {children}
      </div>
    ),
    Background: () => <div data-testid="canvas-background" />,
    Controls: () => <div data-testid="canvas-controls" />,
  };
});

function renderCanvas() {
  return render(
    <ReactFlowProvider>
      <Canvas />
    </ReactFlowProvider>
  );
}

beforeEach(() => {
  useCanvasStore.setState({
    nodes: [],
    edges: [],
    handoff: { open: false, targetId: null, payload: "" },
  });
});

afterEach(() => {
  cleanup();
});

describe("Canvas", () => {
  it("renders dot grid background", () => {
    renderCanvas();
    expect(screen.getByTestId("canvas-background")).toBeInTheDocument();
  });

  it("registers all mvp node types", () => {
    renderCanvas();
    const flow = screen.getByTestId("react-flow");
    expect(flow.getAttribute("data-node-types")).toBe("text,square,terminal,markdown");
  });

  it("renders nodes from store", () => {
    useCanvasStore.getState().loadDemoWorkflow();
    renderCanvas();
    const flow = screen.getByTestId("react-flow");
    expect(Number(flow.getAttribute("data-node-count"))).toBeGreaterThan(0);
  });
});
