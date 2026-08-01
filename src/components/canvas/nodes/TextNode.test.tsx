import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { TextNode } from "./TextNode";

vi.mock("../../../stores/canvasStore", () => ({
  useCanvasStore: (selector: (s: { updateTextNode: ReturnType<typeof vi.fn> }) => unknown) =>
    selector({ updateTextNode: vi.fn() }),
}));

const baseProps = {
  id: "txt-1",
  selected: false,
  type: "text" as const,
  zIndex: 0,
  dragging: false,
  selectable: true,
  deletable: true,
  draggable: true,
  isConnectable: true,
  positionAbsoluteX: 0,
  positionAbsoluteY: 0,
};

describe("TextNode", () => {
  afterEach(() => cleanup());

  it("renders label with configured fontSize", () => {
    const { container } = render(
      <TextNode
        {...baseProps}
        data={{ label: "Auth Refactor", fontSize: 24 }}
      />
    );

    expect(screen.getByTestId("text-label")).toHaveTextContent("Auth Refactor");
    expect(container.firstChild).toHaveStyle({ fontSize: "24px" });
  });

  it("enters edit mode on double click", () => {
    render(
      <TextNode
        {...baseProps}
        data={{ label: "Auth Refactor", fontSize: 18 }}
      />
    );

    fireEvent.doubleClick(screen.getByTestId("text-label"));
    expect(screen.getByTestId("text-label-input")).toBeInTheDocument();
  });
});
