import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { MarkdownNode } from "./MarkdownNode";
import { createMarkdownNodeData } from "../../../lib/nodes";
import { useCanvasStore } from "../../../stores/canvasStore";

function renderWithFlow(ui: React.ReactElement) {
  return render(<ReactFlowProvider>{ui}</ReactFlowProvider>);
}

vi.mock("../../../stores/canvasStore", () => ({
  useCanvasStore: vi.fn(),
}));

describe("MarkdownNode", () => {
  const updateMarkdownNode = vi.fn();
  const openMarkdownEditor = vi.fn();

  beforeEach(() => {
    cleanup();
    vi.mocked(useCanvasStore).mockImplementation((selector) =>
      selector({ updateMarkdownNode, openMarkdownEditor } as never)
    );
    updateMarkdownNode.mockClear();
    openMarkdownEditor.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders title and markdown preview", () => {
    renderWithFlow(
      <MarkdownNode
        id="md-1"
        type="markdown"
        selected={false}
        dragging={false}
        zIndex={0}
        positionAbsoluteX={0}
        positionAbsoluteY={0}
        data={createMarkdownNodeData({ title: "Plan", content: "# Hello\n\n- item one" })}
      />
    );

    expect(screen.getByText("Plan")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Hello" })).toBeInTheDocument();
    expect(screen.getByText("item one")).toBeInTheDocument();
    expect(screen.getByTestId("node-handle-source")).toBeInTheDocument();
  });

  it("opens markdown editor when clicking preview area", () => {
    renderWithFlow(
      <MarkdownNode
        id="md-1"
        type="markdown"
        selected={false}
        dragging={false}
        zIndex={0}
        positionAbsoluteX={0}
        positionAbsoluteY={0}
        data={createMarkdownNodeData({ title: "Plan", content: "# Hello" })}
      />
    );

    fireEvent.click(screen.getByTestId("markdown-preview"));

    expect(openMarkdownEditor).toHaveBeenCalledWith("md-1");
  });
});
