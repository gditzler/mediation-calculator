import { useState } from "react";
import { addRound, updateRound as apiUpdateRound } from "../api";
import { RoundInputRow } from "./RoundInputRow";
import type { Round, AddRoundInput } from "../types";

interface RoundsTableProps {
  mediationId: string;
  rounds: Round[];
  onRoundsChange: () => void;
  onStartWhatIf?: () => void;
}

export function RoundsTable({ mediationId, rounds, onRoundsChange, onStartWhatIf }: RoundsTableProps) {
  const [addingRound, setAddingRound] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal1, setEditVal1] = useState("");
  const [editVal2, setEditVal2] = useState("");

  const committedRounds = rounds.filter((r) => !r.is_speculative);
  const hasStandardWithBoth = committedRounds.some(
    (r) => r.round_type === "standard" && r.demand != null && r.offer != null
  );

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
        is_speculative: false,
      };
      await addRound(input);
      setAddingRound(false);
      onRoundsChange();
    } catch (err) {
      console.error("Failed to add round:", err);
    }
  };

  const startEdit = (round: Round) => {
    setEditingId(round.id);
    if (round.round_type === "standard") {
      setEditVal1(round.demand?.toString() ?? "");
      setEditVal2(round.offer?.toString() ?? "");
    } else {
      setEditVal1(round.bracket_high?.toString() ?? "");
      setEditVal2(round.bracket_low?.toString() ?? "");
    }
  };

  const saveEdit = async (round: Round) => {
    const v1 = parseFloat(editVal1);
    const v2 = parseFloat(editVal2);
    if (isNaN(v1) || isNaN(v2)) return;

    try {
      const updated: Round = {
        ...round,
        midpoint: (v1 + v2) / 2,
        ...(round.round_type === "standard"
          ? { demand: v1, offer: v2 }
          : { bracket_high: v1, bracket_low: v2 }),
      };
      await apiUpdateRound(updated);
      setEditingId(null);
      onRoundsChange();
    } catch (err) {
      console.error("Failed to update round:", err);
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent, round: Round) => {
    if (e.key === "Enter") saveEdit(round);
    if (e.key === "Escape") setEditingId(null);
  };

  const formatCurrency = (val: number | null) =>
    val != null ? `$${val.toLocaleString()}` : "—";

  const formatRatio = (high: number | null, low: number | null) => {
    if (high == null || low == null || low === 0) return "—";
    const ratio = high / low;
    return `1:${parseFloat(ratio.toFixed(2))}`;
  };

  return (
    <div
      className="rounded-xl"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between px-5 py-3">
        <span className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
          Negotiation Rounds
        </span>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 rounded-md text-xs"
            style={{
              background: "var(--speculative-bg)",
              border: "1px solid var(--speculative-border)",
              color: "var(--speculative-text)",
            }}
            onClick={() => onStartWhatIf?.()}
          >
            + What-If
          </button>
          <button
            className="px-3 py-1 rounded-md text-xs"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
            onClick={() => setAddingRound(true)}
          >
            + Add Round
          </button>
        </div>
      </div>

      {/* Table header */}
      <div
        className="grid px-5 py-2 text-xs font-semibold uppercase tracking-wide"
        style={{
          gridTemplateColumns: "0.5fr 1.5fr 1.5fr 1.5fr 1fr 1fr 0.5fr",
          color: "var(--text-muted)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div>Round</div>
        <div className="text-right">Demand / High</div>
        <div className="text-right">Offer / Low</div>
        <div className="text-right">Midpoint</div>
        <div className="text-right">Gap</div>
        <div className="text-right">Ratio</div>
        <div></div>
      </div>

      {/* Committed rows */}
      {committedRounds.map((round) => (
        <div
          key={round.id}
          className="grid px-5 py-3 text-sm items-center"
          style={{
            gridTemplateColumns: "0.5fr 1.5fr 1.5fr 1.5fr 1fr 1fr 0.5fr",
            borderBottom: "1px solid var(--border-light)",
          }}
          onDoubleClick={() => startEdit(round)}
        >
          <div className="font-semibold" style={{ color: "var(--text-secondary)" }}>
            {round.round_number}
            {round.round_type === "bracket" && (
              <span className="ml-1 text-xs" style={{ color: "var(--text-muted)" }}>
                B({round.bracket_proposed_by?.[0].toUpperCase()})
              </span>
            )}
          </div>

          {editingId === round.id ? (
            <>
              <input
                className="text-right px-2 py-1 rounded text-sm outline-none"
                style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--demand)" }}
                value={editVal1}
                onChange={(e) => setEditVal1(e.target.value)}
                onKeyDown={(e) => handleEditKeyDown(e, round)}
                autoFocus
              />
              <input
                className="text-right px-2 py-1 rounded text-sm outline-none"
                style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--offer)" }}
                value={editVal2}
                onChange={(e) => setEditVal2(e.target.value)}
                onKeyDown={(e) => handleEditKeyDown(e, round)}
              />
              <div className="text-right font-semibold" style={{ color: "var(--text-muted)" }}>
                {!isNaN(parseFloat(editVal1)) && !isNaN(parseFloat(editVal2))
                  ? formatCurrency((parseFloat(editVal1) + parseFloat(editVal2)) / 2)
                  : "—"}
              </div>
              <div className="text-right font-medium" style={{ color: "var(--text-muted)" }}>
                {!isNaN(parseFloat(editVal1)) && !isNaN(parseFloat(editVal2))
                  ? formatCurrency(parseFloat(editVal1) - parseFloat(editVal2))
                  : "—"}
              </div>
              <div className="text-right font-medium" style={{ color: "var(--text-muted)" }}>
                {!isNaN(parseFloat(editVal1)) && !isNaN(parseFloat(editVal2))
                  ? formatRatio(parseFloat(editVal1), parseFloat(editVal2))
                  : "—"}
              </div>
              <div className="flex gap-1 justify-end">
                <button className="text-xs" style={{ color: "var(--accent)" }} onClick={() => saveEdit(round)}>✓</button>
                <button className="text-xs" style={{ color: "var(--text-muted)" }} onClick={() => setEditingId(null)}>✕</button>
              </div>
            </>
          ) : (
            <>
              <div className="text-right font-medium" style={{ color: "var(--demand)" }}>
                {round.round_type === "standard"
                  ? formatCurrency(round.demand)
                  : formatCurrency(round.bracket_high)}
              </div>
              <div className="text-right font-medium" style={{ color: "var(--offer)" }}>
                {round.round_type === "standard"
                  ? formatCurrency(round.offer)
                  : formatCurrency(round.bracket_low)}
              </div>
              <div className="text-right font-semibold">
                {formatCurrency(round.midpoint)}
              </div>
              <div className="text-right font-medium" style={{ color: "var(--text-muted)" }}>
                {round.round_type === "standard"
                  ? round.demand != null && round.offer != null
                    ? formatCurrency(round.demand - round.offer)
                    : "—"
                  : round.bracket_high != null && round.bracket_low != null
                    ? formatCurrency(round.bracket_high - round.bracket_low)
                    : "—"}
              </div>
              <div className="text-right font-medium" style={{ color: "var(--text-muted)" }}>
                {round.round_type === "standard"
                  ? formatRatio(round.demand, round.offer)
                  : formatRatio(round.bracket_high, round.bracket_low)}
              </div>
              <div></div>
            </>
          )}
        </div>
      ))}

      {/* Add round input */}
      {addingRound && (
        <div className="px-5 pb-3">
          <RoundInputRow
            allowBracket={hasStandardWithBoth}
            isSpeculative={false}
            branchFromRound={null}
            onSubmit={handleAdd}
            onCancel={() => setAddingRound(false)}
          />
        </div>
      )}

      {committedRounds.length === 0 && !addingRound && (
        <div className="px-5 py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          No rounds yet. Click "+ Add Round" to begin.
        </div>
      )}
    </div>
  );
}
