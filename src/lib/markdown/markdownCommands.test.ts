import { describe, it, expect } from "vitest";
import { runMarkdownCommand } from "./markdownCommands";

describe("runMarkdownCommand", () => {
  it("wraps selection in bold", () => {
    const result = runMarkdownCommand("bold", "hello world", { from: 6, to: 11 });
    expect(result.content).toBe("hello **world**");
  });

  it("prefixes current line as heading 2", () => {
    const result = runMarkdownCommand("heading2", "Title\nBody", { from: 0, to: 0 });
    expect(result.content).toBe("## Title\nBody");
  });

  it("inserts mermaid template", () => {
    const result = runMarkdownCommand("mermaid", "", { from: 0, to: 0 });
    expect(result.content).toContain("```mermaid");
    expect(result.content).toContain("flowchart TD");
  });
});
