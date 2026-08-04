import { describe, it, expect } from "vitest";
import {
  createTextNodeData,
  createSquareNodeData,
  createTerminalNodeData,
  createMarkdownNodeData,
  toFlowNode,
} from "./nodes";
import type { CanvasNode } from "./types";

describe("createTextNodeData", () => {
  it("defaults fontSize to 18", () => {
    const data = createTextNodeData({ label: "Auth Refactor" });

    expect(data.fontSize).toBe(18);
    expect(data.label).toBe("Auth Refactor");
  });

  it("accepts custom fontSize", () => {
    const data = createTextNodeData({ label: "Header", fontSize: 24 });

    expect(data.fontSize).toBe(24);
  });
});

describe("createSquareNodeData", () => {
  it("defaults to stroke-only frame with transparent fill", () => {
    const data = createSquareNodeData({ width: 400, height: 300 });

    expect(data.width).toBe(400);
    expect(data.height).toBe(300);
    expect(data.strokeWidth).toBe(2);
    expect(data.strokeStyle).toBe("solid");
    expect(data.fill).toBe("none");
  });
});

describe("createTerminalNodeData", () => {
  it("defaults to idle local shell", () => {
    const data = createTerminalNodeData({
      label: "Planner",
      cwd: "/project",
    });

    expect(data.status).toBe("idle");
    expect(data.herdrPaneId).toBe("");
    expect(data.herdrBound).toBe(false);
    expect(data.outputPreview).toContain("local");
  });
});

describe("createMarkdownNodeData", () => {
  it("defaults title and content", () => {
    const data = createMarkdownNodeData({});
    expect(data.title).toBe("Spec");
    expect(data.content).toContain("Task");
  });
});

describe("toFlowNode", () => {
  it("assigns z-index -1 to square nodes so work nodes render on top", () => {
    const square: CanvasNode = {
      id: "sq-1",
      type: "square",
      position: { x: 0, y: 0 },
      data: createSquareNodeData({ width: 400, height: 300 }),
    };

    const flowNode = toFlowNode(square);

    expect(flowNode.zIndex).toBe(-1);
    expect(flowNode.type).toBe("square");
  });

  it("does not assign negative z-index to text nodes", () => {
    const text: CanvasNode = {
      id: "txt-1",
      type: "text",
      position: { x: 10, y: 10 },
      data: createTextNodeData({ label: "Project A" }),
    };

    const flowNode = toFlowNode(text);

    expect(flowNode.zIndex).toBeUndefined();
  });
});
