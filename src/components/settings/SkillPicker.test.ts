import { describe, it, expect } from "vitest";
import { parseProfileSkills, serializeProfileSkills } from "./SkillPicker";

describe("profile skills json", () => {
  it("parses skill name array from json", () => {
    expect(parseProfileSkills('["tdd","domain-modeling"]')).toEqual([
      "tdd",
      "domain-modeling",
    ]);
  });

  it("returns empty array for invalid json", () => {
    expect(parseProfileSkills("not-json")).toEqual([]);
  });

  it("serializes skills to json array", () => {
    expect(serializeProfileSkills(["planner"])).toBe('["planner"]');
  });
});
