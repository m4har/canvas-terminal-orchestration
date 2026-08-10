import { describe, it, expect } from "vitest";
import type { Connection, Edge, Node } from "@xyflow/react";
import {
  canAddHandoffEdge,
  createHandoffEdge,
  findDownstreamMarkdownIds,
  findMirrorTerminalId,
  isValidHandoffConnection,
} from "./edgeRules";

const markdown: Node = { id: "md-1", type: "markdown", position: { x: 0, y: 0 }, data: {} };
const terminal: Node = { id: "t-1", type: "terminal", position: { x: 0, y: 0 }, data: {} };
const agent: Node = { id: "a-1", type: "agent", position: { x: 0, y: 0 }, data: {} };
const text: Node = { id: "txt-1", type: "text", position: { x: 0, y: 0 }, data: {} };

function conn(source: string, target: string): Connection {
  return { source, target, sourceHandle: null, targetHandle: null };
}

describe("isValidHandoffConnection", () => {
  it("allows markdown to terminal", () => {
    expect(isValidHandoffConnection(conn("md-1", "t-1"), markdown, terminal)).toBe(true);
  });

  it("allows markdown to agent", () => {
    expect(isValidHandoffConnection(conn("md-1", "a-1"), markdown, agent)).toBe(true);
  });

  it("allows agent to terminal", () => {
    expect(isValidHandoffConnection(conn("a-1", "t-1"), agent, terminal)).toBe(true);
  });

  it("allows terminal to terminal", () => {
    const t2: Node = { id: "t-2", type: "terminal", position: { x: 0, y: 0 }, data: {} };
    expect(isValidHandoffConnection(conn("t-1", "t-2"), terminal, t2)).toBe(true);
  });

  it("allows agent to markdown", () => {
    expect(isValidHandoffConnection(conn("a-1", "md-1"), agent, markdown)).toBe(true);
  });

  it("rejects terminal to markdown", () => {
    expect(isValidHandoffConnection(conn("t-1", "md-1"), terminal, markdown)).toBe(false);
  });

  it("rejects text as source or target", () => {
    expect(isValidHandoffConnection(conn("txt-1", "t-1"), text, terminal)).toBe(false);
    expect(isValidHandoffConnection(conn("md-1", "txt-1"), markdown, text)).toBe(false);
  });

  it("rejects markdown as target from terminal", () => {
    expect(isValidHandoffConnection(conn("t-1", "md-1"), terminal, markdown)).toBe(false);
  });

  it("rejects self-connection", () => {
    expect(isValidHandoffConnection(conn("t-1", "t-1"), terminal, terminal)).toBe(false);
  });

  it("rejects duplicate edge", () => {
    const edges: Edge[] = [{ id: "e1", source: "md-1", target: "t-1" }];
    expect(canAddHandoffEdge(conn("md-1", "t-1"), edges, markdown, terminal)).toBe(false);
  });

  it("rejects second incoming edge to same terminal", () => {
    const edges: Edge[] = [{ id: "e1", source: "md-1", target: "t-1" }];
    const t2: Node = { id: "t-2", type: "terminal", position: { x: 0, y: 0 }, data: {} };
    expect(canAddHandoffEdge(conn("t-2", "t-1"), edges, t2, terminal)).toBe(false);
  });
});

describe("createHandoffEdge", () => {
  it("creates handoff edge with stable id", () => {
    const edge = createHandoffEdge(conn("md-1", "t-1"));
    expect(edge).toEqual({
      id: "e-md-1-t-1",
      source: "md-1",
      target: "t-1",
      type: "handoff",
      label: "handoff",
      animated: true,
    });
  });
});

describe("findMirrorTerminalId", () => {
  it("returns terminal downstream of agent by node type", () => {
    const edges: Edge[] = [{ id: "e1", source: "a-1", target: "term-2" }];
    const nodes: Node[] = [
      agent,
      { id: "term-2", type: "terminal", position: { x: 0, y: 0 }, data: {} },
    ];
    expect(findMirrorTerminalId(edges, "a-1", nodes)).toBe("term-2");
  });
});

describe("findDownstreamMarkdownIds", () => {
  it("returns markdown nodes downstream of agent", () => {
    const edges: Edge[] = [
      { id: "e1", source: "a-1", target: "md-2" },
      { id: "e2", source: "a-1", target: "term-1" },
    ];
    const nodes: Node[] = [
      agent,
      { id: "md-2", type: "markdown", position: { x: 0, y: 0 }, data: {} },
      terminal,
    ];
    expect(findDownstreamMarkdownIds(edges, "a-1", nodes)).toEqual(["md-2"]);
  });
});
