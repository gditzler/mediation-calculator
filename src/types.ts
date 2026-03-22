export type MediationStatus = "in_progress" | "settled" | "impasse" | "adjourned" | "mediators_proposal";

export interface Mediation {
  id: string;
  plaintiff: string;
  defendant: string;
  defense_firm: string;
  counsel: string;
  mediator: string;
  status: MediationStatus;
  notes: string;
  notes_format: "markdown" | "raw";
  mediation_date: string;
  created_at: string;
  updated_at: string;
}

export interface MediationSummary {
  id: string;
  plaintiff: string;
  defendant: string;
  mediator: string;
  status: MediationStatus;
  updated_at: string;
}

export interface Round {
  id: string;
  mediation_id: string;
  round_number: number;
  round_type: "standard" | "bracket";
  demand: number | null;
  offer: number | null;
  bracket_high: number | null;
  bracket_low: number | null;
  bracket_proposed_by: "plaintiff" | "defendant" | "both" | null;
  midpoint: number;
  is_speculative: boolean;
  branch_from_round: number | null;
  created_at: string;
  demand_time: string;
  offer_time: string;
  bracket_response: "accepted" | "declined" | null;
}

export interface AddRoundInput {
  mediation_id: string;
  round_type: "standard" | "bracket";
  demand?: number;
  offer?: number;
  bracket_high?: number;
  bracket_low?: number;
  bracket_proposed_by?: "plaintiff" | "defendant" | "both";
  demand_bracket_low?: number;
  demand_bracket_high?: number;
  offer_bracket_low?: number;
  offer_bracket_high?: number;
  is_speculative: boolean;
  branch_from_round?: number;
}

export interface AddMoveInput {
  mediation_id: string;
  move_type: "demand" | "offer";
  amount: number;
  is_bracket: boolean;
  bracket_low?: number;
  bracket_high?: number;
}

export interface BracketResponseInput {
  round_id: string;
  response: "accepted" | "declined";
  counter_amount?: number;
}

export interface Variation {
  demand: number;
  offer_needed: number;
}

export type ThemeName =
  | "light"
  | "dark"
  | "solarized-light"
  | "solarized-dark"
  | "nord-light"
  | "nord-dark";

export interface Tab {
  id: string;
  type: "home" | "mediation";
  mediationId?: string;
  label: string;
}
