mod commands;
mod herdr;
mod orchestrator;
mod orchestrator_agent;
mod pty;

use std::sync::Mutex;

use tauri::Manager;
use workflow::repo::WorkflowRepo;

use commands::herdr::HerdrState;
use commands::pty::PtyState;
use orchestrator::OrchestratorState;
use herdr::HerdrBridge;
use pty::PtyManager;

pub struct AppState {
    pub repo: Mutex<WorkflowRepo>,
    pub project_cwd: String,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
            std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
            let db_path = dir.join("canvas.db");
            let repo = workflow::open_db(&db_path).map_err(|e| e.to_string())?;
            let project_cwd = std::env::current_dir()
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_else(|_| "/".to_string());
            app.manage(AppState {
                repo: Mutex::new(repo),
                project_cwd,
            });
            app.manage(HerdrState {
                bridge: Mutex::new(HerdrBridge::new(dir)),
            });
            app.manage(PtyState {
                manager: Mutex::new(PtyManager::new()),
            });
            app.manage(OrchestratorState {
                bus: Mutex::new(orchestrator::bus::OrchestratorBus::new()),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::workflow::load_canvas,
            commands::workflow::save_canvas,
            commands::workflow::get_project_cwd,
            commands::workflow::get_app_setting,
            commands::workflow::set_app_setting,
            commands::herdr::herdr_status,
            commands::herdr::herdr_ensure_present,
            commands::herdr::herdr_connect,
            commands::herdr::herdr_run,
            commands::herdr::herdr_pane_send,
            commands::herdr::herdr_pane_send_keys,
            commands::herdr::herdr_pane_read_visible,
            commands::herdr::herdr_pane_read_recent,
            commands::herdr::herdr_pane_resize,
            commands::pty::pty_spawn,
            commands::pty::pty_write,
            commands::pty::pty_resize,
            commands::pty::pty_kill,
            commands::pty::pty_bind_herdr,
            commands::orchestrator::orchestrator_dispatch,
            commands::orchestrator::orchestrator_force_done,
            commands::orchestrator::orchestrator_get_status,
            commands::orchestra_agent::orchestra_agent_profiles_list,
            commands::orchestra_agent::orchestra_agent_profile_create,
            commands::orchestra_agent::orchestra_agent_profile_update,
            commands::orchestra_agent::orchestra_agent_profile_delete,
            commands::orchestra_agent::orchestra_agent_profile_duplicate,
            commands::orchestra_agent::skills_list_installed,
            commands::orchestra_agent::skills_create,
            commands::orchestra_agent::skills_read,
            commands::orchestra_agent::orchestra_agent_list,
            commands::orchestra_agent::orchestra_agent_create,
            commands::orchestra_agent::orchestra_agent_update,
            commands::orchestra_agent::orchestra_agent_delete,
            commands::orchestra_agent::orchestra_agent_play,
            commands::orchestra_agent::llm_settings_get,
            commands::orchestra_agent::llm_settings_set,
            commands::orchestra_agent::mcp_server_list,
            commands::orchestra_agent::mcp_server_upsert,
            commands::orchestra_agent::mcp_server_delete,
            commands::orchestra_agent::mcp_server_test,
            commands::orchestra_agent::mcp_import_json,
            commands::orchestra_agent::mcp_export_json,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            if let tauri::RunEvent::Exit = event {
                if let Some(state) = app_handle.try_state::<PtyState>() {
                    if let Ok(manager) = state.manager.lock() {
                        manager.shutdown_all();
                    }
                }
                if let Some(state) = app_handle.try_state::<HerdrState>() {
                    if let Ok(mut bridge) = state.bridge.lock() {
                        bridge.shutdown();
                    }
                }
            }
        });
}
