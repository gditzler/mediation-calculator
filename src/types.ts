export type MediationStatus = "in_progress" | "settled" | "impasse" | "adjourned";

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
  bracket_proposed_by: "plaintiff" | "defendant" | null;
  midpoint: number;
  is_speculative: boolean;
  branch_from_round: number | null;
  created_at: string;
}

export interface AddRoundInput {
  mediation_id: string;
  round_type: "standard" | "bracket";
  demand?: number;
  offer?: number;
  bracket_high?: number;
  bracket_low?: number;
  bracket_proposed_by?: "plaintiff" | "defendant";
  is_speculative: boolean;
  branch_from_round?: number;
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
