# ADR 0004: OrchestratorBus for LocalShell Messaging

**Status:** Accepted  
**Date:** 2026-08-04  
**Related:** ADR 0003 (local PTY + lazy Herdr bind)

## Context

ADR 0003 separated interactive terminal I/O from Herdr polling. Handoff to LocalShell terminals still forced Herdr bind and used `herdr agent prompt` subprocesses. Status badges polled `herdr pane list` every 2s per TerminalNode — slow, subprocess-heavy, and blocked handoff when Herdr was offline.

Canvas Orchestra needs in-process orchestration for LocalShell: write handoff payloads directly to the embedded PTY and push agent status from the output stream.

## Decision

1. **OrchestratorBus** — Rust in-process registry (`pty_id → session`) in Tauri. Hooks `PtyManager` output after `pty-output` emit.
2. **MessageDispatch** — `orchestrator_dispatch` writes handoff text to PTY (+ newline). No Herdr bind required for LocalShell handoff.
3. **StatusParser** — Heuristic adapters per `agentKind` infer `idle` / `working` / `blocked` / `done` from output tail. Emit `orchestrator-status` Tauri events on transitions.
4. **Force Done** — `orchestrator_force_done` overrides parser until new stream activity; wired from store `forceDone` for LocalShell.
5. **HerdrBound legacy path** — Bind Herdr remains optional in UI. HerdrBound nodes keep Herdr CLI handoff and 2s status poll in v1.

## Alternatives considered

| Option | Why rejected |
|--------|--------------|
| Keep Herdr CLI for all handoffs | Subprocess latency; forced bind blocks offline dev |
| Frontend-only parser on xterm bytes | Duplicated logic; misses non-visible PTY output |
| Socket subscribe Herdr for LocalShell | Still requires Herdr running; wrong default path |
| Drop status parsing (manual only) | No push badges; blocks v0.2 trigger edges |

## Consequences

**Positive:**

- LocalShell handoff is direct PTY write — no provision/bind subprocess chain
- Status updates push via events instead of 2s CLI poll per node
- Herdr optional for users who only need local agents
- Parser + Force Done gives escape hatch when heuristics wrong

**Negative:**

- Parser heuristics can misclassify status (mitigated by adapters + fixtures + Force Done)
- Dual paths (OrchestratorBus vs HerdrBound) until v1.1 unification
- Multi-line handoff may need paste policy tuning per runtime

## Follow-up

- v1.1: Apply parser on Herdr session adapter stream; retire Herdr status poll for HerdrBound
- v0.2: Trigger edges on reliable `done` from OrchestratorBus events
