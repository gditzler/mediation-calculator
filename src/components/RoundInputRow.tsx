import { useState, useRef } from "react";

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
    bracket_proposed_by?: "plaintiff" | "defendant" | "both";
    demand_bracket_low?: number;
    demand_bracket_high?: number;
    offer_bracket_low?: number;
    offer_bracket_high?: number;
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
  const [proposedBy, setProposedBy] = useState<"plaintiff" | "defendant" | "both">("defendant");
  const [bracketLow, setBracketLow] = useState("");
  const [bracketHigh, setBracketHigh] = useState("");
  const [otherPartyVal, setOtherPartyVal] = useState("");
  // "Both" mode: separate brackets for demand and offer
  const [demandBracketLow, setDemandBracketLow] = useState("");
  const [demandBracketHigh, setDemandBracketHigh] = useState("");
  const [offerBracketLow, setOfferBracketLow] = useState("");
  const [offerBracketHigh, setOfferBracketHigh] = useState("");
  const input1Ref = useRef<HTMLInputElement>(null);
  const input2Ref = useRef<HTMLInputElement>(null);
  const bracketLowRef = useRef<HTMLInputElement>(null);
  const bracketHighRef = useRef<HTMLInputElement>(null);
  const otherPartyRef = useRef<HTMLInputElement>(null);

  // Standard validation
  const v1 = parseFloat(val1);
  const v2 = parseFloat(val2);
  const standardValid = !isNaN(v1) && !isNaN(v2) && v1 > 0 && v2 > 0;

  // Single-side bracket validation
  const bLow = parseFloat(bracketLow);
  const bHigh = parseFloat(bracketHigh);
  const bOther = parseFloat(otherPartyVal);
  const singleBracketValid = !isNaN(bLow) && !isNaN(bHigh) && !isNaN(bOther) && bLow > 0 && bHigh > 0 && bOther > 0 && bHigh > bLow;

  // Both-side bracket validation
  const dbLow = parseFloat(demandBracketLow);
  const dbHigh = parseFloat(demandBracketHigh);
  const obLow = parseFloat(offerBracketLow);
  const obHigh = parseFloat(offerBracketHigh);
  const bothBracketValid = !isNaN(dbLow) && !isNaN(dbHigh) && !isNaN(obLow) && !isNaN(obHigh) && dbLow > 0 && dbHigh > 0 && obLow > 0 && obHigh > 0 && dbHigh > dbLow && obHigh > obLow;

  const bothValid = roundType === "standard"
    ? standardValid
    : proposedBy === "both" ? bothBracketValid : singleBracketValid;

  const computeMidpoint = () => {
    if (roundType === "standard") return standardValid ? (v1 + v2) / 2 : null;
    if (proposedBy === "both") {
      if (!bothBracketValid) return null;
      return ((dbLow + dbHigh) / 2 + (obLow + obHigh) / 2) / 2;
    }
    if (!singleBracketValid) return null;
    const bracketMidpoint = (bLow + bHigh) / 2;
    return proposedBy === "defendant"
      ? (bOther + bracketMidpoint) / 2
      : (bracketMidpoint + bOther) / 2;
  };
  const midpoint = computeMidpoint();

  const handleSubmit = () => {
    if (!bothValid) return;
    if (roundType === "standard") {
      onSubmit({ round_type: "standard", demand: v1, offer: v2 });
    } else if (proposedBy === "both") {
      const demandMid = (dbLow + dbHigh) / 2;
      const offerMid = (obLow + obHigh) / 2;
      onSubmit({
        round_type: "bracket",
        demand: demandMid,
        offer: offerMid,
        bracket_proposed_by: "both",
        demand_bracket_low: dbLow,
        demand_bracket_high: dbHigh,
        offer_bracket_low: obLow,
        offer_bracket_high: obHigh,
      });
    } else {
      const bracketMidpoint = (bLow + bHigh) / 2;
      onSubmit({
        round_type: "bracket",
        demand: proposedBy === "plaintiff" ? bracketMidpoint : bOther,
        offer: proposedBy === "defendant" ? bracketMidpoint : bOther,
        bracket_high: bHigh,
        bracket_low: bLow,
        bracket_proposed_by: proposedBy,
      });
    }
  };

  const handleKeyDown1 = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      e.preventDefault();
      input2Ref.current?.focus();
    }
    if (e.key === "Enter" && bothValid) handleSubmit();
    if (e.key === "Escape") onCancel();
  };

  const handleKeyDown2 = (e: React.KeyboardEvent) => {
    if (e.key === "Tab" && e.shiftKey) {
      e.preventDefault();
      input1Ref.current?.focus();
    } else if (e.key === "Tab") {
      e.preventDefault();
      if (bothValid) handleSubmit();
    }
    if (e.key === "Enter" && bothValid) handleSubmit();
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
            <option value="both">Both</option>
          </select>
        )}
        {isSpeculative && branchFromRound && (
          <span className="text-xs" style={{ color: "var(--speculative-text)" }}>
            What-If from Round {branchFromRound}
          </span>
        )}
      </div>
      {roundType === "standard" ? (
        <div className="grid gap-3 items-center" style={{ gridTemplateColumns: "0.5fr 1.5fr 1.5fr 1.5fr 0.5fr" }}>
          <div className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
            —
          </div>
          <input
            ref={input1Ref}
            className="px-2 py-1.5 rounded text-sm text-right outline-none"
            style={inputStyle}
            placeholder="Demand"
            value={val1}
            onChange={(e) => setVal1(e.target.value)}
            onKeyDown={handleKeyDown1}
            autoFocus
          />
          <input
            ref={input2Ref}
            className="px-2 py-1.5 rounded text-sm text-right outline-none"
            style={inputStyle}
            placeholder="Offer"
            value={val2}
            onChange={(e) => setVal2(e.target.value)}
            onKeyDown={handleKeyDown2}
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
      ) : proposedBy === "both" ? (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1 p-2 rounded" style={{ border: "1px solid var(--border)" }}>
              <span className="text-xs font-semibold" style={{ color: "var(--demand)" }}>Plaintiff Bracket</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Low</label>
                  <input className="w-full px-2 py-1.5 rounded text-sm outline-none" style={inputStyle} placeholder="$0" value={demandBracketLow} onChange={(e) => setDemandBracketLow(e.target.value)} autoFocus onKeyDown={(e) => { if (e.key === "Escape") onCancel(); }} />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>High</label>
                  <input className="w-full px-2 py-1.5 rounded text-sm outline-none" style={inputStyle} placeholder="$0" value={demandBracketHigh} onChange={(e) => setDemandBracketHigh(e.target.value)} onKeyDown={(e) => { if (e.key === "Escape") onCancel(); }} />
                </div>
              </div>
              {!isNaN(dbLow) && !isNaN(dbHigh) && dbHigh > dbLow && (
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Midpoint: ${((dbLow + dbHigh) / 2).toLocaleString()}</span>
              )}
            </div>
            <div className="flex flex-col gap-1 p-2 rounded" style={{ border: "1px solid var(--border)" }}>
              <span className="text-xs font-semibold" style={{ color: "var(--offer)" }}>Defendant Bracket</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Low</label>
                  <input className="w-full px-2 py-1.5 rounded text-sm outline-none" style={inputStyle} placeholder="$0" value={offerBracketLow} onChange={(e) => setOfferBracketLow(e.target.value)} onKeyDown={(e) => { if (e.key === "Escape") onCancel(); }} />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>High</label>
                  <input className="w-full px-2 py-1.5 rounded text-sm outline-none" style={inputStyle} placeholder="$0" value={offerBracketHigh} onChange={(e) => setOfferBracketHigh(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && bothValid) handleSubmit(); if (e.key === "Escape") onCancel(); }} />
                </div>
              </div>
              {!isNaN(obLow) && !isNaN(obHigh) && obHigh > obLow && (
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Midpoint: ${((obLow + obHigh) / 2).toLocaleString()}</span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm" style={{ color: "var(--text-muted)" }}>
              Round midpoint: <strong>{midpoint !== null ? `$${midpoint.toLocaleString()}` : "—"}</strong>
            </div>
            <div className="flex gap-1">
              <button className="text-xs px-3 py-1 rounded" style={{ color: "var(--accent)" }} onClick={handleSubmit} disabled={!bothValid}>✓ Add Bracket</button>
              <button className="text-xs px-2 py-1 rounded" style={{ color: "var(--text-muted)" }} onClick={onCancel}>✕</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                {proposedBy === "defendant" ? "Plaintiff Demand" : "Bracket Low"}
              </label>
              <input
                ref={proposedBy === "defendant" ? otherPartyRef : bracketLowRef}
                className="w-full px-2 py-1.5 rounded text-sm outline-none"
                style={inputStyle}
                placeholder="$0"
                value={proposedBy === "defendant" ? otherPartyVal : bracketLow}
                onChange={(e) => proposedBy === "defendant" ? setOtherPartyVal(e.target.value) : setBracketLow(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Tab") { e.preventDefault(); (proposedBy === "defendant" ? bracketLowRef : bracketHighRef).current?.focus(); }
                  if (e.key === "Enter" && bothValid) handleSubmit();
                  if (e.key === "Escape") onCancel();
                }}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                {proposedBy === "defendant" ? "Bracket Low" : "Bracket High"}
              </label>
              <input
                ref={proposedBy === "defendant" ? bracketLowRef : bracketHighRef}
                className="w-full px-2 py-1.5 rounded text-sm outline-none"
                style={inputStyle}
                placeholder="$0"
                value={proposedBy === "defendant" ? bracketLow : bracketHigh}
                onChange={(e) => proposedBy === "defendant" ? setBracketLow(e.target.value) : setBracketHigh(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Tab") { e.preventDefault(); (proposedBy === "defendant" ? bracketHighRef : otherPartyRef).current?.focus(); }
                  if (e.key === "Escape") onCancel();
                }}
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                {proposedBy === "defendant" ? "Bracket High" : "Defendant Offer"}
              </label>
              <input
                ref={proposedBy === "defendant" ? bracketHighRef : otherPartyRef}
                className="w-full px-2 py-1.5 rounded text-sm outline-none"
                style={inputStyle}
                placeholder="$0"
                value={proposedBy === "defendant" ? bracketHigh : otherPartyVal}
                onChange={(e) => proposedBy === "defendant" ? setBracketHigh(e.target.value) : setOtherPartyVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Tab") { e.preventDefault(); if (bothValid) handleSubmit(); }
                  if (e.key === "Enter" && bothValid) handleSubmit();
                  if (e.key === "Escape") onCancel();
                }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm" style={{ color: "var(--text-muted)" }}>
              {singleBracketValid && (
                <span>Bracket midpoint: <strong>${((bLow + bHigh) / 2).toLocaleString()}</strong> · </span>
              )}
              Round midpoint: <strong>{midpoint !== null ? `$${midpoint.toLocaleString()}` : "—"}</strong>
            </div>
            <div className="flex gap-1">
              <button className="text-xs px-3 py-1 rounded" style={{ color: "var(--accent)" }} onClick={handleSubmit} disabled={!bothValid}>✓ Add Bracket</button>
              <button className="text-xs px-2 py-1 rounded" style={{ color: "var(--text-muted)" }} onClick={onCancel}>✕</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
