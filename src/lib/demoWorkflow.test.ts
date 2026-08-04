import { describe, it, expect } from "vitest";
import { DEMO_LAYOUT } from "../../shared/demo-layout";
import { createDemoWorkflow } from "./demoWorkflow";

describe("createDemoWorkflow", () => {
  it("creates markdown planner and parallel terminals", () => {
    const { nodes, edges } = createDemoWorkflow();

    expect(nodes.some((n) => n.type === "markdown")).toBe(true);
    expect(nodes.filter((n) => n.type === "terminal")).toHaveLength(3);
    expect(edges).toHaveLength(3);
  });

  it("connects plan to planner then fan-out to fe and be", () => {
    const { edges } = createDemoWorkflow();
    expect(edges.map((e) => e.target)).toContain("term-planner");
    expect(edges.filter((e) => e.source === "term-planner")).toHaveLength(2);
  });

  it("uses landing Auth Refactor layout coordinates", () => {
    const { nodes } = createDemoWorkflow();
    const square = nodes.find((n) => n.id === "sq-auth");
    expect(square?.position).toEqual({ x: DEMO_LAYOUT.square.x, y: DEMO_LAYOUT.square.y });
    expect(square?.data).toMatchObject({
      strokeStyle: "dashed",
      width: DEMO_LAYOUT.square.w,
      height: DEMO_LAYOUT.square.h,
    });
  });
});
