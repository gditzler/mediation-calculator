mod db;
mod models;

use db::Database;
use std::sync::Arc;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let app_dir = app.path().app_data_dir().expect("failed to get app data dir");
            std::fs::create_dir_all(&app_dir).expect("failed to create app data dir");
            let db_path = app_dir.join("gladice.db");
            let database =
                Database::new(db_path.to_str().unwrap()).expect("failed to initialize database");
            app.manage(Arc::new(database));
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
