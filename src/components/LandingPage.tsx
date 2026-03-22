import { useState, useEffect } from "react";
import { listMediations, createMediation, deleteMediation } from "../api";
import { useTabs } from "../context/TabContext";
import { StatusBadge } from "./StatusBadge";
import type { MediationSummary } from "../types";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function LandingPage() {
  const [mediations, setMediations] = useState<MediationSummary[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { dispatch } = useTabs();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 200);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    const filterValue = statusFilter === "all" ? "" : statusFilter;
    listMediations(debouncedSearch, filterValue).then((results) => {
      if (!cancelled) setMediations(results);
    }).catch((err) => {
      if (!cancelled) console.error("Failed to load mediations:", err);
    });
    return () => { cancelled = true; };
  }, [debouncedSearch, statusFilter]);

  const handleNew = async () => {
    try {
      const med = await createMediation();
      dispatch({
        type: "OPEN_MEDIATION",
        mediationId: med.id,
        label: "New Mediation",
      });
    } catch (err) {
      console.error("Failed to create mediation:", err);
    }
  };

  const handleDelete = async (e: React.MouseEvent, med: MediationSummary) => {
    e.stopPropagation();
    const label = med.plaintiff && med.defendant
      ? `${med.plaintiff} v. ${med.defendant}`
      : "this mediation";
    if (!confirm(`Delete ${label}? This cannot be undone.`)) return;
    try {
      await deleteMediation(med.id);
      dispatch({ type: "CLOSE_TAB", tabId: med.id });
      setMediations((prev) => prev.filter((m) => m.id !== med.id));
    } catch (err) {
      console.error("Failed to delete mediation:", err);
    }
  };

  const handleOpen = (med: MediationSummary) => {
    const label =
      med.plaintiff && med.defendant
        ? `${med.plaintiff} v. ${med.defendant}`
        : "Untitled Mediation";
    dispatch({
      type: "OPEN_MEDIATION",
      mediationId: med.id,
      label,
    });
  };

  return (
    <div className="p-6">
      {/* Search + filter bar */}
      <div className="flex gap-3 items-center mb-6">
        <input
          className="flex-1 px-4 py-2.5 rounded-lg text-sm outline-none"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
          }}
          placeholder="Search by plaintiff, defendant, mediator..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="px-4 py-2.5 rounded-lg text-sm outline-none"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
          }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Status: All</option>
          <option value="in_progress">In Progress</option>
          <option value="settled">Settled</option>
          <option value="impasse">Impasse</option>
          <option value="adjourned">Adjourned</option>
          <option value="mediators_proposal">Mediator's Proposal</option>
        </select>
        <button
          className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
          style={{ background: "var(--accent)" }}
          onClick={handleNew}
        >
          + New Mediation
        </button>
      </div>

      {/* Table header */}
      <div
        className="grid px-4 py-2 text-xs font-semibold uppercase tracking-wide"
        style={{
          gridTemplateColumns: "2fr 2fr 1.5fr 1fr 1fr 0.5fr",
          color: "var(--text-muted)",
        }}
      >
        <div>Plaintiff</div>
        <div>Defendant</div>
        <div>Mediator</div>
        <div>Status</div>
        <div>Last Updated</div>
        <div></div>
      </div>

      {/* Rows */}
      {mediations.map((med) => (
        <div
          key={med.id}
          className="grid px-4 py-3.5 rounded-lg mb-1.5 text-sm cursor-pointer"
          style={{
            gridTemplateColumns: "2fr 2fr 1.5fr 1fr 1fr 0.5fr",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
          onClick={() => handleOpen(med)}
        >
          <div className="font-medium">{med.plaintiff || "—"}</div>
          <div>{med.defendant || "—"}</div>
          <div>{med.mediator || "—"}</div>
          <div>
            <StatusBadge status={med.status} />
          </div>
          <div style={{ color: "var(--text-muted)" }}>
            {formatDate(med.updated_at)}
          </div>
          <div className="flex justify-end">
            <button
              className="text-xs px-2 py-1 rounded opacity-40 hover:opacity-100"
              style={{ color: "var(--demand)" }}
              title="Delete mediation"
              onClick={(e) => handleDelete(e, med)}
            >
              ✕
            </button>
          </div>
        </div>
      ))}

      {mediations.length === 0 && (
        <div
          className="text-center py-12 text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          No mediations found. Click "+ New Mediation" to get started.
        </div>
      )}
    </div>
  );
}
