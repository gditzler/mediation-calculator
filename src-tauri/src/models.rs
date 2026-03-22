use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Mediation {
    pub id: String,
    pub plaintiff: String,
    pub defendant: String,
    pub defense_firm: String,
    pub counsel: String,
    pub mediator: String,
    pub status: String,
    pub notes: String,
    pub notes_format: String,
    pub mediation_date: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Round {
    pub id: String,
    pub mediation_id: String,
    pub round_number: i32,
    pub round_type: String,
    pub demand: Option<f64>,
    pub offer: Option<f64>,
    pub bracket_high: Option<f64>,
    pub bracket_low: Option<f64>,
    pub bracket_proposed_by: Option<String>,
    pub midpoint: f64,
    pub is_speculative: bool,
    pub branch_from_round: Option<i32>,
    pub created_at: String,
    pub demand_time: String,
    pub offer_time: String,
    pub bracket_response: Option<String>,
}

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Setting {
    pub key: String,
    pub value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediationSummary {
    pub id: String,
    pub plaintiff: String,
    pub defendant: String,
    pub mediator: String,
    pub status: String,
    pub updated_at: String,
}
