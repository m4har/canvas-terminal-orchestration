import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { SquareNode } from "./SquareNode";

const baseProps = {
  selected: false,
  dragging: false,
  selectable: true,
  deletable: true,
  draggable: true,
  isConnectable: true,
  positionAbsoluteX: 0,
  positionAbsoluteY: 0,
} as const;

describe("SquareNode", () => {
  it("renders stroke-only rect with click-through interior", () => {
    const { container } = render(
      <SquareNode
        id="sq-1"
        type="square"
        zIndex={-1}
        {...baseProps}
        data={{
          width: 400,
          height: 300,
          strokeWidth: 2,
          strokeStyle: "solid",
          fill: "none",
        }}
      />
    );

    const rect = container.querySelector("rect");
    expect(rect).not.toBeNull();
    expect(rect?.getAttribute("fill")).toBe("none");

    const interior = container.querySelector("[data-testid='square-interior']");
    expect(interior).toHaveStyle({ pointerEvents: "none" });
  });

  it("exposes edge drag handles with pointer events", () => {
    const { container } = render(
      <SquareNode
        id="sq-2"
        type="square"
        zIndex={-1}
        {...baseProps}
        data={{
          width: 200,
          height: 150,
          strokeWidth: 2,
          strokeStyle: "solid",
          fill: "none",
        }}
      />
    );

    const handles = container.querySelectorAll(".square-drag-handle");
    expect(handles.length).toBe(4);
    expect(handles[0]).toHaveClass("pointer-events-auto");
  });
});
