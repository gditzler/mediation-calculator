use crate::db::Database;
use crate::models::{Mediation, MediationSummary};
use std::sync::Arc;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub fn create_mediation(db: State<'_, Arc<Database>>) -> Result<Mediation, String> {
    let now = chrono::Utc::now().to_rfc3339();
    let mediation = Mediation {
        id: Uuid::new_v4().to_string(),
        plaintiff: String::new(),
        defendant: String::new(),
        defense_firm: String::new(),
        counsel: String::new(),
        mediator: String::new(),
        status: "in_progress".to_string(),
        notes: String::new(),
        notes_format: "plain".to_string(),
        created_at: now.clone(),
        updated_at: now,
    };
    db.create_mediation(&mediation).map_err(|e| e.to_string())?;
    Ok(mediation)
}

#[tauri::command]
pub fn get_mediation(db: State<'_, Arc<Database>>, id: String) -> Result<Mediation, String> {
    db.get_mediation(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_mediation(
    db: State<'_, Arc<Database>>,
    mediation: Mediation,
) -> Result<(), String> {
    db.update_mediation(&mediation).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_mediation(db: State<'_, Arc<Database>>, id: String) -> Result<(), String> {
    db.delete_mediation(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_mediations(
    db: State<'_, Arc<Database>>,
    search: Option<String>,
    status_filter: Option<String>,
) -> Result<Vec<MediationSummary>, String> {
    db.list_mediations(search.as_deref(), status_filter.as_deref())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn autocomplete_field(
    db: State<'_, Arc<Database>>,
    field: String,
    prefix: String,
) -> Result<Vec<String>, String> {
    db.autocomplete_field(&field, &prefix)
        .map_err(|e| e.to_string())
}
