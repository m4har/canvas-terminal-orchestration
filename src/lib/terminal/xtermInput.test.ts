import { describe, expect, it } from "vitest";
import { encodeXtermInput, localEchoForInput, normalizePtyInput, shouldLocalEchoInput } from "./xtermInput";

describe("encodeXtermInput", () => {
  it("maps tab to herdr tab key", () => {
    expect(encodeXtermInput("\t")).toEqual({ kind: "keys", keys: ["tab"] });
  });

  it("maps ctrl+c to herdr ctrl+c key", () => {
    expect(encodeXtermInput("\x03")).toEqual({ kind: "keys", keys: ["ctrl+c"] });
  });

  it("maps backspace to herdr backspace key", () => {
    expect(encodeXtermInput("\x7f")).toEqual({ kind: "keys", keys: ["backspace"] });
  });

  it("maps delete escape sequence", () => {
    expect(encodeXtermInput("\x1b[3~")).toEqual({ kind: "keys", keys: ["delete"] });
  });

  it("passes printable text through", () => {
    expect(encodeXtermInput("a")).toEqual({ kind: "text", text: "a" });
  });

  it("does not local echo special keys except line editing", () => {
    expect(shouldLocalEchoInput("\t")).toBe(false);
    expect(shouldLocalEchoInput("x")).toBe(true);
    expect(localEchoForInput("\x7f")).toBe("\b \b");
    expect(localEchoForInput("\x1b[3~")).toBeNull();
  });

  it("normalizes BS to DEL for local PTY", () => {
    expect(normalizePtyInput("\x08")).toBe("\x7f");
    expect(normalizePtyInput("a")).toBe("a");
  });
});
