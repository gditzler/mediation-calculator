import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import * as XLSX from "xlsx";
import type { Round } from "../types";

export async function exportRoundsToXlsx(
  rounds: Round[],
  mediationName: string
): Promise<void> {
  const committed = rounds.filter((r) => !r.is_speculative);
  if (committed.length === 0) return;

  const rows = committed.map((r) => {
    const demand = r.demand ?? null;
    const offer = r.offer ?? null;
    const bracketHigh = r.bracket_high ?? null;
    const bracketLow = r.bracket_low ?? null;
    const midpoint = demand != null && offer != null ? r.midpoint : null;

    let gap: number | null = null;
    if (r.round_type === "bracket" && bracketHigh != null && bracketLow != null) {
      gap = bracketHigh - bracketLow;
    } else if (demand != null && offer != null) {
      gap = demand - offer;
    }

    let ratio: string | null = null;
    if (demand != null && offer != null && offer !== 0) {
      ratio = `1:${parseFloat((demand / offer).toFixed(2))}`;
    }

    return {
      Round: r.round_number,
      Type: r.round_type === "bracket" ? "Bracket" : "Standard",
      Demand: demand,
      Offer: offer,
      "Bracket High": bracketHigh,
      "Bracket Low": bracketLow,
      Midpoint: midpoint,
      Gap: gap,
      Ratio: ratio,
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Rounds");

  const xlsxData = XLSX.write(wb, { type: "array", bookType: "xlsx" });

  const defaultName = mediationName
    ? `${mediationName.replace(/[^a-zA-Z0-9 ]/g, "").trim()}.xlsx`
    : "rounds.xlsx";

  const filePath = await save({
    title: "Export Rounds",
    defaultPath: defaultName,
    filters: [{ name: "Excel", extensions: ["xlsx"] }],
  });

  if (filePath) {
    await writeFile(filePath, new Uint8Array(xlsxData));
  }
}
