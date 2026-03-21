import { useState } from "react";
import { AutocompleteInput } from "./AutocompleteInput";
import type { Mediation } from "../types";

interface MetadataPanelProps {
  mediation: Mediation;
  onUpdate: (field: keyof Mediation, value: string) => void;
}

export function MetadataPanel({ mediation, onUpdate }: MetadataPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  const fields: { key: keyof Mediation; label: string; field: string }[] = [
    { key: "plaintiff", label: "Plaintiff", field: "plaintiff" },
    { key: "defendant", label: "Defendant", field: "defendant" },
    { key: "defense_firm", label: "Defense Firm", field: "defense_firm" },
    { key: "counsel", label: "Counsel", field: "counsel" },
    { key: "mediator", label: "Mediator", field: "mediator" },
  ];

  return (
    <div
      className="rounded-xl"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
      }}
    >
      <div
        className="flex items-center justify-between px-5 py-3 cursor-pointer"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? (
          <div className="flex items-center gap-4">
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--text-secondary)" }}
            >
              Case Details
            </span>
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>
              {[mediation.plaintiff, mediation.defendant, mediation.mediator]
                .filter(Boolean)
                .join(" · ") || "No details yet"}
            </span>
          </div>
        ) : (
          <span
            className="text-sm font-semibold"
            style={{ color: "var(--text-secondary)" }}
          >
            Case Details
          </span>
        )}
        <span
          className="text-xs cursor-pointer"
          style={{ color: "var(--accent)" }}
        >
          {collapsed ? "▸ Expand" : "▾ Collapse"}
        </span>
      </div>

      {!collapsed && (
        <div className="grid grid-cols-3 gap-3 px-5 pb-4">
          {fields.map(({ key, label, field }) => (
            <AutocompleteInput
              key={key}
              field={field}
              label={label}
              value={mediation[key] as string}
              onChange={(val) => onUpdate(key, val)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
