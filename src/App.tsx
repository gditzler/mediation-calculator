import { ThemeProvider } from "./context/ThemeContext";
import { TabProvider, useTabs } from "./context/TabContext";
import { ThemeSelector } from "./components/ThemeSelector";
import { TabBar } from "./components/TabBar";
import { LandingPage } from "./components/LandingPage";
import { MediationWorkspace } from "./components/MediationWorkspace";

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
        {activeTab?.type === "mediation" && activeTab.mediationId && (
          <MediationWorkspace
            key={activeTab.mediationId}
            mediationId={activeTab.mediationId}
            tabId={activeTab.id}
          />
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
