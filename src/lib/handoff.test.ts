import { describe, it, expect } from "vitest";
import { buildHandoffPayload, findEdgeSource } from "./handoff";
import type { Node } from "@xyflow/react";

describe("buildHandoffPayload", () => {
  it("returns markdown title and content for markdown source", () => {
    const source: Node = {
      id: "md-1",
      type: "markdown",
      position: { x: 0, y: 0 },
      data: { title: "Plan", content: "## Do the thing" },
    };
    const target: Node = {
      id: "t-1",
      type: "terminal",
      position: { x: 0, y: 0 },
      data: { label: "Pane" },
    };

    expect(buildHandoffPayload(source, target)).toBe("# Plan\n\n## Do the thing");
  });

  it("returns terminal output tail for terminal source", () => {
    const source: Node = {
      id: "t-1",
      type: "terminal",
      position: { x: 0, y: 0 },
      data: { label: "Planner", outputPreview: "line1\nline2\ndone output" },
    };
    const target: Node = {
      id: "t-2",
      type: "terminal",
      position: { x: 0, y: 0 },
      data: { label: "FE" },
    };

    const payload = buildHandoffPayload(source, target);
    expect(payload).toContain("Planner");
    expect(payload).toContain("done output");
  });
});

describe("findEdgeSource", () => {
  it("finds edge targeting a node", () => {
    const edges = [
      { id: "e1", source: "a", target: "b" },
      { id: "e2", source: "b", target: "c" },
    ];
    expect(findEdgeSource(edges, "c")?.source).toBe("b");
  });
});
