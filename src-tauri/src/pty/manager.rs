use std::collections::HashMap;
use std::io::{Read, Write};
use std::path::Path;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex};

use portable_pty::{native_pty_system, CommandBuilder, PtySize};
use tauri::{AppHandle, Emitter};

use crate::herdr::session::HerdrSessionHandle;
use crate::orchestrator;
use crate::pty::PtyOutputEvent;

static PTY_COUNTER: AtomicU64 = AtomicU64::new(1);

enum PtyBackend {
    Local {
        writer: Arc<Mutex<Box<dyn Write + Send>>>,
        child: Arc<Mutex<Box<dyn portable_pty::Child + Send + Sync>>>,
    },
    Herdr {
        session: Arc<HerdrSessionHandle>,
    },
}

struct PtySession {
    backend: PtyBackend,
}

pub struct PtyManager {
    sessions: Mutex<HashMap<String, PtySession>>,
}

impl PtyManager {
    pub fn new() -> Self {
        Self {
            sessions: Mutex::new(HashMap::new()),
        }
    }

    pub fn spawn(
        &self,
        app: &AppHandle,
        cwd: Option<String>,
        cols: u16,
        rows: u16,
    ) -> Result<String, String> {
        let pty_system = native_pty_system();
        let pair = pty_system
            .openpty(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| format!("failed to open pty: {e}"))?;

        let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".into());
        let mut cmd = CommandBuilder::new(&shell);
        cmd.arg("-l");
        if let Some(dir) = resolve_spawn_cwd(cwd) {
            cmd.cwd(dir);
        }

        let child = pair
            .slave
            .spawn_command(cmd)
            .map_err(|e| format!("failed to spawn shell: {e}"))?;
        drop(pair.slave);

        let mut reader = pair
            .master
            .try_clone_reader()
            .map_err(|e| format!("failed to clone pty reader: {e}"))?;
        let writer = pair
            .master
            .take_writer()
            .map_err(|e| format!("failed to take pty writer: {e}"))?;

        let pty_id = format!("pty-{}", PTY_COUNTER.fetch_add(1, Ordering::Relaxed));
        let writer = Arc::new(Mutex::new(writer));
        let child = Arc::new(Mutex::new(child));

        let app_handle = app.clone();
        let output_id = pty_id.clone();
        std::thread::spawn(move || {
            let mut buf = [0u8; 4096];
            loop {
                match reader.read(&mut buf) {
                    Ok(0) => break,
                    Ok(n) => {
                        let data = String::from_utf8_lossy(&buf[..n]).into_owned();
                        let _ = app_handle.emit(
                            "pty-output",
                            PtyOutputEvent {
                                pty_id: output_id.clone(),
                                data: data.clone(),
                                full: false,
                            },
                        );
                        orchestrator::on_pty_output(&app_handle, &output_id, &data);
                    }
                    Err(_) => break,
                }
            }
        });

        self.sessions.lock().map_err(|e| e.to_string())?.insert(
            pty_id.clone(),
            PtySession {
                backend: PtyBackend::Local {
                    writer,
                    child,
                },
            },
        );

        Ok(pty_id)
    }

    pub fn bind_herdr(
        &self,
        app: &AppHandle,
        pty_id: &str,
        binary: &Path,
        pane_id: &str,
        cols: u16,
        rows: u16,
    ) -> Result<(), String> {
        self.stop_session(pty_id)?;

        let session = HerdrSessionHandle::spawn(app, pty_id.to_string(), binary, pane_id, cols, rows)?;

        let _ = app.emit(
            "pty-output",
            PtyOutputEvent {
                pty_id: pty_id.to_string(),
                data: String::new(),
                full: true,
            },
        );

        self.sessions.lock().map_err(|e| e.to_string())?.insert(
            pty_id.to_string(),
            PtySession {
                backend: PtyBackend::Herdr {
                    session: Arc::new(session),
                },
            },
        );

        Ok(())
    }

    fn stop_session(&self, pty_id: &str) -> Result<(), String> {
        let mut sessions = self.sessions.lock().map_err(|e| e.to_string())?;
        if let Some(session) = sessions.remove(pty_id) {
            match session.backend {
                PtyBackend::Local { child, .. } => {
                    if let Ok(mut child) = child.lock() {
                        let _ = child.kill();
                        let _ = child.wait();
                    }
                }
                PtyBackend::Herdr { session } => session.release(),
            }
        }
        Ok(())
    }

    pub fn write(&self, pty_id: &str, data: &str) -> Result<(), String> {
        let sessions = self.sessions.lock().map_err(|e| e.to_string())?;
        let session = sessions
            .get(pty_id)
            .ok_or_else(|| format!("pty session not found: {pty_id}"))?;
        match &session.backend {
            PtyBackend::Local { writer, .. } => {
                let mut writer = writer.lock().map_err(|e| e.to_string())?;
                writer
                    .write_all(data.as_bytes())
                    .map_err(|e| format!("pty write failed: {e}"))?;
                writer
                    .flush()
                    .map_err(|e| format!("pty flush failed: {e}"))?;
            }
            PtyBackend::Herdr { session } => session.write_input(data)?,
        }
        Ok(())
    }

    pub fn resize(&self, pty_id: &str, cols: u16, rows: u16) -> Result<(), String> {
        let sessions = self.sessions.lock().map_err(|e| e.to_string())?;
        let session = sessions
            .get(pty_id)
            .ok_or_else(|| format!("pty session not found: {pty_id}"))?;
        match &session.backend {
            PtyBackend::Local { .. } => {}
            PtyBackend::Herdr { session } => session.resize(cols, rows)?,
        }
        Ok(())
    }

    pub fn kill(&self, pty_id: &str) -> Result<(), String> {
        self.stop_session(pty_id)
    }

    pub fn shutdown_all(&self) {
        if let Ok(mut sessions) = self.sessions.lock() {
            for (pty_id, session) in sessions.drain() {
                match session.backend {
                    PtyBackend::Local { child, .. } => {
                        if let Ok(mut child) = child.lock() {
                            let _ = child.kill();
                            let _ = child.wait();
                        }
                    }
                    PtyBackend::Herdr { session } => session.release(),
                }
                let _ = pty_id;
            }
        }
    }
}

fn resolve_spawn_cwd(cwd: Option<String>) -> Option<String> {
    if let Some(dir) = cwd.filter(|d| !d.is_empty()) {
        if Path::new(&dir).is_dir() {
            return Some(dir);
        }
    }
    std::env::current_dir().ok().map(|p| p.to_string_lossy().to_string())
}
