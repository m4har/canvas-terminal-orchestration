let xtermPromise: Promise<typeof import("@xterm/xterm")> | null = null;
let fitAddonPromise: Promise<typeof import("@xterm/addon-fit")> | null = null;

export function preloadXterm() {
  void loadXterm();
  void loadFitAddon();
}

export function loadXterm() {
  xtermPromise ??= import("@xterm/xterm");
  return xtermPromise;
}

export function loadFitAddon() {
  fitAddonPromise ??= import("@xterm/addon-fit");
  return fitAddonPromise;
}
