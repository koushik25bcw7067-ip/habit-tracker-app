const safeFonts = {
  system: "Inter",
  modern: "Inter",
  elegant: "Playfair Display",
  fantasy: "Cinzel",
  anime: "Rajdhani",
  playful: "Nunito",
};

const loadedFonts = new Set();

function loadFonts(fontName) {
  if (typeof document === "undefined") return;

  const requestedFont = String(fontName || "Inter").trim();

  const font = Object.values(safeFonts).includes(requestedFont)
    ? requestedFont
    : "Inter";

  const fontId = `theme-font-${font.replace(/\s+/g, "-").toLowerCase()}`;

  if (loadedFonts.has(fontId) || document.getElementById(fontId)) {
    loadedFonts.add(fontId);
    return;
  }

  const link = document.createElement("link");
  link.id = fontId;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    font
  ).replace(/%20/g, "+")}:wght@400;500;600;700&display=swap`;

  link.onerror = () => {
    console.warn(`Could not load ${font}. Using the default font.`);
  };

  document.head.appendChild(link);
  loadedFonts.add(fontId);
}

export { safeFonts, loadFonts };
