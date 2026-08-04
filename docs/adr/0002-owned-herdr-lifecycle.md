# ADR 0002: Owned Herdr Lifecycle + Persistent Bridge

**Status:** Accepted  
**Date:** 2026-08-04

## Context

TerminalNode launch felt slow and keyboard input felt heavy. Root cause: every keystroke and pane poll spawned a new `herdr` CLI process from the frontend. Herdr install, OS detection, and server child tracking were missing. The glossary treated Canvas as a passive supervisor only.

## Decision

Canvas **owns Herdr lifecycle** without embedding a PTY:

1. **Binary (I2)** — On macOS/Linux, auto-download the official release asset to app data when first needed. Reuse a binary already on PATH when present. Do not bundle Herdr inside the Tauri installer.
2. **Connection (R1)** — `connect_or_spawn` reuses an existing Herdr server when running; spawns a tracked sidecar only when needed; kills on app quit **only** if Canvas spawned that server.
3. **Transport (T2)** — `HerdrBridge` keeps a persistent Unix socket (newline-delimited JSON) for hot-path `pane.send_text` and `pane.read`. Rare ops (workspace create, pane split) use one-shot CLI via the resolved binary path.
4. **Platform (P1)** — Ship install + bridge on macOS/Linux. Windows: detect OS and show preview/unsupported messaging; no auto-download.
5. **Output (O1)** — ~~Poll pane output at 500ms over the bridge when a TerminalNode is selected.~~ **Superseded by ADR 0003** — embedded local PTY streams output; pane.read not on xterm hot path.
6. **Launch (L1)** — Cache canvas workspace metadata and reduce xterm sync churn during provision.

## Alternatives considered

| Option | Why rejected |
|--------|--------------|
| Guided install only (run official shell script) | Does not give Canvas a controlled binary path; weaker “install via app” |
| Bundle Herdr as Tauri sidecar | Increases installer size; couples Herdr updates to app releases |
| Embed local PTY in Canvas | ~~Violates product model; duplicates Herdr; heavy~~ **Superseded by ADR 0003** — local PTY for display only; Herdr for orchestration after lazy bind |
| Coalesce CLI keystrokes (T1) | Still spawns processes; does not fix root cause |
| Socket output subscribe now | Scope creep; polling at 500ms is sufficient for v0.1 |

## Socket spike outcome

Herdr exposes newline-delimited JSON over a Unix domain socket. Path resolution order: `HERDR_SOCKET_PATH`, `$XDG_RUNTIME_DIR/herdr.sock`, `$XDG_CONFIG_HOME/herdr/herdr.sock`, `$HOME/.config/herdr/herdr.sock`, `/tmp/herdr.sock`.

Hot-path methods: `pane.send_text`, `pane.read` (`source: visible`, `strip_ansi: false` for ANSI). Workspace/pane provisioning stays on CLI wrappers (`workspace create`, `pane split`) via resolved binary.

## Consequences

**Positive:**

- Keyboard input no longer spawns a process per keystroke
- Pane reads share one socket connection
- First-run Mac/Linux users get Herdr without manual install
- External Herdr sessions are preserved (reuse-first)

**Negative:**

- Rust bridge complexity increases (platform, download, socket, child tracking)
- Windows users see unsupported state until Herdr stable on Windows
- Auto-download requires network on first terminal use
