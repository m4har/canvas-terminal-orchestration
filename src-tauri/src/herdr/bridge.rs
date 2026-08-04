use std::path::PathBuf;
use std::process::{Child, Command};
use std::thread;
use std::time::Duration;

use serde::Serialize;

use super::binary::{self, resolve_binary};
use super::platform::OsPlatform;
#[cfg(unix)]
use super::socket::HerdrSocket;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum HerdrLifecycle {
    Unsupported,
    Missing,
    Downloading,
    Present,
    Starting,
    Connected,
    Offline,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HerdrStatusSnapshot {
    pub platform: OsPlatform,
    pub lifecycle: HerdrLifecycle,
    pub present: bool,
    pub connected: bool,
    pub spawned_by_us: bool,
    pub progress: f32,
    pub message: String,
}

pub struct HerdrBridge {
    app_data_dir: PathBuf,
    platform: OsPlatform,
    binary_path: Option<PathBuf>,
    server_child: Option<Child>,
    spawned_by_us: bool,
    #[cfg(unix)]
    socket: Option<HerdrSocket>,
    lifecycle: HerdrLifecycle,
    progress: f32,
    message: String,
}

impl HerdrBridge {
    pub fn new(app_data_dir: PathBuf) -> Self {
        let platform = OsPlatform::detect();
        let binary_path = resolve_binary(&app_data_dir);
        let lifecycle = if !platform.supports_managed_binary() {
            if binary_path.is_some() {
                HerdrLifecycle::Present
            } else {
                HerdrLifecycle::Unsupported
            }
        } else if binary_path.is_some() {
            HerdrLifecycle::Present
        } else {
            HerdrLifecycle::Missing
        };

        Self {
            app_data_dir,
            platform,
            binary_path,
            server_child: None,
            spawned_by_us: false,
            #[cfg(unix)]
            socket: None,
            lifecycle,
            progress: 0.0,
            message: String::new(),
        }
    }

    pub fn status(&self) -> HerdrStatusSnapshot {
        let present = self.binary_path.is_some();
        let connected = self.lifecycle == HerdrLifecycle::Connected;
        HerdrStatusSnapshot {
            platform: self.platform,
            lifecycle: self.lifecycle,
            present,
            connected,
            spawned_by_us: self.spawned_by_us,
            progress: self.progress,
            message: self.message.clone(),
        }
    }

    pub fn ensure_present(&mut self) -> Result<(), String> {
        if self.platform == OsPlatform::Windows {
            self.lifecycle = HerdrLifecycle::Unsupported;
            self.message = "Herdr on Windows is preview-only — not supported in Canvas yet".into();
            return Err(self.message.clone());
        }

        if let Some(path) = resolve_binary(&self.app_data_dir) {
            self.binary_path = Some(path);
            self.lifecycle = HerdrLifecycle::Present;
            return Ok(());
        }

        if !self.platform.supports_managed_binary() {
            self.lifecycle = HerdrLifecycle::Unsupported;
            return Err("unsupported platform".into());
        }

        self.lifecycle = HerdrLifecycle::Downloading;
        self.message = "downloading herdr".into();
        let app_data = self.app_data_dir.clone();
        let platform = self.platform;
        let downloaded = binary::download_managed_binary(&app_data, platform, |progress, msg| {
            self.progress = progress;
            self.message = msg.to_string();
        })?;
        self.binary_path = Some(downloaded);
        self.lifecycle = HerdrLifecycle::Present;
        self.progress = 1.0;
        self.message.clear();
        Ok(())
    }

    pub fn resolved_binary_path(&self) -> Result<PathBuf, String> {
        self.binary().map(|path| path.clone())
    }

    fn binary(&self) -> Result<&PathBuf, String> {
        self.binary_path
            .as_ref()
            .ok_or_else(|| "herdr binary not present".to_string())
    }

    fn probe_server(&self) -> Result<bool, String> {
        binary::server_running(self.binary()?)
    }

    #[cfg(unix)]
    fn ensure_socket(&mut self) -> Result<(), String> {
        if self.socket.is_some() {
            return Ok(());
        }
        self.socket = Some(HerdrSocket::connect()?);
        Ok(())
    }

    #[cfg(not(unix))]
    fn ensure_socket(&mut self) -> Result<(), String> {
        Err("herdr socket is only supported on unix".into())
    }

    pub fn connect_or_spawn(&mut self) -> Result<bool, String> {
        if !self.platform.supports_managed_binary() && self.binary_path.is_none() {
            if let Some(path) = resolve_binary(&self.app_data_dir) {
                self.binary_path = Some(path);
            } else {
                self.lifecycle = HerdrLifecycle::Unsupported;
                self.message =
                    "Herdr on Windows is preview-only — install manually or use macOS/Linux".into();
                return Ok(false);
            }
        }

        if self.binary_path.is_none() {
            self.ensure_present()?;
        }

        if self.probe_server().unwrap_or(false) {
            self.lifecycle = HerdrLifecycle::Connected;
            #[cfg(unix)]
            {
                let _ = self.ensure_socket();
            }
            return Ok(true);
        }

        self.lifecycle = HerdrLifecycle::Starting;
        self.message = "starting herdr server".into();

        let binary = self.binary()?.clone();
        let child = Command::new(&binary)
            .arg("server")
            .spawn()
            .map_err(|e| format!("failed to spawn herdr server: {e}"))?;
        self.server_child = Some(child);
        self.spawned_by_us = true;

        for _ in 0..40 {
            thread::sleep(Duration::from_millis(100));
            if self.probe_server().unwrap_or(false) {
                self.lifecycle = HerdrLifecycle::Connected;
                self.message.clear();
                #[cfg(unix)]
                {
                    let _ = self.ensure_socket();
                }
                return Ok(true);
            }
        }

        self.lifecycle = HerdrLifecycle::Offline;
        self.message = "herdr server did not become ready".into();
        Ok(false)
    }

    pub fn run_cli(&self, args: &[String]) -> Result<String, String> {
        let binary = self.binary()?;
        let arg_refs: Vec<&str> = args.iter().map(String::as_str).collect();
        binary::run_cli(binary, &arg_refs)
    }

    pub fn pane_send(&mut self, pane_id: &str, text: &str) -> Result<(), String> {
        if text.is_empty() {
            return Ok(());
        }
        self.pane_send_socket(pane_id, text)
    }

    pub fn pane_send_keys(&mut self, pane_id: &str, keys: &[String]) -> Result<(), String> {
        if keys.is_empty() {
            return Ok(());
        }
        self.pane_send_keys_socket(pane_id, keys)
    }

    pub fn pane_read_visible(&mut self, pane_id: &str, lines: u32) -> Result<String, String> {
        self.pane_read_socket(pane_id, lines, |socket, pane_id, lines| {
            socket.pane_read_visible_ansi(pane_id, lines)
        })
    }

    pub fn pane_read_recent(&mut self, pane_id: &str, lines: u32) -> Result<String, String> {
        self.pane_read_socket(pane_id, lines, |socket, pane_id, lines| {
            socket.pane_read_unwrapped_ansi(pane_id, lines)
        })
    }

    #[cfg(unix)]
    fn pane_send_socket(&mut self, pane_id: &str, text: &str) -> Result<(), String> {
        if let Err(err) = self.ensure_socket() {
            self.socket = None;
            return Err(err);
        }
        if let Some(socket) = self.socket.as_mut() {
            match socket.pane_send_text(pane_id, text) {
                Ok(()) => return Ok(()),
                Err(err) => {
                    self.socket = None;
                    return Err(err);
                }
            }
        }
        Err("herdr socket unavailable".into())
    }

    #[cfg(not(unix))]
    fn pane_send_socket(&mut self, _pane_id: &str, _text: &str) -> Result<(), String> {
        Err("herdr socket is only supported on unix".into())
    }

    #[cfg(unix)]
    fn pane_send_keys_socket(&mut self, pane_id: &str, keys: &[String]) -> Result<(), String> {
        if let Err(err) = self.ensure_socket() {
            self.socket = None;
            return Err(err);
        }
        if let Some(socket) = self.socket.as_mut() {
            match socket.pane_send_keys(pane_id, keys) {
                Ok(()) => return Ok(()),
                Err(err) => {
                    self.socket = None;
                    return Err(err);
                }
            }
        }
        Err("herdr socket unavailable".into())
    }

    #[cfg(not(unix))]
    fn pane_send_keys_socket(
        &mut self,
        _pane_id: &str,
        _keys: &[String],
    ) -> Result<(), String> {
        Err("herdr socket is only supported on unix".into())
    }

    #[cfg(unix)]
    fn pane_read_socket(
        &mut self,
        pane_id: &str,
        lines: u32,
        read: fn(&mut HerdrSocket, &str, u32) -> Result<String, String>,
    ) -> Result<String, String> {
        if let Err(err) = self.ensure_socket() {
            self.socket = None;
            return Err(err);
        }
        if let Some(socket) = self.socket.as_mut() {
            match read(socket, pane_id, lines) {
                Ok(text) => return Ok(text),
                Err(err) => {
                    self.socket = None;
                    return Err(err);
                }
            }
        }
        Err("herdr socket unavailable".into())
    }

    #[cfg(not(unix))]
    fn pane_read_socket(
        &mut self,
        _pane_id: &str,
        _lines: u32,
        _read: fn(&mut HerdrSocket, &str, u32) -> Result<String, String>,
    ) -> Result<String, String> {
        Err("herdr socket is only supported on unix".into())
    }

    pub fn shutdown(&mut self) {
        #[cfg(unix)]
        {
            self.socket = None;
        }
        if self.spawned_by_us {
            if let Some(mut child) = self.server_child.take() {
                let _ = child.kill();
                let _ = child.wait();
            }
            self.spawned_by_us = false;
        }
        self.lifecycle = HerdrLifecycle::Offline;
    }
}
