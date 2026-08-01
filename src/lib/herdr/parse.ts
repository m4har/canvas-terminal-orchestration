import type { AgentStatus } from "../types";
import type { HerdrEnvelope } from "./types";

export function parseHerdrJson<T>(stdout: string): T {
  const trimmed = stdout.trim();
  if (!trimmed.startsWith("{")) {
    throw new Error(`herdr: expected JSON, got: ${trimmed.slice(0, 120)}`);
  }
  const envelope = JSON.parse(trimmed) as HerdrEnvelope<T>;
  if (envelope.error) {
    throw new Error(`${envelope.error.code}: ${envelope.error.message}`);
  }
  if (envelope.result === undefined) {
    throw new Error("herdr: empty result");
  }
  return envelope.result;
}

export function normalizeAgentStatus(
  status: AgentStatus | "unknown" | undefined
): AgentStatus {
  if (status === "working" || status === "blocked" || status === "done") {
    return status;
  }
  return "idle";
}

export function tailLines(text: string, lines = 8): string {
  return text
    .split("\n")
    .slice(-lines)
    .join("\n")
    .trim();
}
