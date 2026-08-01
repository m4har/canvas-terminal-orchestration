mod commands;

use std::sync::Mutex;

use tauri::Manager;
use workflow::repo::WorkflowRepo;

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
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::workflow::load_canvas,
            commands::workflow::save_canvas,
            commands::herdr::herdr_run,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
