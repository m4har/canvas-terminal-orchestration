mod commands;
mod herdr;
mod pty;

use std::sync::Mutex;

use tauri::Manager;
use workflow::repo::WorkflowRepo;

use commands::herdr::HerdrState;
use commands::pty::PtyState;
use herdr::HerdrBridge;
use pty::PtyManager;

pub struct AppState {
    pub repo: Mutex<WorkflowRepo>,
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
            app.manage(AppState {
                repo: Mutex::new(repo),
            });
            app.manage(HerdrState {
                bridge: Mutex::new(HerdrBridge::new(dir)),
            });
            app.manage(PtyState {
                manager: Mutex::new(PtyManager::new()),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::workflow::load_canvas,
            commands::workflow::save_canvas,
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
