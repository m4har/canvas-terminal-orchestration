export interface TextSelection {
  from: number;
  to: number;
}

export function insertAtCursor(
  content: string,
  selection: TextSelection,
  snippet: string,
  selectOffset?: { start: number; end: number }
): { content: string; selection: TextSelection } {
  const { from, to } = selection;
  const next = content.slice(0, from) + snippet + content.slice(to);
  if (selectOffset) {
    const anchor = from + selectOffset.start;
    const head = from + selectOffset.end;
    return { content: next, selection: { from: anchor, to: head } };
  }
  const cursor = from + snippet.length;
  return { content: next, selection: { from: cursor, to: cursor } };
}

export function wrapSelection(
  content: string,
  selection: TextSelection,
  before: string,
  after: string,
  placeholder = "text"
): { content: string; selection: TextSelection } {
  const { from, to } = selection;
  const selected = content.slice(from, to) || placeholder;
  const snippet = before + selected + after;
  return {
    content: content.slice(0, from) + snippet + content.slice(to),
    selection: {
      from: from + before.length,
      to: from + before.length + selected.length,
    },
  };
}
