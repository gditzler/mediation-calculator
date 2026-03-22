import { invoke } from "@tauri-apps/api/core";
import type {
  Mediation,
  MediationSummary,
  Round,
  AddRoundInput,
  AddMoveInput,
  BracketResponseInput,
  Variation,
} from "./types";

// Mediations
export const createMediation = () =>
  invoke<Mediation>("create_mediation");

export const getMediation = (id: string) =>
  invoke<Mediation>("get_mediation", { id });

export const updateMediation = (mediation: Mediation) =>
  invoke<void>("update_mediation", { mediation });

export const deleteMediation = (id: string) =>
  invoke<void>("delete_mediation", { id });

export const listMediations = (search: string, statusFilter: string) =>
  invoke<MediationSummary[]>("list_mediations", {
    search: search || null,
    statusFilter: statusFilter || null,
  });

export const autocompleteField = (field: string, prefix: string) =>
  invoke<string[]>("autocomplete_field", { field, prefix });

// Rounds
export const addRound = (input: AddRoundInput) =>
  invoke<Round>("add_round", { input });

export const getRounds = (mediationId: string) =>
  invoke<Round[]>("get_rounds", { mediationId });

export const updateRound = (round: Round) =>
  invoke<void>("update_round", { round });

export const deleteRound = (id: string) =>
  invoke<void>("delete_round", { id });

export const promoteSpeculativeRounds = (
  mediationId: string,
  upToRound: number
) =>
  invoke<void>("promote_speculative_rounds", {
    mediationId,
    upToRound,
  });

export const discardSpeculativeRounds = (
  mediationId: string,
  fromRound: number
) =>
  invoke<void>("discard_speculative_rounds", {
    mediationId,
    fromRound,
  });

export const getVariations = (
  midpoint: number,
  currentDemand: number,
  count: number
) =>
  invoke<Variation[]>("get_variations", {
    midpoint,
    currentDemand,
    count,
  });

export const addMove = (input: AddMoveInput) =>
  invoke<Round>("add_move", { input });

export const respondToBracket = (input: BracketResponseInput) =>
  invoke<Round>("respond_to_bracket", { input });

// Settings
export const getSetting = (key: string) =>
  invoke<string | null>("get_setting", { key });

export const setSetting = (key: string, value: string) =>
  invoke<void>("set_setting", { key, value });
