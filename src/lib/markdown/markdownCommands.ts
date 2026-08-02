import type { TextSelection } from "./insertSnippet";
import { insertAtCursor, wrapSelection } from "./insertSnippet";

export type MarkdownCommand =
  | "paragraph"
  | "heading1"
  | "heading2"
  | "heading3"
  | "heading4"
  | "bold"
  | "italic"
  | "strike"
  | "bulletList"
  | "orderedList"
  | "taskList"
  | "quote"
  | "link"
  | "codeBlock"
  | "mermaid";

const MERMAID_TEMPLATE = `\n\`\`\`mermaid
flowchart TD
  A[Start] --> B[End]
\`\`\`\n`;

export function runMarkdownCommand(
  command: MarkdownCommand,
  content: string,
  selection: TextSelection
): { content: string; selection: TextSelection } {
  switch (command) {
    case "paragraph":
      return prefixCurrentLine(content, selection, "");
    case "heading1":
      return prefixCurrentLine(content, selection, "# ");
    case "heading2":
      return prefixCurrentLine(content, selection, "## ");
    case "heading3":
      return prefixCurrentLine(content, selection, "### ");
    case "heading4":
      return prefixCurrentLine(content, selection, "#### ");
    case "bold":
      return wrapSelection(content, selection, "**", "**");
    case "italic":
      return wrapSelection(content, selection, "*", "*");
    case "strike":
      return wrapSelection(content, selection, "~~", "~~");
    case "bulletList":
      return prefixCurrentLine(content, selection, "- ");
    case "orderedList":
      return prefixCurrentLine(content, selection, "1. ");
    case "taskList":
      return prefixCurrentLine(content, selection, "- [ ] ");
    case "quote":
      return prefixCurrentLine(content, selection, "> ");
    case "link":
      return wrapSelection(content, selection, "[", "](url)", "link text");
    case "codeBlock":
      return insertAtCursor(content, selection, "\n```\ncode\n```\n", { start: 5, end: 9 });
    case "mermaid":
      return insertAtCursor(content, selection, MERMAID_TEMPLATE, { start: 13, end: 18 });
    default:
      return { content, selection };
  }
}

function prefixCurrentLine(
  content: string,
  selection: TextSelection,
  prefix: string
): { content: string; selection: TextSelection } {
  const lineStart = content.lastIndexOf("\n", selection.from - 1) + 1;
  const lineEnd = content.indexOf("\n", selection.from);
  const end = lineEnd === -1 ? content.length : lineEnd;
  const line = content.slice(lineStart, end);
  const stripped = line.replace(/^#{1,6}\s+/, "").replace(/^>\s+/, "").replace(/^[-*+]\s+/, "").replace(/^- \[[ x]\]\s+/, "").replace(/^\d+\.\s+/, "");
  const nextLine = prefix + stripped;
  const nextContent = content.slice(0, lineStart) + nextLine + content.slice(end);
  const cursor = lineStart + nextLine.length;
  return { content: nextContent, selection: { from: cursor, to: cursor } };
}
