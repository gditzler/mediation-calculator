import { useState, useRef } from "react";
import { addMove, respondToBracket, updateRound as apiUpdateRound, deleteRound } from "../api";
import { MoveInputRow } from "./MoveInputRow";
import type { Round } from "../types";

interface RoundsTableProps {
  mediationId: string;
  rounds: Round[];
  onRoundsChange: () => void;
  onStartWhatIf?: () => void;
}

export function RoundsTable({ mediationId, rounds, onRoundsChange, onStartWhatIf }: RoundsTableProps) {
  const [addingMove, setAddingMove] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal1, setEditVal1] = useState("");
  const [editVal2, setEditVal2] = useState("");
  const editRef1 = useRef<HTMLInputElement>(null);
  const editRef2 = useRef<HTMLInputElement>(null);

  const committedRounds = rounds.filter((r) => !r.is_speculative);
  const hasStandardWithBoth = committedRounds.some(
    (r) => r.round_type === "standard" && r.demand != null && r.offer != null
  );

  const getExpectedMove = (): "demand" | "offer" => {
    if (committedRounds.length === 0) return "demand";
    const latest = committedRounds[committedRounds.length - 1];
    // If latest round is incomplete (has demand but no offer)
    if (latest.demand != null && latest.offer == null) {
      // If it's an accepted bracket, the proposer goes again
      if (latest.bracket_response === "accepted") {
        return latest.bracket_proposed_by === "plaintiff" ? "demand" : "offer";
      }
      return "offer"; // Normal flow: need the other side
    }
    // Round complete, next is a demand
    return "demand";
  };

  const handleAddMove = async (data: {
    move_type: "demand" | "offer";
    amount: number;
    is_bracket: boolean;
    bracket_low?: number;
    bracket_high?: number;
  }) => {
    try {
      await addMove({
        mediation_id: mediationId,
        ...data,
      });
      setAddingMove(false);
      onRoundsChange();
    } catch (err) {
      console.error("Failed to add move:", err);
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

  const handleEditKeyDown1 = (e: React.KeyboardEvent, round: Round) => {
    if (e.key === "Tab") {
      e.preventDefault();
      editRef2.current?.focus();
    }
    if (e.key === "Enter") saveEdit(round);
    if (e.key === "Escape") setEditingId(null);
  };

  const handleEditKeyDown2 = (e: React.KeyboardEvent, round: Round) => {
    if (e.key === "Tab" && e.shiftKey) {
      e.preventDefault();
      editRef1.current?.focus();
    } else if (e.key === "Tab") {
      e.preventDefault();
      saveEdit(round);
    }
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

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
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
            onClick={() => setAddingMove(true)}
          >
            + Add Move
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
                ref={editRef1}
                className="text-right px-2 py-1 rounded text-sm outline-none"
                style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--demand)" }}
                value={editVal1}
                onChange={(e) => setEditVal1(e.target.value)}
                onKeyDown={(e) => handleEditKeyDown1(e, round)}
                autoFocus
              />
              <input
                ref={editRef2}
                className="text-right px-2 py-1 rounded text-sm outline-none"
                style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--offer)" }}
                value={editVal2}
                onChange={(e) => setEditVal2(e.target.value)}
                onKeyDown={(e) => handleEditKeyDown2(e, round)}
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
                <button
                  className="text-xs"
                  style={{ color: "var(--demand)" }}
                  title="Delete round"
                  onClick={async () => {
                    try {
                      await deleteRound(round.id);
                      setEditingId(null);
                      onRoundsChange();
                    } catch (err) {
                      console.error("Failed to delete round:", err);
                    }
                  }}
                >✕</button>
              </div>
            </>
          ) : (
            <>
              <div className="text-right font-medium" style={{ color: "var(--demand)" }}>
                {formatCurrency(round.demand)}
                {round.demand_time && (
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {formatTime(round.demand_time)}
                  </div>
                )}
                {round.round_type === "bracket" && (round.bracket_proposed_by === "plaintiff" || round.bracket_proposed_by === "both") && (
                  <span className="text-xs" style={{ color: "var(--text-muted)" }} title={`Bracket: ${formatCurrency(round.bracket_low)} – ${formatCurrency(round.bracket_high)}`}>B</span>
                )}
              </div>
              <div className="text-right font-medium" style={{ color: "var(--offer)" }}>
                {formatCurrency(round.offer)}
                {round.offer_time && (
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {formatTime(round.offer_time)}
                  </div>
                )}
                {round.round_type === "bracket" && (round.bracket_proposed_by === "defendant" || round.bracket_proposed_by === "both") && (
                  <span className="text-xs" style={{ color: "var(--text-muted)" }} title={`Bracket: ${formatCurrency(round.bracket_low)} – ${formatCurrency(round.bracket_high)}`}>B</span>
                )}
                {round.round_type === "bracket" && round.bracket_response == null && (round.demand == null || round.offer == null) && (
                  <div className="flex gap-1 text-xs mt-1">
                    <button
                      style={{ color: "var(--status-settled-text)" }}
                      onClick={async () => {
                        await respondToBracket({ round_id: round.id, response: "accepted" });
                        onRoundsChange();
                      }}
                    >Accept</button>
                    <button
                      style={{ color: "var(--demand)" }}
                      onClick={() => {
                        respondToBracket({ round_id: round.id, response: "declined" }).then(() => onRoundsChange());
                      }}
                    >Decline</button>
                  </div>
                )}
              </div>
              <div className="text-right font-semibold">
                {round.demand != null && round.offer != null
                  ? formatCurrency(round.midpoint)
                  : "—"}
              </div>
              <div className="text-right font-medium" style={{ color: "var(--text-muted)" }}>
                {round.demand != null && round.offer != null
                  ? formatCurrency(round.demand - round.offer)
                  : "—"}
              </div>
              <div className="text-right font-medium" style={{ color: "var(--text-muted)" }}>
                {round.demand != null && round.offer != null
                  ? formatRatio(round.demand, round.offer)
                  : "—"}
              </div>
              <div></div>
            </>
          )}
        </div>
      ))}

      {/* Add move input */}
      {addingMove && (
        <div className="px-5 pb-3">
          <MoveInputRow
            expectedMove={getExpectedMove()}
            allowBracket={hasStandardWithBoth}
            onSubmit={handleAddMove}
            onCancel={() => setAddingMove(false)}
          />
        </div>
      )}

      {committedRounds.length === 0 && !addingMove && (
        <div className="px-5 py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          No moves yet. Click "+ Add Move" to begin.
        </div>
      )}
    </div>
  );
}
