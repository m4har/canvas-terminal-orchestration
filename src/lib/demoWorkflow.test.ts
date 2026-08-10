import { describe, it, expect } from "vitest";
import { DEMO_LAYOUT } from "../../shared/demo-layout";
import { createDemoWorkflow } from "./demoWorkflow";

describe("createDemoWorkflow", () => {
  it("creates markdown agent and parallel terminals", () => {
    const { nodes, edges } = createDemoWorkflow();

    expect(nodes.some((n) => n.type === "markdown")).toBe(true);
    expect(nodes.filter((n) => n.type === "agent")).toHaveLength(1);
    expect(nodes.filter((n) => n.type === "terminal")).toHaveLength(3);
    expect(edges).toHaveLength(4);
  });

  it("connects spec to agent then implement then fan-out", () => {
    const { edges } = createDemoWorkflow();
    expect(edges.map((e) => e.target)).toContain("agent-planner");
    expect(edges.map((e) => e.target)).toContain("term-implement");
    expect(edges.filter((e) => e.source === "term-implement")).toHaveLength(2);
    expect(edges.find((e) => e.source === "md-spec")?.target).toBe("agent-planner");
    expect(edges.find((e) => e.source === "agent-planner")?.target).toBe(
      "term-implement"
    );
  });

  it("uses shared Auth Refactor layout coordinates", () => {
    const { nodes } = createDemoWorkflow();
    const square = nodes.find((n) => n.id === "sq-auth");
    expect(square?.position).toEqual({ x: DEMO_LAYOUT.square.x, y: DEMO_LAYOUT.square.y });
    expect(square?.data).toMatchObject({
      strokeStyle: "dashed",
      width: DEMO_LAYOUT.square.w,
      height: DEMO_LAYOUT.square.h,
    });
    const agent = nodes.find((n) => n.id === "agent-planner");
    expect(agent?.position).toEqual({
      x: DEMO_LAYOUT.agentPlanner.x,
      y: DEMO_LAYOUT.agentPlanner.y,
    });
  });
});
