import { ThemeProvider } from "./context/ThemeContext";
import { ThemeSelector } from "./components/ThemeSelector";

function App() {
  return (
    <ThemeProvider>
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
        <div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>
          App shell ready — components coming next.
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
