use tauri::{AppHandle, State};

use crate::commands::pty::PtyState;
use crate::orchestrator::OrchestratorState;

#[tauri::command]
pub fn orchestrator_dispatch(
    app: AppHandle,
    orchestrator: State<'_, OrchestratorState>,
    pty: State<'_, PtyState>,
    pty_id: String,
    text: String,
    agent_kind: Option<String>,
) -> Result<(), String> {
    let manager = pty.manager.lock().map_err(|e| e.to_string())?;
    let mut bus = orchestrator.bus.lock().map_err(|e| e.to_string())?;

    if let Some(kind) = agent_kind {
        bus.set_agent_kind(&pty_id, Some(kind));
    }

    bus.dispatch_message(&manager, &pty_id, &text)?;
    bus.emit_current(&app, &pty_id);
    Ok(())
}

#[tauri::command]
pub fn orchestrator_force_done(
    app: AppHandle,
    orchestrator: State<'_, OrchestratorState>,
    pty_id: String,
) -> Result<(), String> {
    let mut bus = orchestrator.bus.lock().map_err(|e| e.to_string())?;
    bus.force_done(&app, &pty_id);
    Ok(())
}

#[tauri::command]
pub fn orchestrator_get_status(
    orchestrator: State<'_, OrchestratorState>,
    pty_id: String,
) -> Result<Option<OrchestratorStatusDto>, String> {
    let bus = orchestrator.bus.lock().map_err(|e| e.to_string())?;
    Ok(bus.get_status(&pty_id).map(|s| OrchestratorStatusDto {
        status: s.status.as_str().to_string(),
        output_tail: s.output_tail,
    }))
}

#[derive(serde::Serialize)]
pub struct OrchestratorStatusDto {
    pub status: String,
    pub output_tail: String,
}
