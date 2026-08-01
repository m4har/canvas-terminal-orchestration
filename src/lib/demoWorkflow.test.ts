import { describe, it, expect } from "vitest";
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
});
