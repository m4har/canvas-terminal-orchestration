use std::io::{BufRead, BufReader, Write};
use std::os::unix::net::UnixStream;
use std::path::PathBuf;
use std::time::Duration;

use serde_json::{json, Value};

pub fn resolve_socket_path() -> Option<PathBuf> {
    if let Ok(path) = std::env::var("HERDR_SOCKET_PATH") {
        let p = PathBuf::from(path);
        if p.exists() {
            return Some(p);
        }
    }

    if let Ok(runtime) = std::env::var("XDG_RUNTIME_DIR") {
        let p = PathBuf::from(runtime).join("herdr.sock");
        if p.exists() {
            return Some(p);
        }
    }

    if let Ok(config_home) = std::env::var("XDG_CONFIG_HOME") {
        let p = PathBuf::from(config_home).join("herdr").join("herdr.sock");
        if p.exists() {
            return Some(p);
        }
    }

    if let Ok(home) = std::env::var("HOME") {
        let p = PathBuf::from(home).join(".config").join("herdr").join("herdr.sock");
        if p.exists() {
            return Some(p);
        }
    }

    let tmp = PathBuf::from("/tmp/herdr.sock");
    if tmp.exists() {
        return Some(tmp);
    }

    None
}

pub struct HerdrSocket {
    reader: BufReader<UnixStream>,
    next_id: u64,
}

impl HerdrSocket {
    pub fn connect() -> Result<Self, String> {
        let path = resolve_socket_path().ok_or_else(|| "herdr socket not found".to_string())?;
        let stream = UnixStream::connect(&path)
            .map_err(|e| format!("failed to connect herdr socket at {}: {e}", path.display()))?;
        stream
            .set_read_timeout(Some(Duration::from_secs(5)))
            .map_err(|e| e.to_string())?;
        stream
            .set_write_timeout(Some(Duration::from_secs(5)))
            .map_err(|e| e.to_string())?;
        Ok(Self {
            reader: BufReader::new(stream),
            next_id: 1,
        })
    }

    fn next_request_id(&mut self) -> String {
        let id = format!("req_{}", self.next_id);
        self.next_id += 1;
        id
    }

    pub fn call(&mut self, method: &str, params: Value) -> Result<Value, String> {
        let id = self.next_request_id();
        let request = json!({
            "id": id,
            "method": method,
            "params": params,
        });
        let line = format!("{request}\n");
        self.reader
            .get_mut()
            .write_all(line.as_bytes())
            .map_err(|e| format!("socket write failed: {e}"))?;
        self.reader
            .get_mut()
            .flush()
            .map_err(|e| format!("socket flush failed: {e}"))?;

        let mut buf = String::new();
        loop {
            buf.clear();
            let read = self
                .reader
                .read_line(&mut buf)
                .map_err(|e| format!("socket read failed: {e}"))?;
            if read == 0 {
                return Err("herdr socket closed".into());
            }
            let trimmed = buf.trim();
            if trimmed.is_empty() {
                continue;
            }
            let parsed: Value =
                serde_json::from_str(trimmed).map_err(|e| format!("invalid socket json: {e}"))?;
            if parsed.get("id").and_then(|v| v.as_str()) == Some(id.as_str()) {
                if let Some(err) = parsed.get("error") {
                    let code = err
                        .get("code")
                        .and_then(|v| v.as_str())
                        .unwrap_or("unknown");
                    let message = err
                        .get("message")
                        .and_then(|v| v.as_str())
                        .unwrap_or("herdr socket error");
                    return Err(format!("{code}: {message}"));
                }
                return Ok(parsed
                    .get("result")
                    .cloned()
                    .ok_or_else(|| "socket response missing result".to_string())?);
            }
        }
    }

    pub fn pane_send_keys(&mut self, pane_id: &str, keys: &[String]) -> Result<(), String> {
        self.call(
            "pane.send_keys",
            json!({ "pane_id": pane_id, "keys": keys }),
        )?;
        Ok(())
    }

    pub fn pane_send_text(&mut self, pane_id: &str, text: &str) -> Result<(), String> {
        self.call(
            "pane.send_text",
            json!({ "pane_id": pane_id, "text": text }),
        )?;
        Ok(())
    }

    pub fn pane_read_unwrapped_ansi(&mut self, pane_id: &str, lines: u32) -> Result<String, String> {
        self.pane_read_with_source(pane_id, lines, "recent_unwrapped", false)
    }

    pub fn pane_read_visible_ansi(&mut self, pane_id: &str, lines: u32) -> Result<String, String> {
        self.pane_read_with_source(pane_id, lines, "visible", false)
    }

    fn pane_read_with_source(
        &mut self,
        pane_id: &str,
        lines: u32,
        source: &str,
        strip_ansi: bool,
    ) -> Result<String, String> {
        let result = self.call(
            "pane.read",
            json!({
                "pane_id": pane_id,
                "source": source,
                "lines": lines,
                "strip_ansi": strip_ansi,
            }),
        )?;
        result
            .get("read")
            .and_then(|r| r.get("text"))
            .and_then(|t| t.as_str())
            .map(str::to_string)
            .ok_or_else(|| "pane.read response missing text".to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn resolve_socket_path_returns_none_when_missing() {
        let _ = resolve_socket_path();
    }
}
