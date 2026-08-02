import type { MermaidConfig } from "mermaid";

export function getMermaidConfig(isDark: boolean): MermaidConfig {
  return {
    startOnLoad: false,
    securityLevel: "strict",
    suppressErrorRendering: true,
    theme: isDark ? "dark" : "default",
    htmlLabels: false,
  };
}
