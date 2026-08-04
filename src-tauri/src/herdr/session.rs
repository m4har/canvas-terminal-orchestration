use std::io::{BufRead, BufReader, Write};
use std::path::Path;
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};
use std::thread;

use base64::Engine;
use serde_json::Value;
use tauri::{AppHandle, Emitter};

use crate::pty::PtyOutputEvent;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DecodedFrame {
    pub data: Vec<u8>,
    pub full: bool,
}

pub fn parse_terminal_frame_line(line: &str) -> Result<Option<DecodedFrame>, String> {
    let trimmed = line.trim();
    if trimmed.is_empty() {
        return Ok(None);
    }

    let value: Value =
        serde_json::from_str(trimmed).map_err(|e| format!("invalid terminal json: {e}"))?;
    let kind = value
        .get("type")
        .and_then(|v| v.as_str())
        .ok_or_else(|| "terminal message missing type".to_string())?;

    match kind {
        "terminal.frame" => {
            let encoded = value
                .get("bytes")
                .and_then(|v| v.as_str())
                .ok_or_else(|| "terminal.frame missing bytes".to_string())?;
            let data = base64::engine::general_purpose::STANDARD
                .decode(encoded)
                .map_err(|e| format!("invalid terminal.frame bytes: {e}"))?;
            let full = value
                .get("full")
                .and_then(|v| v.as_bool())
                .unwrap_or(false);
            Ok(Some(DecodedFrame { data, full }))
        }
        "terminal.closed" => Ok(None),
        _ => Ok(None),
    }
}

pub fn encode_terminal_input(text: &str) -> String {
    serde_json::json!({
        "type": "terminal.input",
        "text": text,
    })
    .to_string()
    + "\n"
}

pub fn encode_terminal_resize(cols: u16, rows: u16) -> String {
    serde_json::json!({
        "type": "terminal.resize",
        "cols": cols,
        "rows": rows,
    })
    .to_string()
    + "\n"
}

pub fn encode_terminal_release() -> &'static str {
    "{\"type\":\"terminal.release\"}\n"
}

pub struct HerdrSessionHandle {
    stdin: Arc<Mutex<Option<std::process::ChildStdin>>>,
    child: Arc<Mutex<Option<Child>>>,
}

impl HerdrSessionHandle {
    pub fn spawn(
        app: &AppHandle,
        pty_id: String,
        binary: &Path,
        pane_id: &str,
        cols: u16,
        rows: u16,
    ) -> Result<Self, String> {
        let mut child = Command::new(binary)
            .args([
                "terminal",
                "session",
                "control",
                pane_id,
                "--takeover",
                "--cols",
                &cols.to_string(),
                "--rows",
                &rows.to_string(),
            ])
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("failed to spawn herdr session control: {e}"))?;

        let stdout = child
            .stdout
            .take()
            .ok_or_else(|| "herdr session missing stdout".to_string())?;
        let stdin = child.stdin.take();

        let handle = Self {
            stdin: Arc::new(Mutex::new(stdin)),
            child: Arc::new(Mutex::new(Some(child))),
        };

        let app_handle = app.clone();
        let reader_handle = handle.stdin.clone();
        let child_handle = handle.child.clone();
        thread::spawn(move || {
            let reader = BufReader::new(stdout);
            for line in reader.lines() {
                match line {
                    Ok(raw) => {
                        match parse_terminal_frame_line(&raw) {
                            Ok(Some(frame)) => {
                                let data = String::from_utf8_lossy(&frame.data).into_owned();
                                let _ = app_handle.emit(
                                    "pty-output",
                                    PtyOutputEvent {
                                        pty_id: pty_id.clone(),
                                        data,
                                        full: frame.full,
                                    },
                                );
                            }
                            Ok(None) => {
                                if raw.contains("terminal.closed") {
                                    break;
                                }
                            }
                            Err(_) => continue,
                        }
                    }
                    Err(_) => break,
                }
            }
            if let Ok(mut guard) = reader_handle.lock() {
                *guard = None;
            }
            if let Ok(mut guard) = child_handle.lock() {
                if let Some(mut child) = guard.take() {
                    let _ = child.kill();
                    let _ = child.wait();
                }
            }
        });

        Ok(handle)
    }

    pub fn write_input(&self, text: &str) -> Result<(), String> {
        let mut guard = self.stdin.lock().map_err(|e| e.to_string())?;
        let stdin = guard
            .as_mut()
            .ok_or_else(|| "herdr session stdin closed".to_string())?;
        let line = encode_terminal_input(text);
        stdin
            .write_all(line.as_bytes())
            .map_err(|e| format!("herdr session write failed: {e}"))?;
        stdin
            .flush()
            .map_err(|e| format!("herdr session flush failed: {e}"))?;
        Ok(())
    }

    pub fn resize(&self, cols: u16, rows: u16) -> Result<(), String> {
        let mut guard = self.stdin.lock().map_err(|e| e.to_string())?;
        let stdin = guard
            .as_mut()
            .ok_or_else(|| "herdr session stdin closed".to_string())?;
        let line = encode_terminal_resize(cols, rows);
        stdin
            .write_all(line.as_bytes())
            .map_err(|e| format!("herdr session resize failed: {e}"))?;
        stdin
            .flush()
            .map_err(|e| format!("herdr session resize flush failed: {e}"))?;
        Ok(())
    }

    pub fn release(&self) {
        if let Ok(mut guard) = self.stdin.lock() {
            if let Some(stdin) = guard.as_mut() {
                let _ = stdin.write_all(encode_terminal_release().as_bytes());
                let _ = stdin.flush();
            }
            *guard = None;
        }
        if let Ok(mut guard) = self.child.lock() {
            if let Some(mut child) = guard.take() {
                let _ = child.kill();
                let _ = child.wait();
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_terminal_frame_with_base64_ansi() {
        let line = r#"{"type":"terminal.frame","seq":1,"encoding":"ansi","width":80,"height":24,"full":true,"bytes":"aGk="}"#;
        let frame = parse_terminal_frame_line(line)
            .expect("parse")
            .expect("frame");
        assert!(frame.full);
        assert_eq!(frame.data, b"hi");
    }

    #[test]
    fn ignores_terminal_closed() {
        let line = r#"{"type":"terminal.closed","reason":"done"}"#;
        assert!(parse_terminal_frame_line(line).unwrap().is_none());
    }

    #[test]
    fn encodes_terminal_input_json() {
        let encoded = encode_terminal_input("a");
        assert!(encoded.contains(r#""type":"terminal.input""#));
        assert!(encoded.contains(r#""text":"a""#));
    }
}
