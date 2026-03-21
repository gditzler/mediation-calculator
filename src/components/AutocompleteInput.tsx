import { useState, useRef, useEffect } from "react";
import { autocompleteField } from "../api";

interface AutocompleteInputProps {
  field: string;
  value: string;
  onChange: (val: string) => void;
  label: string;
}

export function AutocompleteInput({
  field,
  value,
  onChange,
  label,
}: AutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleChange = (val: string) => {
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (val.length > 0) {
        try {
          const results = await autocompleteField(field, val);
          setSuggestions(results);
          setShowSuggestions(results.length > 0);
        } catch {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 200);
  };

  return (
    <div ref={ref} className="relative">
      <div
        className="text-xs font-semibold uppercase mb-1"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </div>
      <input
        className="w-full px-3 py-2 rounded-md text-sm outline-none"
        style={{
          background: "var(--bg-input)",
          border: "1px solid var(--border)",
          color: "var(--text-primary)",
        }}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) setShowSuggestions(true);
        }}
      />
      {showSuggestions && (
        <div
          className="absolute left-0 right-0 top-full mt-1 rounded-md shadow-lg z-50 max-h-40 overflow-y-auto"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          {suggestions.map((s) => (
            <button
              key={s}
              className="block w-full text-left px-3 py-2 text-sm hover:opacity-80"
              style={{ color: "var(--text-primary)" }}
              onClick={() => {
                onChange(s);
                setShowSuggestions(false);
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
