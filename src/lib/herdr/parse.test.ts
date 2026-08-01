import { describe, expect, it } from "vitest";
import workspaceCreate from "./fixtures/workspace_create.json";
import paneSplit from "./fixtures/pane_split.json";
import paneList from "./fixtures/pane_list.json";
import { normalizeAgentStatus, parseHerdrJson, tailLines } from "./parse";
import type {
  PaneListResult,
  PaneSplitResult,
  WorkspaceCreatedResult,
} from "./types";

describe("parseHerdrJson", () => {
  it("parses workspace create fixture", () => {
    const result = parseHerdrJson<WorkspaceCreatedResult>(
      JSON.stringify(workspaceCreate)
    );
    expect(result.workspace.label).toBe("canvas-orchestra");
    expect(result.root_pane.pane_id).toBe("wM:p1");
  });

  it("parses pane split fixture", () => {
    const result = parseHerdrJson<PaneSplitResult>(JSON.stringify(paneSplit));
    expect(result.pane.pane_id).toBe("wM:p2");
  });

  it("parses pane list fixture", () => {
    const result = parseHerdrJson<PaneListResult>(JSON.stringify(paneList));
    expect(result.panes).toHaveLength(2);
  });

  it("throws on herdr error envelope", () => {
    expect(() =>
      parseHerdrJson(
        JSON.stringify({
          id: "cli:test",
          error: { code: "agent_not_found", message: "missing" },
        })
      )
    ).toThrow("agent_not_found");
  });
});

describe("normalizeAgentStatus", () => {
  it("maps unknown to idle", () => {
    expect(normalizeAgentStatus("unknown")).toBe("idle");
    expect(normalizeAgentStatus("working")).toBe("working");
  });
});

describe("tailLines", () => {
  it("keeps last N lines", () => {
    expect(tailLines("a\nb\nc\nd", 2)).toBe("c\nd");
  });
});
