use std::sync::Mutex;

use tauri::State;

use crate::herdr::binary;
use crate::herdr::{HerdrBridge, HerdrStatusSnapshot};

pub struct HerdrState {
    pub bridge: Mutex<HerdrBridge>,
}

fn with_connected_bridge<T>(
    state: &State<'_, HerdrState>,
    f: impl FnOnce(&mut HerdrBridge) -> Result<T, String>,
) -> Result<T, String> {
    let mut bridge = state.bridge.lock().map_err(|e| e.to_string())?;
    if !bridge.status().connected {
        bridge.connect_or_spawn()?;
    }
    f(&mut bridge)
}

#[tauri::command]
pub fn herdr_status(state: State<'_, HerdrState>) -> Result<HerdrStatusSnapshot, String> {
    let bridge = state.bridge.lock().map_err(|e| e.to_string())?;
    Ok(bridge.status())
}

#[tauri::command]
pub fn herdr_ensure_present(state: State<'_, HerdrState>) -> Result<HerdrStatusSnapshot, String> {
    let mut bridge = state.bridge.lock().map_err(|e| e.to_string())?;
    bridge.ensure_present()?;
    Ok(bridge.status())
}

#[tauri::command]
pub fn herdr_connect(state: State<'_, HerdrState>) -> Result<bool, String> {
    let mut bridge = state.bridge.lock().map_err(|e| e.to_string())?;
    bridge.connect_or_spawn()
}

#[tauri::command]
pub fn herdr_run(state: State<'_, HerdrState>, args: Vec<String>) -> Result<String, String> {
    let bridge = state.bridge.lock().map_err(|e| e.to_string())?;
    if bridge.status().present {
        return bridge.run_cli(&args);
    }
    drop(bridge);
    let mut bridge = state.bridge.lock().map_err(|e| e.to_string())?;
    bridge.ensure_present()?;
    bridge.connect_or_spawn()?;
    bridge.run_cli(&args)
}

#[tauri::command]
pub fn herdr_pane_send(
    state: State<'_, HerdrState>,
    pane_id: String,
    text: String,
) -> Result<(), String> {
    if text.is_empty() {
        return Ok(());
    }
    with_connected_bridge(&state, |bridge| bridge.pane_send(&pane_id, &text))
}

#[tauri::command]
pub fn herdr_pane_read_visible(
    state: State<'_, HerdrState>,
    pane_id: String,
    lines: Option<u32>,
) -> Result<String, String> {
    let line_count = lines.unwrap_or(24);
    with_connected_bridge(&state, |bridge| bridge.pane_read_visible(&pane_id, line_count))
}

#[tauri::command]
pub fn herdr_pane_read_recent(
    state: State<'_, HerdrState>,
    pane_id: String,
    lines: Option<u32>,
) -> Result<String, String> {
    let line_count = lines.unwrap_or(24);
    with_connected_bridge(&state, |bridge| bridge.pane_read_recent(&pane_id, line_count))
}

#[tauri::command]
pub fn herdr_pane_send_keys(
    state: State<'_, HerdrState>,
    pane_id: String,
    keys: Vec<String>,
) -> Result<(), String> {
    if keys.is_empty() {
        return Ok(());
    }
    with_connected_bridge(&state, |bridge| bridge.pane_send_keys(&pane_id, &keys))
}

#[tauri::command]
pub fn herdr_pane_resize(
    state: State<'_, HerdrState>,
    pane_id: String,
    cols: u32,
    rows: u32,
) -> Result<(), String> {
    let binary = {
        let mut bridge = state.bridge.lock().map_err(|e| e.to_string())?;
        if !bridge.status().connected {
            bridge.connect_or_spawn()?;
        }
        bridge.resolved_binary_path()?
    };
    binary::resize_pane_terminal(&binary, &pane_id, cols as u16, rows as u16)
}
