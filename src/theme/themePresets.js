const themePresets = {
  default: {
    id: "default",
    name: "Classic",
    description: "Clean and simple",
    colors: {
      primary: "#6366F1",
      secondary: "#8B5CF6",
      background: "#F8FAFC",
      surface: "#FFFFFF",
      text: "#1E293B",
      accent: "#F59E0B",
    },
    font: "system",
    companion: {
      name: "Milo",
      greeting: "Hey! Ready to make today productive?",
    },
  },

  mahishmati: {
    id: "mahishmati",
    name: "Mahishmati",
    description: "A royal kingdom-inspired world",
    colors: {
      primary: "#C58B2A",
      secondary: "#8B4513",
      background: "#1C1712",
      surface: "#30251B",
      text: "#FFF1D0",
      accent: "#E8B44F",
    },
    font: "elegant",
    companion: {
      name: "Royal Guide",
      greeting: "Your kingdom awaits. Which task shall we conquer today?",
    },
  },

  blackClover: {
    id: "blackClover",
    name: "Grimoire World",
    description: "A magical, anime-inspired world",
    colors: {
      primary: "#38A169",
      secondary: "#276749",
      background: "#101A16",
      surface: "#1C2A23",
      text: "#E6FFF0",
      accent: "#9AE6B4",
    },
    font: "anime",
    companion: {
      name: "Grimoire Guide",
      greeting: "Your next quest awaits. Let's build your magic through habits!",
    },
  },
};

export default themePresets;