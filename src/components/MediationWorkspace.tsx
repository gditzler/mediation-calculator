import { useState, useEffect, useCallback, useRef } from "react";
import { getMediation, updateMediation, getRounds } from "../api";
import { useTabs } from "../context/TabContext";
import { MetadataPanel } from "./MetadataPanel";
import { StatusBadge } from "./StatusBadge";
import type { Mediation, Round } from "../types";

interface MediationWorkspaceProps {
  mediationId: string;
  tabId: string;
}

export function MediationWorkspace({ mediationId, tabId }: MediationWorkspaceProps) {
  const [mediation, setMediation] = useState<Mediation | null>(null);
  const [_rounds, setRounds] = useState<Round[]>([]);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const { dispatch } = useTabs();
  const autosaveTimer = useRef<ReturnType<typeof setTimeout>>();

  const load = useCallback(async () => {
    try {
      const [med, rds] = await Promise.all([
        getMediation(mediationId),
        getRounds(mediationId),
      ]);
      setMediation(med);
      setRounds(rds);
      const label =
        med.plaintiff && med.defendant
          ? `${med.plaintiff} v. ${med.defendant}`
          : "New Mediation";
      dispatch({ type: "UPDATE_LABEL", tabId, label });
    } catch (err) {
      console.error("Failed to load mediation:", err);
    }
  }, [mediationId, tabId, dispatch]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, []);

  const autosave = useCallback(
    (updated: Mediation) => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      autosaveTimer.current = setTimeout(async () => {
        try {
          const now = new Date().toISOString();
          const toSave = { ...updated, updated_at: now };
          await updateMediation(toSave);
          setMediation(toSave);
          const label =
            toSave.plaintiff && toSave.defendant
              ? `${toSave.plaintiff} v. ${toSave.defendant}`
              : "New Mediation";
          dispatch({ type: "UPDATE_LABEL", tabId, label });
        } catch (err) {
          console.error("Failed to save mediation:", err);
        }
      }, 1000);
    },
    [tabId, dispatch]
  );

  const handleFieldUpdate = (field: keyof Mediation, value: string) => {
    if (!mediation) return;
    const updated = { ...mediation, [field]: value };
    setMediation(updated);
    autosave(updated);
  };

  const handleStatusChange = (status: string) => {
    setStatusDropdownOpen(false);
    handleFieldUpdate("status", status);
  };

  if (!mediation) {
    return (
      <div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>
        Loading...
      </div>
    );
  }

  const title =
    mediation.plaintiff && mediation.defendant
      ? `${mediation.plaintiff} v. ${mediation.defendant}`
      : "New Mediation";

  return (
    <div className="p-5 flex flex-col gap-5">
      {/* Title row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold">{title}</h2>
          <StatusBadge
            status={mediation.status}
            onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
            showDropdown={statusDropdownOpen}
            onStatusChange={handleStatusChange}
          />
        </div>
        <div className="flex gap-2">
          <button
            className="px-4 py-1.5 rounded-md text-sm"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
            disabled
          >
            Export
          </button>
        </div>
      </div>

      {/* Metadata panel */}
      <MetadataPanel mediation={mediation} onUpdate={handleFieldUpdate} />

      {/* Placeholder for rounds, chart, variations, notes */}
      <div
        className="rounded-xl p-8 text-center text-sm"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          color: "var(--text-muted)",
        }}
      >
        Rounds table, chart, variations, and notes coming next.
      </div>
    </div>
  );
}
