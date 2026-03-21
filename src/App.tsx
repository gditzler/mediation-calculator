import { ThemeProvider } from "./context/ThemeContext";
import { TabProvider, useTabs } from "./context/TabContext";
import { ThemeSelector } from "./components/ThemeSelector";
import { TabBar } from "./components/TabBar";
import { LandingPage } from "./components/LandingPage";

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
      <div>
        {activeTab?.type === "home" && <LandingPage />}
        {activeTab?.type === "mediation" && (
          <div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>
            Mediation view for ID: {activeTab.mediationId}
          </div>
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
