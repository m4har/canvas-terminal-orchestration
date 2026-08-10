use std::sync::Mutex;

use tauri::{AppHandle, State};

use crate::commands::herdr::HerdrState;
use crate::orchestrator::OrchestratorState;
use crate::pty::PtyManager;

pub struct PtyState {
    pub manager: Mutex<PtyManager>,
}

#[tauri::command]
pub fn pty_spawn(
    app: AppHandle,
    state: State<'_, PtyState>,
    orchestrator: State<'_, OrchestratorState>,
    cwd: Option<String>,
    cols: Option<u16>,
    rows: Option<u16>,
) -> Result<String, String> {
    let manager = state.manager.lock().map_err(|e| e.to_string())?;
    let pty_id = manager.spawn(
        &app,
        cwd,
        cols.unwrap_or(80),
        rows.unwrap_or(24),
    )?;
    if let Ok(mut bus) = orchestrator.bus.lock() {
        bus.register(&pty_id, None);
    }
    Ok(pty_id)
}

#[tauri::command]
pub fn pty_write(state: State<'_, PtyState>, pty_id: String, data: String) -> Result<(), String> {
    let manager = state.manager.lock().map_err(|e| e.to_string())?;
    manager.write(&pty_id, &data)
}

#[tauri::command]
pub fn pty_resize(
    state: State<'_, PtyState>,
    pty_id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    let manager = state.manager.lock().map_err(|e| e.to_string())?;
    manager.resize(&pty_id, cols, rows)
}

#[tauri::command]
pub fn pty_kill(
    state: State<'_, PtyState>,
    orchestrator: State<'_, OrchestratorState>,
    pty_id: String,
) -> Result<(), String> {
    let manager = state.manager.lock().map_err(|e| e.to_string())?;
    manager.kill(&pty_id)?;
    if let Ok(mut bus) = orchestrator.bus.lock() {
        bus.unregister(&pty_id);
    }
    Ok(())
}

#[tauri::command]
pub fn pty_bind_herdr(
    app: AppHandle,
    herdr: State<'_, HerdrState>,
    pty: State<'_, PtyState>,
    pty_id: String,
    pane_id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    let binary = {
        let mut bridge = herdr.bridge.lock().map_err(|e| e.to_string())?;
        if !bridge.status().connected {
            bridge.connect_or_spawn()?;
        }
        bridge.resolved_binary_path()?
    };
    let manager = pty.manager.lock().map_err(|e| e.to_string())?;
    manager.bind_herdr(&app, &pty_id, &binary, &pane_id, cols, rows)
}
