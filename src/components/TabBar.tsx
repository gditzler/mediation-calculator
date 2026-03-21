import { useTabs } from "../context/TabContext";
import type { Tab } from "../types";

export function TabBar() {
  const { state, dispatch } = useTabs();

  function handleTabClick(tab: Tab) {
    dispatch({ type: "SET_ACTIVE", tabId: tab.id });
  }

  function handleClose(e: React.MouseEvent, tabId: string) {
    e.stopPropagation();
    dispatch({ type: "CLOSE_TAB", tabId });
  }

  return (
    <div
      style={{
        display: "flex",
        overflowX: "auto",
        background: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border)",
        scrollbarWidth: "none",
      }}
    >
      {state.tabs.map((tab) => {
        const isActive = tab.id === state.activeTabId;
        return (
          <div
            key={tab.id}
            onClick={() => handleTabClick(tab)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              borderBottom: isActive
                ? "2px solid var(--accent)"
                : "2px solid transparent",
              color: isActive ? "var(--accent)" : "var(--text-muted)",
              background: isActive ? "var(--bg-primary)" : "transparent",
              fontWeight: isActive ? 600 : 400,
              transition: "color 0.15s, background 0.15s",
              userSelect: "none",
            }}
          >
            <span>{tab.label}</span>
            {tab.type === "mediation" && (
              <button
                onClick={(e) => handleClose(e, tab.id)}
                title="Close tab"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0 2px",
                  color: isActive ? "var(--accent)" : "var(--text-muted)",
                  fontSize: "12px",
                  lineHeight: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
