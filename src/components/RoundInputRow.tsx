import { useState } from "react";

interface RoundInputRowProps {
  allowBracket: boolean;
  isSpeculative: boolean;
  branchFromRound: number | null;
  onSubmit: (data: {
    round_type: "standard" | "bracket";
    demand?: number;
    offer?: number;
    bracket_high?: number;
    bracket_low?: number;
    bracket_proposed_by?: "plaintiff" | "defendant";
  }) => void;
  onCancel: () => void;
}

export function RoundInputRow({
  allowBracket,
  isSpeculative,
  branchFromRound,
  onSubmit,
  onCancel,
}: RoundInputRowProps) {
  const [roundType, setRoundType] = useState<"standard" | "bracket">("standard");
  const [val1, setVal1] = useState("");
  const [val2, setVal2] = useState("");
  const [proposedBy, setProposedBy] = useState<"plaintiff" | "defendant">("plaintiff");

  const v1 = parseFloat(val1);
  const v2 = parseFloat(val2);
  const bothValid = !isNaN(v1) && !isNaN(v2) && v1 > 0 && v2 > 0;
  const midpoint = bothValid ? (v1 + v2) / 2 : null;

  const handleSubmit = () => {
    if (!bothValid) return;
    if (roundType === "standard") {
      onSubmit({ round_type: "standard", demand: v1, offer: v2 });
    } else {
      onSubmit({
        round_type: "bracket",
        bracket_high: v1,
        bracket_low: v2,
        bracket_proposed_by: proposedBy,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      if (bothValid) handleSubmit();
    }
    if (e.key === "Escape") onCancel();
  };

  const inputStyle = {
    background: "var(--bg-input)",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
  };

  return (
    <div
      className="px-3 py-2 rounded-lg mt-2"
      style={{
        background: isSpeculative ? "var(--speculative-bg)" : "var(--bg-input)",
        border: isSpeculative
          ? "1px solid var(--speculative-border)"
          : "1px solid var(--border)",
      }}
    >
      <div className="flex items-center gap-3 mb-2">
        <select
          className="px-2 py-1 rounded text-xs outline-none"
          style={inputStyle}
          value={roundType}
          onChange={(e) => setRoundType(e.target.value as "standard" | "bracket")}
        >
          <option value="standard">Standard</option>
          {allowBracket && <option value="bracket">Bracket</option>}
        </select>
        {roundType === "bracket" && (
          <select
            className="px-2 py-1 rounded text-xs outline-none"
            style={inputStyle}
            value={proposedBy}
            onChange={(e) => setProposedBy(e.target.value as "plaintiff" | "defendant")}
          >
            <option value="plaintiff">Plaintiff</option>
            <option value="defendant">Defendant</option>
          </select>
        )}
        {isSpeculative && branchFromRound && (
          <span className="text-xs" style={{ color: "var(--speculative-text)" }}>
            What-If from Round {branchFromRound}
          </span>
        )}
      </div>
      <div className="grid gap-3 items-center" style={{ gridTemplateColumns: "0.5fr 1.5fr 1.5fr 1.5fr 0.5fr" }}>
        <div className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
          —
        </div>
        <input
          className="px-2 py-1.5 rounded text-sm text-right outline-none"
          style={inputStyle}
          placeholder={roundType === "standard" ? "Demand" : "Bracket High"}
          value={val1}
          onChange={(e) => setVal1(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <input
          className="px-2 py-1.5 rounded text-sm text-right outline-none"
          style={inputStyle}
          placeholder={roundType === "standard" ? "Offer" : "Bracket Low"}
          value={val2}
          onChange={(e) => setVal2(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="text-sm text-right font-semibold" style={{ color: "var(--text-muted)" }}>
          {midpoint !== null ? `$${midpoint.toLocaleString()}` : "—"}
        </div>
        <div className="flex gap-1 justify-end">
          <button
            className="text-xs px-2 py-1 rounded"
            style={{ color: "var(--accent)" }}
            onClick={handleSubmit}
            disabled={!bothValid}
          >
            ✓
          </button>
          <button
            className="text-xs px-2 py-1 rounded"
            style={{ color: "var(--text-muted)" }}
            onClick={onCancel}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
