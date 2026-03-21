import { useState, useEffect } from "react";
import {
  addRound,
  deleteRound,
  promoteSpeculativeRounds,
} from "../api";
import { RoundInputRow } from "./RoundInputRow";
import type { Round, AddRoundInput } from "../types";

interface SpeculativeRoundsProps {
  mediationId: string;
  speculativeRounds: Round[];
  lastCommittedRound: number;
  allowBracket: boolean;
  onRoundsChange: () => void | Promise<void>;
  startAdding?: boolean;
}

export function SpeculativeRounds({
  mediationId,
  speculativeRounds,
  lastCommittedRound,
  allowBracket,
  onRoundsChange,
  startAdding = false,
}: SpeculativeRoundsProps) {
  const [addingSpeculative, setAddingSpeculative] = useState(startAdding);

  useEffect(() => {
    if (startAdding) setAddingSpeculative(true);
  }, [startAdding]);

  const handleAdd = async (data: {
    round_type: "standard" | "bracket";
    demand?: number;
    offer?: number;
    bracket_high?: number;
    bracket_low?: number;
    bracket_proposed_by?: "plaintiff" | "defendant";
  }) => {
    try {
      const input: AddRoundInput = {
        mediation_id: mediationId,
        round_type: data.round_type,
        demand: data.demand,
        offer: data.offer,
        bracket_high: data.bracket_high,
        bracket_low: data.bracket_low,
        bracket_proposed_by: data.bracket_proposed_by,
        is_speculative: true,
        branch_from_round: lastCommittedRound,
      };
      await addRound(input);
      setAddingSpeculative(false);
      await onRoundsChange();
    } catch (err) {
      console.error("Failed to add speculative round:", err);
    }
  };

  const handlePromote = async (roundNumber: number) => {
    try {
      await promoteSpeculativeRounds(mediationId, roundNumber);
      await onRoundsChange();
    } catch (err) {
      console.error("Failed to promote rounds:", err);
    }
  };

  const handleDiscard = async (roundId: string) => {
    try {
      await deleteRound(roundId);
      await onRoundsChange();
    } catch (err) {
      console.error("Failed to discard round:", err);
    }
  };

  const formatCurrency = (val: number | null) =>
    val != null ? `$${val.toLocaleString()}` : "—";

  const formatRatio = (high: number | null, low: number | null) => {
    if (high == null || low == null || low === 0) return "—";
    const ratio = high / low;
    return `1:${parseFloat(ratio.toFixed(2))}`;
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  if (speculativeRounds.length === 0 && !addingSpeculative) return null;

  return (
    <div
      className="rounded-lg ml-5 mr-5 mb-3"
      style={{
        background: "var(--speculative-bg)",
        borderLeft: "3px solid var(--speculative-border)",
      }}
    >
      <div className="px-4 py-2 flex items-center justify-between">
        <span
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: "var(--speculative-text)" }}
        >
          What-If from Round {lastCommittedRound}
        </span>
        <button
          className="text-xs px-2 py-1 rounded"
          style={{
            background: "var(--speculative-bg)",
            border: "1px solid var(--speculative-border)",
            color: "var(--speculative-text)",
          }}
          onClick={() => setAddingSpeculative(true)}
        >
          + Add
        </button>
      </div>

      {speculativeRounds.map((round) => (
        <div
          key={round.id}
          className="grid px-4 py-2.5 text-sm items-center"
          style={{
            gridTemplateColumns: "0.5fr 1fr 1.5fr 1.5fr 1.5fr 1fr 1fr 0.5fr",
            borderBottom: "1px solid var(--speculative-border)",
            borderBottomWidth: "0.5px",
          }}
        >
          <div className="font-semibold" style={{ color: "var(--speculative-text)" }}>
            {round.round_number}?
          </div>
          <div className="text-right text-xs italic" style={{ color: "var(--text-muted)" }}>
            {formatTime(round.created_at)}
          </div>
          <div className="text-right font-medium italic" style={{ color: "var(--demand)" }}>
            {round.round_type === "standard"
              ? formatCurrency(round.demand)
              : formatCurrency(round.bracket_high)}
          </div>
          <div className="text-right font-medium italic" style={{ color: "var(--offer)" }}>
            {round.round_type === "standard"
              ? formatCurrency(round.offer)
              : formatCurrency(round.bracket_low)}
          </div>
          <div className="text-right font-semibold italic">
            {formatCurrency(round.midpoint)}
          </div>
          <div className="text-right font-medium italic" style={{ color: "var(--text-muted)" }}>
            {round.round_type === "standard"
              ? round.demand != null && round.offer != null
                ? formatCurrency(round.demand - round.offer)
                : "—"
              : round.bracket_high != null && round.bracket_low != null
                ? formatCurrency(round.bracket_high - round.bracket_low)
                : "—"}
          </div>
          <div className="text-right font-medium italic" style={{ color: "var(--text-muted)" }}>
            {round.round_type === "standard"
              ? formatRatio(round.demand, round.offer)
              : formatRatio(round.bracket_high, round.bracket_low)}
          </div>
          <div className="flex gap-2 justify-end">
            <button
              className="text-xs"
              title="Commit this round"
              style={{ color: "var(--status-settled-text)" }}
              onClick={() => handlePromote(round.round_number)}
            >
              ✓
            </button>
            <button
              className="text-xs"
              title="Discard"
              style={{ color: "var(--demand)" }}
              onClick={() => handleDiscard(round.id)}
            >
              ✕
            </button>
          </div>
        </div>
      ))}

      {addingSpeculative && (
        <div className="px-4 pb-3">
          <RoundInputRow
            allowBracket={allowBracket}
            isSpeculative={true}
            branchFromRound={lastCommittedRound}
            onSubmit={handleAdd}
            onCancel={() => setAddingSpeculative(false)}
          />
        </div>
      )}
    </div>
  );
}
