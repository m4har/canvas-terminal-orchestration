# Herdr Takeover Spike (Phase 0)

**Date:** 2026-08-04  
**Status:** Passed (revised — NDJSON adapter required)

## Goal

Verify that `herdr terminal session control <pane_id> --takeover` can drive an embedded xterm after lazy bind.

## Finding (2026-08-04)

`session control --takeover` does **not** emit raw ANSI on stdout. It emits newline-delimited JSON:

```json
{"type":"terminal.frame","seq":1,"encoding":"ansi","full":true,"bytes":"<base64>"}
```

Stdin expects JSON commands: `terminal.input`, `terminal.resize`, `terminal.release`.

**Exec into zsh** (original spike) therefore dumps JSON literally into xterm — incorrect.

## Correct bind path

1. Kill local shell PTY child on bind.
2. Spawn `herdr terminal session control <pane> --takeover` as a **piped subprocess** (not PTY slave).
3. Rust adapter ([`session.rs`](../src-tauri/src/herdr/session.rs)):
   - Decode `terminal.frame` → emit `pty-output` with ANSI + `full` flag
   - Encode xterm keystrokes → `terminal.input` on child stdin
   - Resize → `terminal.resize`

## Pass criteria

- Bind Herdr shows shell output, not JSON lines
- Keystrokes work without `pane.read` poll
- Handoff + status poll unchanged (orchestration only)
