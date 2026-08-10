import { describe, expect, it } from "vitest";
import type { Node } from "@xyflow/react";
import { dtoToFlowNode, nodeToDto } from "./canvasSerde";

describe("canvasSerde", () => {
  it("round-trips node style and zIndex", () => {
    const node: Node = {
      id: "term-1",
      type: "terminal",
      position: { x: 10, y: 20 },
      style: { width: 300, height: 180 },
      zIndex: 0,
      data: { label: "Planner", herdrPaneId: "wM:p2", cwd: "/p", status: "idle", outputPreview: "" },
    };

    const restored = dtoToFlowNode(nodeToDto(node));
    expect(restored.style).toEqual({ width: 300, height: 180 });
    expect(restored.data).toMatchObject({ label: "Planner", herdrPaneId: "wM:p2" });
  });

  it("does not persist ephemeral ptyId on terminal nodes", () => {
    const node: Node = {
      id: "term-1",
      type: "terminal",
      position: { x: 0, y: 0 },
      data: {
        label: "T",
        herdrPaneId: "wM:p2",
        herdrBound: true,
        cwd: "/p",
        status: "idle",
        outputPreview: "",
        ptyId: "pty-dead",
      },
    };

    const dto = nodeToDto(node);
    expect(JSON.parse(dto.data_json)).not.toHaveProperty("ptyId");

    const restored = dtoToFlowNode(dto);
    expect((restored.data as { ptyId?: string }).ptyId).toBeUndefined();
  });

  it("strips legacy ptyId when loading old snapshots", () => {
    const dto = {
      id: "term-1",
      node_type: "terminal",
      position_x: 0,
      position_y: 0,
      data_json: JSON.stringify({
        label: "T",
        herdrPaneId: "wM:p2",
        herdrBound: true,
        cwd: "/p",
        status: "idle",
        outputPreview: "",
        ptyId: "pty-dead",
      }),
    };

    const restored = dtoToFlowNode(dto);
    expect((restored.data as { ptyId?: string }).ptyId).toBeUndefined();
  });

  it("restores square defaults when meta missing", () => {
    const dto = {
      id: "sq-1",
      node_type: "square",
      position_x: 0,
      position_y: 0,
      data_json: JSON.stringify({
        width: 400,
        height: 300,
        strokeWidth: 2,
        strokeStyle: "solid",
        fill: "none",
      }),
    };

    const node = dtoToFlowNode(dto);
    expect(node.zIndex).toBe(-1);
    expect(node.dragHandle).toBe(".square-drag-handle");
    expect(node.style).toEqual({ width: 400, height: 300 });
  });
});
