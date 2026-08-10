import { describe, it, expect, vi, beforeEach } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { createAgentProfile, listOrchestraAgents } from "./client";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

describe("orchestra client", () => {
  beforeEach(() => {
    vi.stubGlobal("__TAURI_INTERNALS__", {});
    vi.mocked(invoke).mockReset();
  });

  it("lists orchestra agents via tauri", async () => {
    vi.mocked(invoke).mockResolvedValue([
      {
        id: "a1",
        slug: "planner-bot",
        profile_id: "planner",
        model: "gpt-4o",
        skill_paths: [],
        mcp_server_ids: [],
        created_at: "0",
        updated_at: "0",
      },
    ]);

    const agents = await listOrchestraAgents();
    expect(agents).toHaveLength(1);
    expect(agents[0].slug).toBe("planner-bot");
    expect(invoke).toHaveBeenCalledWith("orchestra_agent_list");
  });

  it("creates agent profile via tauri", async () => {
    vi.mocked(invoke).mockResolvedValue({
      id: "my-planner",
      name: "My Planner",
      system_prompt_template: "You plan.",
      default_skills_json: '["tdd"]',
      is_bundled: false,
    });

    const profile = await createAgentProfile({
      id: "my-planner",
      name: "My Planner",
      system_prompt_template: "You plan.",
      default_skills_json: '["tdd"]',
    });

    expect(profile.id).toBe("my-planner");
    expect(invoke).toHaveBeenCalledWith("orchestra_agent_profile_create", {
      input: {
        id: "my-planner",
        name: "My Planner",
        system_prompt_template: "You plan.",
        default_skills_json: '["tdd"]',
      },
    });
  });
});
