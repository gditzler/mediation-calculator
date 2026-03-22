import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import type { RefObject } from "react";

// Fixed export colors — theme-independent so PNGs look good on white backgrounds
const EXPORT_COLORS = {
  demand: "#dc2626",
  offer: "#2563eb",
  midpoint: "#6b7280",
  bracket: "#7c3aed",
  gridLine: "#d1d5db",
  axis: "#9ca3af",
  text: "#374151",
};

function buildColorMap(): Map<string, string> {
  const style = getComputedStyle(document.documentElement);
  const map = new Map<string, string>();

  // Map current theme's resolved CSS variable values to fixed export colors
  const varMappings: [string, string][] = [
    ["--demand", EXPORT_COLORS.demand],
    ["--offer", EXPORT_COLORS.offer],
    ["--text-muted", EXPORT_COLORS.midpoint],
    ["--border-light", EXPORT_COLORS.gridLine],
    ["--border", EXPORT_COLORS.axis],
    ["--text-secondary", EXPORT_COLORS.text],
  ];

  for (const [cssVar, fixedColor] of varMappings) {
    const resolved = style.getPropertyValue(cssVar).trim();
    if (resolved) {
      map.set(resolved, fixedColor);
    }
  }

  // Map the hardcoded bracket color used in ConvergenceChart
  map.set("#a855f7", EXPORT_COLORS.bracket);

  return map;
}

function fixSvgColors(svg: SVGElement): void {
  const colorMap = buildColorMap();

  const replaceColor = (value: string): string => {
    // Handle var() references (shouldn't appear but just in case)
    if (value.startsWith("var(")) {
      const prop = value.replace(/var\(([^)]+)\)/, "$1").trim();
      const resolved = getComputedStyle(document.documentElement)
        .getPropertyValue(prop)
        .trim();
      return colorMap.get(resolved) ?? resolved ?? value;
    }
    return colorMap.get(value) ?? value;
  };

  const allElements = svg.querySelectorAll("*");
  allElements.forEach((el) => {
    const htmlEl = el as SVGElement;
    if (htmlEl.style) {
      if (htmlEl.style.fill) htmlEl.style.fill = replaceColor(htmlEl.style.fill);
      if (htmlEl.style.stroke) htmlEl.style.stroke = replaceColor(htmlEl.style.stroke);
      if (htmlEl.style.color) htmlEl.style.color = replaceColor(htmlEl.style.color);
    }
    const fill = htmlEl.getAttribute("fill");
    if (fill) htmlEl.setAttribute("fill", replaceColor(fill));
    const stroke = htmlEl.getAttribute("stroke");
    if (stroke) htmlEl.setAttribute("stroke", replaceColor(stroke));
  });

  // Force all text to dark gray for readability
  svg.querySelectorAll("text, tspan").forEach((el) => {
    const htmlEl = el as SVGElement;
    htmlEl.setAttribute("fill", EXPORT_COLORS.text);
    htmlEl.style.fill = EXPORT_COLORS.text;
  });
}

export async function exportChartToPng(
  chartRef: RefObject<HTMLDivElement | null>,
  mediationName: string
): Promise<void> {
  const container = chartRef.current;
  if (!container) return;

  const svgOriginal = container.querySelector("svg");
  if (!svgOriginal) return;

  const svg = svgOriginal.cloneNode(true) as SVGElement;
  fixSvgColors(svg);

  // Remove any background
  svg.style.background = "transparent";
  svg.setAttribute("style", "background: transparent");

  const svgData = new XMLSerializer().serializeToString(svg);
  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  const canvas = document.createElement("canvas");

  await new Promise<void>((resolve, reject) => {
    img.onload = () => {
      const scale = 2; // 2x for retina
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      // Transparent background — no fillRect
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load SVG image"));
    };
    img.src = url;
  });

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png")
  );
  if (!blob) return;

  const arrayBuf = await blob.arrayBuffer();

  const defaultName = mediationName
    ? `${mediationName.replace(/[^a-zA-Z0-9 ]/g, "").trim()}-chart.png`
    : "convergence-chart.png";

  const filePath = await save({
    title: "Export Chart",
    defaultPath: defaultName,
    filters: [{ name: "PNG Image", extensions: ["png"] }],
  });

  if (filePath) {
    await writeFile(filePath, new Uint8Array(arrayBuf));
  }
}
