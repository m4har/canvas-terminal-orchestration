import { describe, it, expect } from "vitest";
import { flowPositionAtViewportCenter } from "./viewportCenter";

describe("flowPositionAtViewportCenter", () => {
  it("centers node at viewport middle", () => {
    const container = {
      getBoundingClientRect: () => ({
        left: 100,
        top: 50,
        width: 800,
        height: 600,
        right: 900,
        bottom: 650,
        x: 100,
        y: 50,
        toJSON: () => ({}),
      }),
    } as HTMLElement;

    const screenToFlowPosition = ({ x, y }: { x: number; y: number }) => ({
      x: x - 100,
      y: y - 50,
    });

    const pos = flowPositionAtViewportCenter(
      screenToFlowPosition,
      container,
      288,
      200
    );

    expect(pos).toEqual({ x: 256, y: 200 });
  });

  it("returns origin when container is missing", () => {
    const pos = flowPositionAtViewportCenter(
      () => ({ x: 0, y: 0 }),
      null,
      100,
      100
    );
    expect(pos).toEqual({ x: 0, y: 0 });
  });
});
