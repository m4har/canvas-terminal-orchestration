# ADR 0005: In-app Headless OrchestraAgent Runtime

**Status:** Accepted  
**Date:** 2026-08-10  
**Related:** ADR 0004 (OrchestratorBus), OrchestraAgent widget plan

## Context

Canvastor v0.1 delegates agent execution to Herdr CLI runtimes inside TerminalNodes. Users want configurable headless agents on the canvas — with profiles, skills, memory, and model choice — without requiring Herdr for every orchestration step.

AGENTS.md previously listed *"Built-in agent execution inside the Tauri app"* as a non-goal. This ADR supersedes that constraint for **OrchestraAgent** only. TerminalNode/Herdr remains the path for shell/tool execution.

## Decision

1. **OrchestraAgent** — Named, app-wide registry entity (SQLite) with profile, skills, model, and two-layer memory files.
2. **AgentNode** — Canvas widget referencing one OrchestraAgent + project `cwd`.
3. **Headless runtime** — Tauri Rust module calls LLM APIs via `rig-core`, streams tokens to the frontend via Tauri events.
4. **Global LLMSettings** — Provider (`openai` | `anthropic`), base URL, API key in app settings.
5. **Play** — Manual execution: compose prompt (prefill from upstream MarkdownNode) → stream response inline on AgentNode; optional mirror to connected TerminalNode via OrchestratorBus.
6. **Skill loading** — Custom `SkillLoader` reads SKILL.md paths; bundled profile presets seed default skill paths.

## Alternatives considered

| Option | Why rejected |
|--------|--------------|
| Config-only layer delegating to Herdr CLI | User chose in-app headless execution |
| TypeScript AI SDK in frontend | API key exposure; wrong trust boundary |
| Raw reqwest/ureq HTTP | Reinvent streaming + agent abstractions |
| `agent-sdk` crate | Stronger for MCP/HITL; overkill for MVP single-turn Play |

## Consequences

**Positive:**

- OrchestraAgent runs without Herdr dependency
- Reusable agent identity strengthens memory across canvas placements
- rig-core provides upgrade path for tool calling in v0.2

**Negative:**

- Dual agent concepts (OrchestraAgent vs Herdr agent) require clear glossary
- API key is a new trust boundary — stored in app settings, never logged
- Adds `tokio` + `rig-core` to Tauri dependencies

## Follow-up

- v0.2: Trigger edges on OrchestraAgent `done`; tool calling via TerminalNode PTY
- v0.2+: Cron/webhook ingress requires run engine
