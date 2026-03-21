import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import type { Mediation } from "../types";

interface NotesEditorProps {
  mediation: Mediation;
  onUpdate: (field: keyof Mediation, value: string) => void;
}

export function NotesEditor({ mediation, onUpdate }: NotesEditorProps) {
  const [editing, setEditing] = useState(false);
  const [localNotes, setLocalNotes] = useState(mediation.notes);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setLocalNotes(mediation.notes);
  }, [mediation.notes]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleChange = (val: string) => {
    setLocalNotes(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onUpdate("notes", val);
    }, 2000);
  };

  const handleBlur = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    onUpdate("notes", localNotes);
    setEditing(false);
  };

  const toggleFormat = () => {
    const newFormat = mediation.notes_format === "markdown" ? "raw" : "markdown";
    onUpdate("notes_format", newFormat);
  };

  const isMarkdown = mediation.notes_format === "markdown";

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
          Notes
        </span>
        <div
          className="flex gap-0.5 rounded-md p-0.5"
          style={{ background: "var(--bg-input)" }}
        >
          <button
            className="px-2.5 py-1 rounded text-xs font-semibold"
            style={{
              background: isMarkdown ? "var(--bg-card)" : "transparent",
              color: isMarkdown ? "var(--text-secondary)" : "var(--text-muted)",
              boxShadow: isMarkdown ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
            }}
            onClick={() => {
              if (!isMarkdown) toggleFormat();
            }}
          >
            Markdown
          </button>
          <button
            className="px-2.5 py-1 rounded text-xs"
            style={{
              background: !isMarkdown ? "var(--bg-card)" : "transparent",
              color: !isMarkdown ? "var(--text-secondary)" : "var(--text-muted)",
              boxShadow: !isMarkdown ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
            }}
            onClick={() => {
              if (isMarkdown) toggleFormat();
            }}
          >
            Raw
          </button>
        </div>
      </div>

      {isMarkdown && !editing ? (
        <div
          className="px-3 py-3 rounded-md min-h-[120px] text-sm leading-relaxed cursor-text prose prose-sm max-w-none"
          style={{
            background: "var(--bg-input)",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
          }}
          onClick={() => {
            setEditing(true);
            setTimeout(() => textareaRef.current?.focus(), 0);
          }}
        >
          {localNotes ? (
            <ReactMarkdown>{localNotes}</ReactMarkdown>
          ) : (
            <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
              Click to add notes...
            </span>
          )}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          className="w-full px-3 py-3 rounded-md min-h-[120px] text-sm leading-relaxed outline-none resize-y"
          style={{
            background: "var(--bg-input)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
          }}
          value={localNotes}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder="Add notes..."
        />
      )}
    </div>
  );
}
