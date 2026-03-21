import { useState, useEffect } from "react";
import { getVariations } from "../api";
import type { Variation, Round } from "../types";

interface VariationsTableProps {
  latestRound: Round | null;
}

export function VariationsTable({ latestRound }: VariationsTableProps) {
  const [variations, setVariations] = useState<Variation[]>([]);

  useEffect(() => {
    if (!latestRound) {
      setVariations([]);
      return;
    }
    const demand =
      latestRound.round_type === "standard"
        ? latestRound.demand
        : latestRound.bracket_high;
    if (demand == null) return;

    getVariations(latestRound.midpoint, demand, 8).then(setVariations).catch(console.error);
  }, [latestRound]);

  const formatCurrency = (val: number) => `$${val.toLocaleString()}`;

  if (!latestRound || variations.length === 0) {
    return (
      <div
        className="rounded-xl p-5"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <div className="text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
          Variations
        </div>
        <div className="text-sm" style={{ color: "var(--text-muted)" }}>
          Add rounds to see variations.
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <div className="text-sm font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
        Variations from Round {latestRound.round_number}
      </div>
      <div className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
        If midpoint stays at {formatCurrency(latestRound.midpoint)}...
      </div>

      <div
        className="grid px-2 py-1.5 text-xs font-semibold uppercase"
        style={{
          gridTemplateColumns: "1fr 1fr",
          color: "var(--text-muted)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div>Demand</div>
        <div className="text-right">Offer Needed</div>
      </div>

      {variations.map((v, i) => (
        <div
          key={i}
          className="grid px-2 py-2 text-sm"
          style={{
            gridTemplateColumns: "1fr 1fr",
            borderBottom: "1px solid var(--border-light)",
          }}
        >
          <div style={{ color: "var(--demand)" }}>{formatCurrency(v.demand)}</div>
          <div className="text-right" style={{ color: "var(--offer)" }}>
            {formatCurrency(v.offer_needed)}
          </div>
        </div>
      ))}
    </div>
  );
}
