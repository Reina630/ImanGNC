import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// ─── Hex → "H S% L%" (CSS variable format, no wrapper) ───────────────────────
function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Slightly darken a hex colour (for sidebar-accent etc.)
function darken(hex: string, amount = 0.15): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - Math.round(255 * amount));
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - Math.round(255 * amount));
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - Math.round(255 * amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function injectThemeCssVars(primaryHex: string, sidebarHex: string) {
  const root = document.documentElement;
  const primary      = hexToHsl(primaryHex);
  const primaryHover = hexToHsl(darken(primaryHex, 0.1));
  const sidebar      = hexToHsl(sidebarHex);
  const sidebarAccent= hexToHsl(darken(sidebarHex, 0.06));
  const sidebarBorder= hexToHsl(darken(sidebarHex, 0.04));

  root.style.setProperty("--primary",                    primary);
  root.style.setProperty("--secondary",                  primary);
  root.style.setProperty("--ring",                       primary);
  root.style.setProperty("--chart-1",                    primary);
  root.style.setProperty("--chart-2",                    primaryHover);
  root.style.setProperty("--sidebar-background",         sidebar);
  root.style.setProperty("--sidebar-accent",             sidebarAccent);
  root.style.setProperty("--sidebar-border",             sidebarBorder);
  root.style.setProperty("--sidebar-primary",            primary);
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: {
    sidebarBg: string;
    sidebarText: string;
    sidebarActiveText: string;
    sidebarActiveBg: string;
    sidebarBorder: string;
    primary: string;
    primaryHover: string;
    accent: string;
  };
  hex: {
    primary: string;
    primaryHover: string;
    sidebarBg: string;
  };
}

export const THEMES: Theme[] = [
  {
    id: "burgundy",
    name: "Bordeaux Classique",
    description: "Le thème par défaut avec des tons bordeaux élégants",
    colors: {
      sidebarBg: "bg-[#5C1A1B]",
      sidebarText: "text-red-100/80",
      sidebarActiveText: "text-white",
      sidebarActiveBg: "bg-[#800020]/30",
      sidebarBorder: "border-[#800020]",
      primary: "bg-[#800020]",
      primaryHover: "hover:bg-[#600018]",
      accent: "text-[#800020]",
    },
    hex: {
      primary: "#800020",
      primaryHover: "#600018",
      sidebarBg: "#5C1A1B",
    },
  },
  {
    id: "ocean",
    name: "Océan Profond",
    description: "Des tons bleus apaisants inspirés de l'océan",
    colors: {
      sidebarBg: "bg-[#0F4C75]",
      sidebarText: "text-blue-100/80",
      sidebarActiveText: "text-white",
      sidebarActiveBg: "bg-blue-500/30",
      sidebarBorder: "border-blue-600",
      primary: "bg-[#1B9AAA]",
      primaryHover: "hover:bg-[#157A8A]",
      accent: "text-[#1B9AAA]",
    },
    hex: {
      primary: "#1B9AAA",
      primaryHover: "#157A8A",
      sidebarBg: "#0F4C75",
    },
  },
  {
    id: "forest",
    name: "Forêt Émeraude",
    description: "Des verts naturels et reposants",
    colors: {
      sidebarBg: "bg-[#1B4332]",
      sidebarText: "text-green-100/80",
      sidebarActiveText: "text-white",
      sidebarActiveBg: "bg-green-600/30",
      sidebarBorder: "border-green-700",
      primary: "bg-[#2D6A4F]",
      primaryHover: "hover:bg-[#1F4A37]",
      accent: "text-[#2D6A4F]",
    },
    hex: {
      primary: "#2D6A4F",
      primaryHover: "#1F4A37",
      sidebarBg: "#1B4332",
    },
  },
  {
    id: "midnight",
    name: "Minuit Élégant",
    description: "Un thème sombre et sophistiqué",
    colors: {
      sidebarBg: "bg-[#1E1E2E]",
      sidebarText: "text-slate-300/80",
      sidebarActiveText: "text-white",
      sidebarActiveBg: "bg-purple-600/30",
      sidebarBorder: "border-purple-500",
      primary: "bg-[#7C3AED]",
      primaryHover: "hover:bg-[#6D28D9]",
      accent: "text-[#7C3AED]",
    },
    hex: {
      primary: "#7C3AED",
      primaryHover: "#6D28D9",
      sidebarBg: "#1E1E2E",
    },
  },
  {
    id: "niger",
    name: "Drapeau du Niger",
    description: "Orange, blanc et vert — les couleurs nationales",
    colors: {
      sidebarBg: "bg-[#006B3F]",
      sidebarText: "text-green-100/80",
      sidebarActiveText: "text-white",
      sidebarActiveBg: "bg-[#E05206]/30",
      sidebarBorder: "border-[#E05206]",
      primary: "bg-[#E05206]",
      primaryHover: "hover:bg-[#B84005]",
      accent: "text-[#E05206]",
    },
    hex: {
      primary: "#E05206",
      primaryHover: "#B84005",
      sidebarBg: "#006B3F",
    },
  },
  {
    id: "slate",
    name: "Ardoise Moderne",
    description: "Un thème gris moderne et professionnel",
    colors: {
      sidebarBg: "bg-slate-800",
      sidebarText: "text-slate-300/80",
      sidebarActiveText: "text-white",
      sidebarActiveBg: "bg-slate-600/30",
      sidebarBorder: "border-slate-500",
      primary: "bg-slate-700",
      primaryHover: "hover:bg-slate-600",
      accent: "text-slate-700",
    },
    hex: {
      primary: "#334155",
      primaryHover: "#475569",
      sidebarBg: "#1E293B",
    },
  },
  {
    id: "rose",
    name: "Rose Élégant",
    description: "Des tons roses doux et élégants",
    colors: {
      sidebarBg: "bg-[#831843]",
      sidebarText: "text-pink-100/80",
      sidebarActiveText: "text-white",
      sidebarActiveBg: "bg-pink-600/30",
      sidebarBorder: "border-pink-600",
      primary: "bg-[#BE185D]",
      primaryHover: "hover:bg-[#9F1239]",
      accent: "text-[#BE185D]",
    },
    hex: {
      primary: "#BE185D",
      primaryHover: "#9F1239",
      sidebarBg: "#831843",
    },
  },
];

interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (themeId: string) => void;
  themes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    const savedThemeId = localStorage.getItem("app-theme");
    return THEMES.find((t) => t.id === savedThemeId) || THEMES[0];
  });

  // Inject CSS variables whenever theme changes
  useEffect(() => {
    injectThemeCssVars(currentTheme.hex.primary, currentTheme.hex.sidebarBg);
  }, [currentTheme]);

  const setTheme = (themeId: string) => {
    const theme = THEMES.find((t) => t.id === themeId);
    if (theme) {
      setCurrentTheme(theme);
      localStorage.setItem("app-theme", themeId);
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
