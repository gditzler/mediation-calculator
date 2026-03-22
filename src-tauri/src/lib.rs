mod calculations;
mod commands;
mod db;
mod models;

use db::Database;
use std::sync::Arc;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let app_dir = app.path().app_data_dir().expect("failed to get app data dir");
            std::fs::create_dir_all(&app_dir).expect("failed to create app data dir");
            let db_path = app_dir.join("gladice.db");
            let database =
                Database::new(db_path.to_str().unwrap()).expect("failed to initialize database");
            app.manage(Arc::new(database));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::mediations::create_mediation,
            commands::mediations::get_mediation,
            commands::mediations::update_mediation,
            commands::mediations::delete_mediation,
            commands::mediations::list_mediations,
            commands::mediations::autocomplete_field,
            commands::rounds::add_round,
            commands::rounds::add_move,
            commands::rounds::respond_to_bracket,
            commands::rounds::get_rounds,
            commands::rounds::update_round,
            commands::rounds::delete_round,
            commands::rounds::promote_speculative_rounds,
            commands::rounds::discard_speculative_rounds,
            commands::rounds::get_variations,
            commands::settings::get_setting,
            commands::settings::set_setting,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
