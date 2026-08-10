import { describe, expect, it } from "vitest";
import { suggestAgentSlug } from "./agentSlug";

describe("suggestAgentSlug", () => {
  const existing = [{ slug: "my-agent" }, { slug: "agent-1" }];

  it("returns seed when unused", () => {
    expect(suggestAgentSlug([], "agent-2")).toBe("agent-2");
  });

  it("appends suffix when seed collides", () => {
    expect(suggestAgentSlug(existing, "my-agent")).toBe("my-agent-2");
    expect(suggestAgentSlug(existing, "agent-1")).toBe("agent-1-2");
  });

  it("normalizes invalid characters", () => {
    expect(suggestAgentSlug([], "Agent #3")).toBe("agent-3");
  });

  it("falls back to agent when seed is empty", () => {
    expect(suggestAgentSlug([{ slug: "agent" }], "   ")).toBe("agent-2");
  });
});
