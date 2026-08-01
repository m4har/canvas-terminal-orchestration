import { describe, it, expect } from "vitest";
import type { Node } from "@xyflow/react";
import { applyCanvasNodeChanges } from "./nodeDimensions";

describe("applyCanvasNodeChanges", () => {
  it("syncs square resize into node data", () => {
    const nodes: Node[] = [
      {
        id: "sq-1",
        type: "square",
        position: { x: 0, y: 0 },
        zIndex: -1,
        style: { width: 400, height: 300 },
        data: { width: 400, height: 300, strokeWidth: 2, strokeStyle: "solid", fill: "none" },
      },
    ];

    const next = applyCanvasNodeChanges(nodes, [
      {
        id: "sq-1",
        type: "dimensions",
        dimensions: { width: 500, height: 350 },
        resizing: false,
        setAttributes: true,
      },
    ]);

    expect(next[0].style).toEqual({ width: 500, height: 350 });
    expect(next[0].data).toMatchObject({ width: 500, height: 350 });
  });
});
