export const TERMINAL_MIN_COLS = 24;
export const TERMINAL_MIN_ROWS = 4;

export function clampTerminalSize(
  cols: number,
  rows: number,
  minCols = TERMINAL_MIN_COLS,
  minRows = TERMINAL_MIN_ROWS
) {
  return {
    cols: Math.max(cols, minCols),
    rows: Math.max(rows, minRows),
  };
}

export function canFitTerminal(host: { clientWidth: number; clientHeight: number }) {
  return host.clientWidth >= 40 && host.clientHeight >= 40;
}
