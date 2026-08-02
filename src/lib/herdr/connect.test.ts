import { describe, it, expect } from "vitest";
import { parseHerdrServerStatus } from "./connect";

describe("parseHerdrServerStatus", () => {
  it("returns true when status is running", () => {
    expect(parseHerdrServerStatus('{"status":"running","running":true}')).toBe(true);
  });

  it("returns false when server is not running", () => {
    expect(parseHerdrServerStatus('{"status":"not_running","running":false}')).toBe(false);
  });

  it("returns false for invalid json", () => {
    expect(parseHerdrServerStatus("not json")).toBe(false);
  });
});
