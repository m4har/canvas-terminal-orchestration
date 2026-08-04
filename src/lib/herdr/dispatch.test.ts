import { describe, expect, it } from "vitest";
import { isRealHerdrPane } from "./dispatch";

describe("isRealHerdrPane", () => {
  it("accepts alphanumeric herdr pane ids", () => {
    expect(isRealHerdrPane("w1:p9")).toBe(true);
    expect(isRealHerdrPane("w1:pG")).toBe(true);
    expect(isRealHerdrPane("wM:p2")).toBe(true);
    expect(isRealHerdrPane("wabc:p1")).toBe(true);
  });

  it("rejects placeholder pane ids", () => {
    expect(isRealHerdrPane("pane-1")).toBe(false);
    expect(isRealHerdrPane("pane-planner")).toBe(false);
  });
});
