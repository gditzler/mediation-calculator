use crate::calculations::{self, Variation};
use crate::db::Database;
use crate::models::Round;
use serde::Deserialize;
use std::sync::Arc;
use tauri::State;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct AddRoundInput {
    pub mediation_id: String,
    pub round_type: String,
    pub demand: Option<f64>,
    pub offer: Option<f64>,
    pub bracket_high: Option<f64>,
    pub bracket_low: Option<f64>,
    pub bracket_proposed_by: Option<String>,
    pub is_speculative: bool,
    pub branch_from_round: Option<i32>,
}

#[tauri::command]
pub fn add_round(
    db: State<'_, Arc<Database>>,
    input: AddRoundInput,
) -> Result<Round, String> {
    // Validate bracket fields if bracket type
    if input.round_type == "bracket" {
        if input.bracket_high.is_none() || input.bracket_low.is_none() {
            return Err("Bracket rounds require both high and low values".to_string());
        }
    }

    // Compute midpoint from demand/offer (bracket rounds now send
    // the bracket midpoint as the demand or offer value)
    let demand = input.demand.unwrap_or(0.0);
    let offer = input.offer.unwrap_or(0.0);
    let midpoint = calculations::compute_midpoint_standard(demand, offer);

    // Determine round_number: max existing + 1
    let existing_rounds = db
        .get_rounds(&input.mediation_id)
        .map_err(|e| e.to_string())?;
    let max_round = existing_rounds
        .iter()
        .map(|r| r.round_number)
        .max()
        .unwrap_or(0);
    let round_number = max_round + 1;

    let now = chrono::Utc::now().to_rfc3339();
    let round = Round {
        id: Uuid::new_v4().to_string(),
        mediation_id: input.mediation_id,
        round_number,
        round_type: input.round_type,
        demand: input.demand,
        offer: input.offer,
        bracket_high: input.bracket_high,
        bracket_low: input.bracket_low,
        bracket_proposed_by: input.bracket_proposed_by,
        midpoint,
        is_speculative: input.is_speculative,
        branch_from_round: input.branch_from_round,
        created_at: now.clone(),
        demand_time: now.clone(),
        offer_time: now.clone(),
        bracket_response: None,
    };

    db.add_round(&round).map_err(|e| e.to_string())?;
    Ok(round)
}

#[tauri::command]
pub fn get_rounds(
    db: State<'_, Arc<Database>>,
    mediation_id: String,
) -> Result<Vec<Round>, String> {
    db.get_rounds(&mediation_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_round(db: State<'_, Arc<Database>>, round: Round) -> Result<(), String> {
    db.update_round(&round).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_round(db: State<'_, Arc<Database>>, id: String) -> Result<(), String> {
    db.delete_round(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn promote_speculative_rounds(
    db: State<'_, Arc<Database>>,
    mediation_id: String,
    up_to_round: i32,
) -> Result<(), String> {
    db.promote_speculative_rounds(&mediation_id, up_to_round)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn discard_speculative_rounds(
    db: State<'_, Arc<Database>>,
    mediation_id: String,
    from_round: i32,
) -> Result<(), String> {
    db.discard_speculative_rounds(&mediation_id, from_round)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_variations(
    midpoint: f64,
    current_demand: f64,
    count: usize,
) -> Result<Vec<Variation>, String> {
    Ok(calculations::generate_variations(
        midpoint,
        current_demand,
        count,
    ))
}
