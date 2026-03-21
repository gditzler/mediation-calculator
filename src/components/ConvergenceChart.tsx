import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { Round } from "../types";

interface ConvergenceChartProps {
  rounds: Round[];
}

export function ConvergenceChart({ rounds }: ConvergenceChartProps) {
  if (rounds.length === 0) return null;

  const committed = rounds.filter((r) => !r.is_speculative);
  const speculative = rounds.filter((r) => r.is_speculative);

  const chartData = committed.map((r) => ({
    name: `R${r.round_number}`,
    demand: r.round_type === "standard" ? r.demand : r.bracket_high,
    offer: r.round_type === "standard" ? r.offer : r.bracket_low,
    midpoint: r.midpoint,
  }));

  const specData = speculative.map((r) => ({
    name: `R${r.round_number}?`,
    demand: r.round_type === "standard" ? r.demand : r.bracket_high,
    offer: r.round_type === "standard" ? r.offer : r.bracket_low,
    midpoint: r.midpoint,
  }));

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
        <LineChart data={fullData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
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
            formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
            contentStyle={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--text-primary)",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="demand"
            stroke={demandColor}
            strokeWidth={2.5}
            dot={{ fill: demandColor, r: 4 }}
            name="Demand"
          />
          <Line
            type="monotone"
            dataKey="offer"
            stroke={offerColor}
            strokeWidth={2.5}
            dot={{ fill: offerColor, r: 4 }}
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
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
