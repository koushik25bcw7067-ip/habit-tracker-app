import { createContext, useContext, useEffect, useState } from "react";
import themePresets from "./themePresets";
import { getSavedTheme, saveTheme } from "./themeStorage";
import { loadFonts } from "./fonts";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => {
    const saved = getSavedTheme();
    return themePresets[saved] ? saved : "default";
  });

  const theme = themePresets[themeId] || themePresets.default;

  useEffect(() => {
    const root = document.documentElement;
    const colors = theme.colors;

    root.style.setProperty("--color-primary", colors.primary);
    root.style.setProperty("--color-secondary", colors.secondary);
    root.style.setProperty("--color-background", colors.background);
    root.style.setProperty("--color-surface", colors.surface);
    root.style.setProperty("--color-text", colors.text);
    root.style.setProperty("--color-accent", colors.accent);

    loadFonts(theme.font);

    root.dataset.theme = theme.id;
    root.style.setProperty(
      "--theme-font",
      theme.font === "system" ? "system-ui, sans-serif" : `"${theme.font}", sans-serif`
    );
  }, [theme]);

  function selectTheme(id) {
    if (!themePresets[id]) return;

    setThemeId(id);
    saveTheme(id);
  }

  return (
    <ThemeContext.Provider value={{ theme, themeId, selectTheme, themePresets }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}