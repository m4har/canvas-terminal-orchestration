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

  beforeEach(() => {
    cleanup();
    vi.mocked(useCanvasStore).mockImplementation((selector) =>
      selector({ updateMarkdownNode } as never)
    );
    updateMarkdownNode.mockClear();
  });

  it("renders title and editable content", () => {
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

    expect(screen.getByText("Plan")).toBeInTheDocument();
    expect(screen.getByDisplayValue("# Hello")).toBeInTheDocument();
    expect(screen.getByTestId("node-handle-source")).toBeInTheDocument();
  });

  it("calls updateMarkdownNode on edit", () => {
    renderWithFlow(
      <MarkdownNode
        id="md-1"
        type="markdown"
        selected={false}
        dragging={false}
        zIndex={0}
        positionAbsoluteX={0}
        positionAbsoluteY={0}
        data={createMarkdownNodeData({ title: "Plan", content: "old" })}
      />
    );

    fireEvent.change(screen.getByTestId("markdown-editor"), {
      target: { value: "new content" },
    });

    expect(updateMarkdownNode).toHaveBeenCalledWith("md-1", { content: "new content" });
  });
});
