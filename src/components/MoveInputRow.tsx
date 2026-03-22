import { useState, useRef } from "react";

interface MoveInputRowProps {
  expectedMove: "demand" | "offer" | null;
  allowBracket: boolean;
  onSubmit: (data: {
    move_type: "demand" | "offer";
    amount: number;
    is_bracket: boolean;
    bracket_low?: number;
    bracket_high?: number;
  }) => void;
  onCancel: () => void;
}

export function MoveInputRow({ expectedMove, allowBracket, onSubmit, onCancel }: MoveInputRowProps) {
  const [moveType, setMoveType] = useState<"demand" | "offer">(expectedMove ?? "demand");
  const [isBracket, setIsBracket] = useState(false);
  const [amount, setAmount] = useState("");
  const [bracketLow, setBracketLow] = useState("");
  const [bracketHigh, setBracketHigh] = useState("");
  const amountRef = useRef<HTMLInputElement>(null);
  const bracketLowRef = useRef<HTMLInputElement>(null);
  const bracketHighRef = useRef<HTMLInputElement>(null);

  const amt = parseFloat(amount);
  const bLow = parseFloat(bracketLow);
  const bHigh = parseFloat(bracketHigh);

  const isValid = isBracket
    ? !isNaN(bLow) && !isNaN(bHigh) && bLow > 0 && bHigh > 0 && bHigh > bLow
    : !isNaN(amt) && amt > 0;

  const effectiveAmount = isBracket && !isNaN(bLow) && !isNaN(bHigh)
    ? (bLow + bHigh) / 2
    : amt;

  const handleSubmit = () => {
    if (!isValid) return;
    if (isBracket) {
      onSubmit({
        move_type: moveType,
        amount: (bLow + bHigh) / 2,
        is_bracket: true,
        bracket_low: bLow,
        bracket_high: bHigh,
      });
    } else {
      onSubmit({
        move_type: moveType,
        amount: amt,
        is_bracket: false,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isValid) handleSubmit();
    if (e.key === "Escape") onCancel();
  };

  const inputStyle = {
    background: "var(--bg-input)",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
  };

  const moveColor = moveType === "demand" ? "var(--demand)" : "var(--offer)";
  const moveLabel = moveType === "demand" ? "Demand" : "Offer";

  // Suppress unused variable warning for amountRef — kept for potential future use
  void amountRef;

  return (
    <div
      className="px-3 py-2 rounded-lg mt-2"
      style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-3 mb-2">
        <select
          className="px-2 py-1 rounded text-xs outline-none"
          style={inputStyle}
          value={moveType}
          onChange={(e) => setMoveType(e.target.value as "demand" | "offer")}
        >
          <option value="demand">Demand</option>
          <option value="offer">Offer</option>
        </select>
        {allowBracket && (
          <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: "var(--text-muted)" }}>
            <input
              type="checkbox"
              checked={isBracket}
              onChange={(e) => setIsBracket(e.target.checked)}
              className="rounded"
            />
            Bracket
          </label>
        )}
      </div>

      {isBracket ? (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                Bracket Low
              </label>
              <input
                ref={bracketLowRef}
                className="w-full px-2 py-1.5 rounded text-sm outline-none"
                style={inputStyle}
                placeholder="$0"
                value={bracketLow}
                onChange={(e) => setBracketLow(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Tab") { e.preventDefault(); bracketHighRef.current?.focus(); }
                  handleKeyDown(e);
                }}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                Bracket High
              </label>
              <input
                ref={bracketHighRef}
                className="w-full px-2 py-1.5 rounded text-sm outline-none"
                style={inputStyle}
                placeholder="$0"
                value={bracketHigh}
                onChange={(e) => setBracketHigh(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Tab") { e.preventDefault(); if (isValid) handleSubmit(); }
                  handleKeyDown(e);
                }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>
              {moveLabel} midpoint: <strong style={{ color: moveColor }}>
                {isValid ? `$${effectiveAmount.toLocaleString()}` : "—"}
              </strong>
            </span>
            <div className="flex gap-1">
              <button className="text-xs px-3 py-1 rounded" style={{ color: "var(--accent)" }} onClick={handleSubmit} disabled={!isValid}>✓</button>
              <button className="text-xs px-2 py-1 rounded" style={{ color: "var(--text-muted)" }} onClick={onCancel}>✕</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex gap-3 items-center">
          <input
            ref={amountRef}
            className="flex-1 px-2 py-1.5 rounded text-sm outline-none"
            style={inputStyle}
            placeholder={`${moveLabel} amount`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Tab") { e.preventDefault(); if (isValid) handleSubmit(); }
              handleKeyDown(e);
            }}
            autoFocus
          />
          <span className="text-sm font-semibold" style={{ color: moveColor }}>
            {isValid ? `$${amt.toLocaleString()}` : ""}
          </span>
          <div className="flex gap-1">
            <button className="text-xs px-2 py-1 rounded" style={{ color: "var(--accent)" }} onClick={handleSubmit} disabled={!isValid}>✓</button>
            <button className="text-xs px-2 py-1 rounded" style={{ color: "var(--text-muted)" }} onClick={onCancel}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
