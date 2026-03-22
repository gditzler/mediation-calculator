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

#[derive(Debug, Deserialize)]
pub struct AddMoveInput {
    pub mediation_id: String,
    pub move_type: String,        // "demand" or "offer"
    pub amount: f64,
    pub is_bracket: bool,
    pub bracket_low: Option<f64>,
    pub bracket_high: Option<f64>,
}

#[tauri::command]
pub fn add_move(
    db: State<'_, Arc<Database>>,
    input: AddMoveInput,
) -> Result<Round, String> {
    let now = chrono::Utc::now().to_rfc3339();

    // Get existing non-speculative rounds
    let existing_rounds = db
        .get_rounds(&input.mediation_id)
        .map_err(|e| e.to_string())?;
    let committed: Vec<&Round> = existing_rounds.iter().filter(|r| !r.is_speculative).collect();

    // Determine bracket fields
    let (bracket_high, bracket_low, bracket_proposed_by) = if input.is_bracket {
        let proposed_by = if input.move_type == "demand" { "plaintiff" } else { "defendant" };
        (input.bracket_high, input.bracket_low, Some(proposed_by.to_string()))
    } else {
        (None, None, None)
    };

    let round_type = if input.is_bracket { "bracket".to_string() } else { "standard".to_string() };

    if input.move_type == "demand" {
        // Demand always creates a new round
        let max_round = committed.iter().map(|r| r.round_number).max().unwrap_or(0);
        let round = Round {
            id: Uuid::new_v4().to_string(),
            mediation_id: input.mediation_id,
            round_number: max_round + 1,
            round_type,
            demand: Some(input.amount),
            offer: None,
            bracket_high,
            bracket_low,
            bracket_proposed_by,
            midpoint: 0.0, // No midpoint until both sides filled
            is_speculative: false,
            branch_from_round: None,
            created_at: now.clone(),
            demand_time: now,
            offer_time: String::new(),
            bracket_response: None,
        };
        db.add_round(&round).map_err(|e| e.to_string())?;
        Ok(round)
    } else {
        // Offer: find latest incomplete round (has demand but no offer, and not an accepted bracket)
        let incomplete = committed.iter().rev().find(|r| {
            r.demand.is_some()
                && r.offer.is_none()
                && r.bracket_response.as_deref() != Some("accepted")
        });

        if let Some(existing) = incomplete {
            // Update existing round with offer
            let mut updated = (*existing).clone();
            updated.offer = Some(input.amount);
            updated.offer_time = now;
            if input.is_bracket {
                updated.round_type = round_type;
                updated.bracket_high = bracket_high;
                updated.bracket_low = bracket_low;
                updated.bracket_proposed_by = bracket_proposed_by;
            }
            // Compute midpoint now that both sides are filled
            updated.midpoint = calculations::compute_midpoint_standard(
                updated.demand.unwrap_or(0.0),
                updated.offer.unwrap_or(0.0),
            );
            db.update_round(&updated).map_err(|e| e.to_string())?;
            Ok(updated)
        } else {
            // No incomplete round, create new round with just offer
            let max_round = committed.iter().map(|r| r.round_number).max().unwrap_or(0);
            let round = Round {
                id: Uuid::new_v4().to_string(),
                mediation_id: input.mediation_id,
                round_number: max_round + 1,
                round_type,
                demand: None,
                offer: Some(input.amount),
                bracket_high,
                bracket_low,
                bracket_proposed_by,
                midpoint: 0.0,
                is_speculative: false,
                branch_from_round: None,
                created_at: now.clone(),
                demand_time: String::new(),
                offer_time: now,
                bracket_response: None,
            };
            db.add_round(&round).map_err(|e| e.to_string())?;
            Ok(round)
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct BracketResponseInput {
    pub round_id: String,
    pub response: String, // "accepted" or "declined"
    pub counter_amount: Option<f64>, // required if declined
}

#[tauri::command]
pub fn respond_to_bracket(
    db: State<'_, Arc<Database>>,
    input: BracketResponseInput,
) -> Result<Round, String> {
    let now = chrono::Utc::now().to_rfc3339();

    let round = db.get_round_by_id(&input.round_id).map_err(|e| e.to_string())?;
    let mut updated = round;

    updated.bracket_response = Some(input.response.clone());

    if input.response == "declined" {
        if let Some(counter) = input.counter_amount {
            // Fill in the missing side with the counter amount
            if updated.demand.is_some() && updated.offer.is_none() {
                updated.offer = Some(counter);
                updated.offer_time = now;
            } else if updated.offer.is_some() && updated.demand.is_none() {
                updated.demand = Some(counter);
                updated.demand_time = now;
            }
            // Recompute midpoint
            updated.midpoint = calculations::compute_midpoint_standard(
                updated.demand.unwrap_or(0.0),
                updated.offer.unwrap_or(0.0),
            );
        }
    }

    if input.response == "accepted" {
        // Accepted bracket: midpoint carries forward from previous round
        let all_rounds = db
            .get_rounds(&updated.mediation_id)
            .map_err(|e| e.to_string())?;
        let prev = all_rounds
            .iter()
            .filter(|r| !r.is_speculative && r.round_number < updated.round_number && r.midpoint != 0.0)
            .last();
        if let Some(prev_round) = prev {
            updated.midpoint = prev_round.midpoint;
        }
    }

    db.update_round(&updated).map_err(|e| e.to_string())?;
    Ok(updated)
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
