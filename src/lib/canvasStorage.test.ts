import { describe, expect, it, beforeEach } from "vitest";
import type { Node } from "@xyflow/react";
import { loadCanvasFromStorage, saveCanvasToStorage } from "./canvasStorage";

describe("canvasStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("persists and restores canvas snapshot", () => {
    const nodes: Node[] = [
      {
        id: "text-1",
        type: "text",
        position: { x: 12, y: 34 },
        style: { width: 200, height: 56 },
        data: { label: "Saved", fontSize: 20 },
      },
    ];

    saveCanvasToStorage("default", nodes, []);
    const restored = loadCanvasFromStorage("default");

    expect(restored.nodes).toHaveLength(1);
    expect(restored.nodes[0].data).toMatchObject({ label: "Saved", fontSize: 20 });
    expect(restored.nodes[0].style).toEqual({ width: 200, height: 56 });
  });
});
