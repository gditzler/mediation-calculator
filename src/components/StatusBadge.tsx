const statusConfig: Record<string, { label: string; bgVar: string; textVar: string }> = {
  in_progress: { label: "In Progress", bgVar: "--status-in-progress-bg", textVar: "--status-in-progress-text" },
  settled: { label: "Settled", bgVar: "--status-settled-bg", textVar: "--status-settled-text" },
  impasse: { label: "Impasse", bgVar: "--status-impasse-bg", textVar: "--status-impasse-text" },
  adjourned: { label: "Adjourned", bgVar: "--status-adjourned-bg", textVar: "--status-adjourned-text" },
  mediators_proposal: { label: "Mediator's Proposal", bgVar: "--status-mediators-proposal-bg", textVar: "--status-mediators-proposal-text" },
};

interface StatusBadgeProps {
  status: string;
  onClick?: () => void;
  showDropdown?: boolean;
  onStatusChange?: (status: string) => void;
}

export function StatusBadge({ status, onClick, showDropdown, onStatusChange }: StatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.in_progress;

  return (
    <div className="relative inline-block">
      <span
        className="px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer"
        style={{
          background: `var(${config.bgVar})`,
          color: `var(${config.textVar})`,
        }}
        onClick={onClick}
      >
        {config.label} {onClick ? "▾" : ""}
      </span>
      {showDropdown && onStatusChange && (
        <div
          className="absolute left-0 top-full mt-1 rounded-md shadow-lg z-50 py-1 min-w-[140px]"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          {Object.entries(statusConfig).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => onStatusChange(key)}
              className="block w-full text-left px-3 py-1.5 text-sm hover:opacity-80"
              style={{ color: `var(${cfg.textVar})` }}
            >
              {cfg.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
