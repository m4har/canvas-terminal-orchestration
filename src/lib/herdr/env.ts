/** Project cwd for Herdr panes — browser dev uses repo path, Tauri uses app cwd later */
export function getProjectCwd(): string {
  if (typeof window === "undefined") {
    return "/Users/pid-mahardicka/Documents/mahar/canvas-orchestra-loop-engineer";
  }
  const { hostname } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "/Users/pid-mahardicka/Documents/mahar/canvas-orchestra-loop-engineer";
  }
  return "/project";
}
