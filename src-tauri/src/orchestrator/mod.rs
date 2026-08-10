pub mod bus;
pub mod parser;

use std::sync::Mutex;

use tauri::{AppHandle, Manager};

pub struct OrchestratorState {
    pub bus: Mutex<bus::OrchestratorBus>,
}

pub fn on_pty_output(app: &AppHandle, pty_id: &str, data: &str) {
    if let Some(state) = app.try_state::<OrchestratorState>() {
        if let Ok(mut bus) = state.bus.lock() {
            bus.on_output(app, pty_id, data);
        }
    }
}
