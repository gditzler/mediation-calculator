import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { Round } from "../types";

interface ConvergenceChartProps {
  rounds: Round[];
}

export function ConvergenceChart({ rounds }: ConvergenceChartProps) {
  if (rounds.length === 0) return null;

  const committed = rounds.filter((r) => !r.is_speculative);
  const speculative = rounds.filter((r) => r.is_speculative);

  const mapRound = (r: Round, suffix = "") => ({
    name: `R${r.round_number}${suffix}`,
    demand: r.demand,
    offer: r.offer,
    midpoint: r.midpoint,
    bracketRange: r.round_type === "bracket" ? [r.bracket_low, r.bracket_high] as [number | null, number | null] : undefined,
    isBracket: r.round_type === "bracket",
  });

  const chartData = committed.map((r) => mapRound(r));
  const specData = speculative.map((r) => mapRound(r, "?"));
  const fullData = [...chartData, ...specData];

  const demandColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--demand")
    .trim() || "#dc2626";
  const offerColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--offer")
    .trim() || "#2563eb";
  const mutedColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--text-muted")
    .trim() || "#9ca3af";
  const bracketColor = "#a855f7";

  // For bracket rounds, compute bar base and height for stacked display
  const barData = fullData.map((d) => ({
    ...d,
    bracketBase: d.bracketRange ? d.bracketRange[0] : null,
    bracketHeight: d.bracketRange ? (d.bracketRange[1] ?? 0) - (d.bracketRange[0] ?? 0) : null,
  }));

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <div
        className="text-sm font-semibold mb-4"
        style={{ color: "var(--text-secondary)" }}
      >
        Negotiation Convergence
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <ComposedChart data={barData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
          <XAxis
            dataKey="name"
            tick={{ fill: mutedColor, fontSize: 12 }}
            axisLine={{ stroke: "var(--border)" }}
          />
          <YAxis
            tick={{ fill: mutedColor, fontSize: 12 }}
            axisLine={{ stroke: "var(--border)" }}
            tickFormatter={(val: number) =>
              val >= 1000 ? `$${(val / 1000).toFixed(0)}K` : `$${val}`
            }
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === "bracketBase") return [null, null];
              if (name === "bracketHeight") return [`$${value.toLocaleString()}`, "Bracket Range"];
              return [`$${value.toLocaleString()}`, ""];
            }}
            contentStyle={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--text-primary)",
            }}
          />
          <Legend />
          <Bar dataKey="bracketBase" stackId="bracket" fill="transparent" legendType="none" />
          <Bar dataKey="bracketHeight" stackId="bracket" name="Bracket" barSize={20}>
            {barData.map((entry, index) => (
              <Cell key={index} fill={entry.isBracket ? bracketColor : "transparent"} fillOpacity={0.4} stroke={entry.isBracket ? bracketColor : "none"} strokeWidth={2} />
            ))}
          </Bar>
          <Line
            type="monotone"
            dataKey="demand"
            stroke={demandColor}
            strokeWidth={2.5}
            dot={{ fill: demandColor, r: 4 }}
            connectNulls
            name="Demand"
          />
          <Line
            type="monotone"
            dataKey="offer"
            stroke={offerColor}
            strokeWidth={2.5}
            dot={{ fill: offerColor, r: 4 }}
            connectNulls
            name="Offer"
          />
          <Line
            type="monotone"
            dataKey="midpoint"
            stroke={mutedColor}
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={{ fill: mutedColor, r: 3 }}
            name="Midpoint"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
