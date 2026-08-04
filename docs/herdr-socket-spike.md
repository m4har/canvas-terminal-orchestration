# Herdr Socket Spike Notes

**Date:** 2026-08-04  
**Gate:** T2 persistent bridge

## Transport

- Unix domain socket (named pipe on Windows preview — out of scope for P1)
- Newline-delimited JSON request/response per line
- Persistent connection reused for `pane.send_text` and `pane.read`

## Socket path resolution

1. `HERDR_SOCKET_PATH`
2. `$XDG_RUNTIME_DIR/herdr.sock`
3. `$XDG_CONFIG_HOME/herdr/herdr.sock`
4. `$HOME/.config/herdr/herdr.sock`
5. `/tmp/herdr.sock`

## Hot-path requests

### `pane.send_text`

```json
{"id":"req_1","method":"pane.send_text","params":{"pane_id":"wabc:p1","text":"a"}}
```

### `pane.read` (ANSI viewport)

```json
{"id":"req_2","method":"pane.read","params":{"pane_id":"wabc:p1","source":"visible","lines":24,"strip_ansi":false}}
```

Response text: `.result.read.text`

## Cold-path (CLI via resolved binary)

- `workspace list` / `workspace create`
- `pane list` / `pane split`
- `agent prompt` / handoff

## Fallback

If socket connect fails after `connect_or_spawn`, retry once after reconnect. Provision and handoff always use CLI; only interactive terminal I/O requires the socket.
