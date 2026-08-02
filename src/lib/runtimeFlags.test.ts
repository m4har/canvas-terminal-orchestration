import { describe, expect, it } from "vitest";
import { isAutomationMode } from "./runtimeFlags";

describe("isAutomationMode", () => {
  it("returns true when e2e query param is present", () => {
    expect(isAutomationMode("?e2e=1")).toBe(true);
    expect(isAutomationMode("?foo=1&e2e")).toBe(true);
  });

  it("returns false without e2e param", () => {
    expect(isAutomationMode("")).toBe(false);
    expect(isAutomationMode("?foo=1")).toBe(false);
  });
});
