export type PaneInput =
  | { kind: "text"; text: string }
  | { kind: "keys"; keys: string[] };

const SEQUENCE_KEYS: [string, string][] = [
  ["\x1b[Z", "shift+tab"],
  ["\x1b[3~", "delete"],
  ["\x1b[5~", "pageup"],
  ["\x1b[6~", "pagedown"],
  ["\x1b[A", "up"],
  ["\x1b[B", "down"],
  ["\x1b[C", "right"],
  ["\x1b[D", "left"],
  ["\x1b[H", "home"],
  ["\x1b[F", "end"],
  ["\x1bOP", "f1"],
  ["\x1bOQ", "f2"],
  ["\x1bOR", "f3"],
  ["\x1bOS", "f4"],
  ["\x1b[15~", "f5"],
  ["\x1b[17~", "f6"],
  ["\x1b[18~", "f7"],
  ["\x1b[19~", "f8"],
  ["\x1b[20~", "f9"],
  ["\x1b[21~", "f10"],
  ["\x1b[23~", "f11"],
  ["\x1b[24~", "f12"],
];

const SORTED_SEQUENCES = [...SEQUENCE_KEYS].sort((a, b) => b[0].length - a[0].length);

export function encodeXtermInput(data: string): PaneInput {
  if (!data) return { kind: "text", text: "" };

  for (const [seq, key] of SORTED_SEQUENCES) {
    if (data === seq) return { kind: "keys", keys: [key] };
  }

  if (data.length === 2 && data.charCodeAt(0) === 27 && data.charCodeAt(1) >= 32) {
    return { kind: "keys", keys: [`alt+${data[1]}`] };
  }

  if (data.length === 1) {
    const code = data.charCodeAt(0);
    if (code === 8 || code === 127) return { kind: "keys", keys: ["backspace"] };
    if (code === 9) return { kind: "keys", keys: ["tab"] };
    if (code === 10 || code === 13) return { kind: "keys", keys: ["enter"] };
    if (code === 27) return { kind: "keys", keys: ["esc"] };
    if (code >= 1 && code <= 26) {
      return { kind: "keys", keys: [`ctrl+${String.fromCharCode(code + 96)}`] };
    }
  }

  return { kind: "text", text: data };
}

export function shouldLocalEchoInput(data: string): boolean {
  return localEchoForInput(data) !== null;
}

/** Immediate xterm feedback for keys that edit the visible line. */
export function localEchoForInput(data: string): string | null {
  const input = encodeXtermInput(data);
  if (input.kind === "text") return input.text;
  if (input.kind === "keys") {
    if (input.keys[0] === "backspace") return "\b \b";
    if (input.keys[0] === "delete") return data;
  }
  return null;
}
