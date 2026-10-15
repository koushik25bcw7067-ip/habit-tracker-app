const THEME_STORAGE_KEY = "immersive-world-theme";

export function saveTheme(themeId) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, themeId);
  } catch (error) {
    console.error("Could not save theme:", error);
  }
}

export function getSavedTheme() {
  if (typeof window === "undefined") return "default";

  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) || "default";
  } catch (error) {
    console.error("Could not load theme:", error);
    return "default";
  }
}

export function clearSavedTheme() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(THEME_STORAGE_KEY);
  } catch (error) {
    console.error("Could not clear theme:", error);
  }
}