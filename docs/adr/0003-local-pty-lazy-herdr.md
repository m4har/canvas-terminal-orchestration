# ADR 0003: Local PTY + Lazy Herdr Bind

**Status:** Accepted  
**Date:** 2026-08-04  
**Supersedes:** ADR 0002 §O1 (pane output poll for xterm), ADR 0002 "Embed local PTY rejected"

## Context

ADR 0002 fixed per-keystroke CLI spawning and introduced a persistent Herdr socket. Terminal output still polled at 150–500ms through `pane.read`, causing visible typing lag. [Orca](https://github.com/stablyai/orca) embeds `node-pty` in the main process and streams bytes directly to xterm — zero poll.

Canvas Orchestra must keep Herdr for orchestration (pane lifecycle, agent prompt, status) but not proxy interactive I/O through the multiplexer socket.

## Decision

1. **LocalShell (default)** — New TerminalNodes spawn an embedded PTY (`portable-pty` in Tauri) running the user shell. xterm reads/writes via Tauri events (`pty-output` / `pty_write`). No Herdr pane required at create time.
2. **Lazy bind** — Herdr involvement is deferred until the user clicks **Bind Herdr** or the first handoff targets an unbound node.
3. **Session control adapter** — On bind, kill local shell and spawn `herdr terminal session control <pane_id> --takeover` as a piped subprocess. Rust decodes `terminal.frame` NDJSON to ANSI for xterm and encodes keystrokes as `terminal.input` (not raw exec in zsh).
4. **HerdrBound** — After bind, pane ID is persisted; agent status polls at 2s; handoff uses `dispatchToPane`. Display I/O uses the Herdr session adapter stream.
5. **HerdrBridge** — Retained for lifecycle, provision, prompt, status. `pane.read` is not on the xterm hot path.

## Alternatives considered

| Option | Why rejected |
|--------|--------------|
| Tune poll 150ms → 50ms | Wrong architecture; still round-trip bound |
| Background Herdr pane + poll to xterm | Two sessions; same lag model |
| Bind on every TerminalNode create | Slow first paint; blocks on `pane split` |
| Drop Herdr entirely | Loses agent lifecycle and handoff semantics |

## Consequences

**Positive:**

- Keystroke latency bounded by PTY event stream, not poll interval
- First paint is local shell (<200ms target)
- Herdr panes created only when orchestration is needed
- ADR 0002 lifecycle rules preserved (reuse socket, kill only sidecar-spawned server)

**Negative:**

- Two terminal modes (LocalShell vs HerdrBound) in domain model and UI
- `portable-pty` adds Rust complexity; resize is best-effort in v0.1
- Windows: local PTY works; Herdr bind remains macOS/Linux only (ADR 0002 P1)

## References

- [Orca PR #4764](https://github.com/stablyai/orca/pull/4764) — embedded PTY streaming
- [docs/herdr-takeover-spike.md](../herdr-takeover-spike.md)
- [CONTEXT.md](../../CONTEXT.md) — LocalShell, HerdrBound, Bind Herdr
