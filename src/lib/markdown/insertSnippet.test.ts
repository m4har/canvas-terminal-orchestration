import { describe, it, expect } from "vitest";
import { insertAtCursor, wrapSelection } from "./insertSnippet";

describe("insertAtCursor", () => {
  it("inserts snippet at cursor", () => {
    const result = insertAtCursor("hello world", { from: 5, to: 5 }, " there");
    expect(result.content).toBe("hello there world");
    expect(result.selection).toEqual({ from: 11, to: 11 });
  });

  it("replaces selection with snippet", () => {
    const result = insertAtCursor("hello world", { from: 6, to: 11 }, "orca");
    expect(result.content).toBe("hello orca");
  });

  it("selects inserted range when selectOffset provided", () => {
    const result = insertAtCursor("ab", { from: 1, to: 1 }, "**x**", { start: 2, end: 3 });
    expect(result.content).toBe("a**x**b");
    expect(result.selection).toEqual({ from: 3, to: 4 });
  });
});

describe("wrapSelection", () => {
  it("wraps selected text", () => {
    const result = wrapSelection("make bold", { from: 5, to: 9 }, "**", "**");
    expect(result.content).toBe("make **bold**");
    expect(result.selection).toEqual({ from: 7, to: 11 });
  });

  it("uses placeholder when selection empty", () => {
    const result = wrapSelection("hello", { from: 5, to: 5 }, "*", "*");
    expect(result.content).toBe("hello*text*");
  });
});
