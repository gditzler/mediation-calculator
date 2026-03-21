import { useState, useRef, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { themeNames } from "../themes/themes";

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currentLabel =
    themeNames.find((t) => t.value === theme)?.label ?? "Light";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-1.5 text-xs rounded-md"
        style={{
          background: "var(--bg-input)",
          color: "var(--text-secondary)",
          border: "1px solid var(--border)",
        }}
      >
        Theme: {currentLabel} ▾
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 rounded-md shadow-lg z-50 py-1 min-w-[160px]"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          {themeNames.map((t) => (
            <button
              key={t.value}
              onClick={() => {
                setTheme(t.value);
                setOpen(false);
              }}
              className="block w-full text-left px-3 py-2 text-sm hover:opacity-80"
              style={{
                color:
                  theme === t.value
                    ? "var(--accent)"
                    : "var(--text-secondary)",
                fontWeight: theme === t.value ? 600 : 400,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
