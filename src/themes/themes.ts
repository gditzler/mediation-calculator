import type { ThemeName } from "../types";

interface ThemeTokens {
  "--bg-primary": string;
  "--bg-secondary": string;
  "--bg-card": string;
  "--bg-input": string;
  "--border": string;
  "--border-light": string;
  "--text-primary": string;
  "--text-secondary": string;
  "--text-muted": string;
  "--accent": string;
  "--accent-hover": string;
  "--demand": string;
  "--offer": string;
  "--status-in-progress-bg": string;
  "--status-in-progress-text": string;
  "--status-settled-bg": string;
  "--status-settled-text": string;
  "--status-impasse-bg": string;
  "--status-impasse-text": string;
  "--status-adjourned-bg": string;
  "--status-adjourned-text": string;
  "--speculative-bg": string;
  "--speculative-border": string;
  "--speculative-text": string;
}

export const themes: Record<ThemeName, ThemeTokens> = {
  light: {
    "--bg-primary": "#f9fafb",
    "--bg-secondary": "#ffffff",
    "--bg-card": "#ffffff",
    "--bg-input": "#f9fafb",
    "--border": "#e5e7eb",
    "--border-light": "#f3f4f6",
    "--text-primary": "#111827",
    "--text-secondary": "#374151",
    "--text-muted": "#9ca3af",
    "--accent": "#2563eb",
    "--accent-hover": "#1d4ed8",
    "--demand": "#dc2626",
    "--offer": "#2563eb",
    "--status-in-progress-bg": "#dbeafe",
    "--status-in-progress-text": "#1d4ed8",
    "--status-settled-bg": "#dcfce7",
    "--status-settled-text": "#166534",
    "--status-impasse-bg": "#fee2e2",
    "--status-impasse-text": "#991b1b",
    "--status-adjourned-bg": "#fef3c7",
    "--status-adjourned-text": "#92400e",
    "--speculative-bg": "#fffbeb",
    "--speculative-border": "#f59e0b",
    "--speculative-text": "#92400e",
  },
  dark: {
    "--bg-primary": "#111827",
    "--bg-secondary": "#1f2937",
    "--bg-card": "#1f2937",
    "--bg-input": "#374151",
    "--border": "#374151",
    "--border-light": "#4b5563",
    "--text-primary": "#f9fafb",
    "--text-secondary": "#d1d5db",
    "--text-muted": "#6b7280",
    "--accent": "#3b82f6",
    "--accent-hover": "#2563eb",
    "--demand": "#ef4444",
    "--offer": "#3b82f6",
    "--status-in-progress-bg": "#1e3a5f",
    "--status-in-progress-text": "#93c5fd",
    "--status-settled-bg": "#14532d",
    "--status-settled-text": "#86efac",
    "--status-impasse-bg": "#7f1d1d",
    "--status-impasse-text": "#fca5a5",
    "--status-adjourned-bg": "#78350f",
    "--status-adjourned-text": "#fcd34d",
    "--speculative-bg": "#422006",
    "--speculative-border": "#d97706",
    "--speculative-text": "#fcd34d",
  },
  "solarized-light": {
    "--bg-primary": "#fdf6e3",
    "--bg-secondary": "#eee8d5",
    "--bg-card": "#eee8d5",
    "--bg-input": "#fdf6e3",
    "--border": "#93a1a1",
    "--border-light": "#eee8d5",
    "--text-primary": "#073642",
    "--text-secondary": "#586e75",
    "--text-muted": "#93a1a1",
    "--accent": "#268bd2",
    "--accent-hover": "#2176b8",
    "--demand": "#dc322f",
    "--offer": "#268bd2",
    "--status-in-progress-bg": "#d5e8f0",
    "--status-in-progress-text": "#268bd2",
    "--status-settled-bg": "#d5e8ce",
    "--status-settled-text": "#859900",
    "--status-impasse-bg": "#f0d5d5",
    "--status-impasse-text": "#dc322f",
    "--status-adjourned-bg": "#f0e8d5",
    "--status-adjourned-text": "#b58900",
    "--speculative-bg": "#f5efc9",
    "--speculative-border": "#b58900",
    "--speculative-text": "#b58900",
  },
  "solarized-dark": {
    "--bg-primary": "#002b36",
    "--bg-secondary": "#073642",
    "--bg-card": "#073642",
    "--bg-input": "#002b36",
    "--border": "#586e75",
    "--border-light": "#073642",
    "--text-primary": "#fdf6e3",
    "--text-secondary": "#93a1a1",
    "--text-muted": "#586e75",
    "--accent": "#268bd2",
    "--accent-hover": "#2aa0f0",
    "--demand": "#dc322f",
    "--offer": "#268bd2",
    "--status-in-progress-bg": "#0a4a5c",
    "--status-in-progress-text": "#268bd2",
    "--status-settled-bg": "#2a4a00",
    "--status-settled-text": "#859900",
    "--status-impasse-bg": "#5c1a1a",
    "--status-impasse-text": "#dc322f",
    "--status-adjourned-bg": "#5c4a00",
    "--status-adjourned-text": "#b58900",
    "--speculative-bg": "#3b3000",
    "--speculative-border": "#b58900",
    "--speculative-text": "#b58900",
  },
  "nord-light": {
    "--bg-primary": "#eceff4",
    "--bg-secondary": "#e5e9f0",
    "--bg-card": "#e5e9f0",
    "--bg-input": "#eceff4",
    "--border": "#d8dee9",
    "--border-light": "#e5e9f0",
    "--text-primary": "#2e3440",
    "--text-secondary": "#3b4252",
    "--text-muted": "#7b88a1",
    "--accent": "#5e81ac",
    "--accent-hover": "#4c6e96",
    "--demand": "#bf616a",
    "--offer": "#5e81ac",
    "--status-in-progress-bg": "#d8e2f0",
    "--status-in-progress-text": "#5e81ac",
    "--status-settled-bg": "#d8e8d5",
    "--status-settled-text": "#a3be8c",
    "--status-impasse-bg": "#f0d8da",
    "--status-impasse-text": "#bf616a",
    "--status-adjourned-bg": "#f0e8d5",
    "--status-adjourned-text": "#d08770",
    "--speculative-bg": "#f5efd9",
    "--speculative-border": "#ebcb8b",
    "--speculative-text": "#d08770",
  },
  "nord-dark": {
    "--bg-primary": "#2e3440",
    "--bg-secondary": "#3b4252",
    "--bg-card": "#3b4252",
    "--bg-input": "#434c5e",
    "--border": "#4c566a",
    "--border-light": "#434c5e",
    "--text-primary": "#eceff4",
    "--text-secondary": "#d8dee9",
    "--text-muted": "#7b88a1",
    "--accent": "#88c0d0",
    "--accent-hover": "#8fbcbb",
    "--demand": "#bf616a",
    "--offer": "#88c0d0",
    "--status-in-progress-bg": "#2e4459",
    "--status-in-progress-text": "#88c0d0",
    "--status-settled-bg": "#2e4430",
    "--status-settled-text": "#a3be8c",
    "--status-impasse-bg": "#592e30",
    "--status-impasse-text": "#bf616a",
    "--status-adjourned-bg": "#593e2e",
    "--status-adjourned-text": "#d08770",
    "--speculative-bg": "#3d3526",
    "--speculative-border": "#ebcb8b",
    "--speculative-text": "#ebcb8b",
  },
};

export const themeNames: { value: ThemeName; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "solarized-light", label: "Solarized Light" },
  { value: "solarized-dark", label: "Solarized Dark" },
  { value: "nord-light", label: "Nord Light" },
  { value: "nord-dark", label: "Nord Dark" },
];

export function applyTheme(name: ThemeName) {
  const tokens = themes[name];
  const root = document.documentElement;
  for (const [key, value] of Object.entries(tokens)) {
    root.style.setProperty(key, value);
  }
}
