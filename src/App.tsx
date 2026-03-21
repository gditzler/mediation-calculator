import { ThemeProvider } from "./context/ThemeContext";
import { TabProvider, useTabs } from "./context/TabContext";
import { ThemeSelector } from "./components/ThemeSelector";
import { TabBar } from "./components/TabBar";

function AppContent() {
  const { state } = useTabs();
  const activeTab = state.tabs.find((t) => t.id === state.activeTabId);

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
    >
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{
          background: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <span className="font-bold text-lg">Gladice</span>
        <ThemeSelector />
      </div>
      <TabBar />
      <div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>
        {activeTab?.type === "home" && (
          <span>Home — select or open a mediation to get started.</span>
        )}
        {activeTab?.type === "mediation" && (
          <span>Mediation view for ID: {activeTab.mediationId}</span>
        )}
        {!activeTab && (
          <span>App shell ready — components coming next.</span>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <TabProvider>
        <AppContent />
      </TabProvider>
    </ThemeProvider>
  );
}

export default App;
