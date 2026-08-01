import { describe, expect, it } from "vitest";
import { getProjectCwd } from "./env";

describe("getProjectCwd", () => {
  it("uses repo path on localhost", () => {
    expect(getProjectCwd()).toContain("canvas-orchestra-loop-engineer");
  });
});
