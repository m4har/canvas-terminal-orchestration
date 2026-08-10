import { describe, it, expect } from "vitest";
import type { Node } from "@xyflow/react";
import { buildPlayPayload } from "./handoff";

describe("buildPlayPayload", () => {
  it("prefills from upstream markdown", () => {
    const md: Node = {
      id: "md-1",
      type: "markdown",
      position: { x: 0, y: 0 },
      data: { title: "Spec", content: "Do the thing." },
    };
    expect(buildPlayPayload(md)).toBe("# Spec\n\nDo the thing.");
  });

  it("returns empty for non-markdown source", () => {
    const terminal: Node = {
      id: "t-1",
      type: "terminal",
      position: { x: 0, y: 0 },
      data: {},
    };
    expect(buildPlayPayload(terminal)).toBe("");
  });
});
