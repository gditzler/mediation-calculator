import { createContext, useContext, useEffect, useState } from "react";
import type { ThemeName } from "../types";
import { applyTheme } from "../themes/themes";
import { getSetting, setSetting } from "../api";

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>("light");

  useEffect(() => {
    getSetting("theme")
      .then((val) => {
        if (val) {
          const t = val as ThemeName;
          setThemeState(t);
          applyTheme(t);
        } else {
          applyTheme("light");
        }
      })
      .catch(() => applyTheme("light"));
  }, []);

  const setTheme = (t: ThemeName) => {
    setThemeState(t);
    applyTheme(t);
    setSetting("theme", t).catch(console.error);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
