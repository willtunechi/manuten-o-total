import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ThemeColors {
  background: string;
  primary: string;
  secondary: string;
  accent: string;
  sidebar: string;
}

export type ThemeMode = "light" | "dark";

interface ThemeContextType {
  mode: ThemeMode;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
  setColors: (colors: Partial<ThemeColors>) => void;
  saveTheme: () => Promise<void>;
  loading: boolean;
  isAdmin: boolean;
}

const DEFAULT_COLORS: ThemeColors = {
  background: "220 40% 8%",
  primary: "165 80% 45%",
  secondary: "220 30% 14%",
  accent: "220 25% 18%",
  sidebar: "220 45% 6%",
};

const DARK_BASE = {
  background: "0 0% 7%",
  foreground: "0 0% 95%",
  card: "0 0% 10%",
  cardForeground: "0 0% 95%",
  popover: "0 0% 10%",
  popoverForeground: "0 0% 95%",
  primaryForeground: "0 0% 100%",
  secondaryForeground: "0 0% 95%",
  muted: "0 0% 15%",
  mutedForeground: "0 0% 60%",
  accentForeground: "0 0% 95%",
  destructive: "0 62% 50%",
  destructiveForeground: "0 0% 100%",
  border: "0 0% 18%",
  input: "0 0% 18%",
  ring: "0 0% 80%",
  sidebarForeground: "0 0% 90%",
  sidebarPrimaryForeground: "0 0% 100%",
  sidebarAccent: "0 0% 15%",
  sidebarAccentForeground: "0 0% 95%",
  sidebarBorder: "0 0% 20%",
  sidebarRing: "0 0% 80%",
};

const LIGHT_BASE = {
  background: "0 0% 100%",
  foreground: "0 0% 5%",
  card: "0 0% 100%",
  cardForeground: "0 0% 5%",
  popover: "0 0% 100%",
  popoverForeground: "0 0% 5%",
  primaryForeground: "0 0% 100%",
  secondaryForeground: "0 0% 10%",
  muted: "0 0% 95%",
  mutedForeground: "0 0% 40%",
  accentForeground: "0 0% 5%",
  destructive: "0 72% 50%",
  destructiveForeground: "0 0% 100%",
  border: "0 0% 88%",
  input: "0 0% 88%",
  ring: "0 0% 10%",
  sidebarForeground: "0 0% 10%",
  sidebarPrimaryForeground: "0 0% 100%",
  sidebarAccent: "0 0% 93%",
  sidebarAccentForeground: "0 0% 5%",
  sidebarBorder: "0 0% 86%",
  sidebarRing: "0 0% 10%",
};

const ThemeContext = createContext<ThemeContextType | null>(null);

function parseLightness(hsl: string): number {
  const parts = hsl.trim().split(/\s+/);
  return parseFloat(parts[2]) || 50;
}

function applyThemeToDOM(mode: ThemeMode, colors: ThemeColors) {
  const root = document.documentElement;
  const base = mode === "dark" ? DARK_BASE : LIGHT_BASE;

  // Determine if background/sidebar are dark to auto-set foreground
  const bgLightness = parseLightness(colors.background);
  const bgIsDark = bgLightness < 45;
  const sidebarLightness = parseLightness(colors.sidebar);
  const sidebarIsDark = sidebarLightness < 45;

  root.style.setProperty("--background", colors.background);
  root.style.setProperty("--foreground", bgIsDark ? "0 0% 95%" : "0 0% 5%");
  root.style.setProperty("--card", bgIsDark ? `${colors.background.split(' ')[0]} ${colors.background.split(' ')[1]} ${Math.min(parseLightness(colors.background) + 3, 100)}%` : colors.background);
  root.style.setProperty("--card-foreground", bgIsDark ? "0 0% 95%" : "0 0% 5%");
  root.style.setProperty("--popover", bgIsDark ? `${colors.background.split(' ')[0]} ${colors.background.split(' ')[1]} ${Math.min(parseLightness(colors.background) + 3, 100)}%` : colors.background);
  root.style.setProperty("--popover-foreground", bgIsDark ? "0 0% 95%" : "0 0% 5%");
  root.style.setProperty("--primary", colors.primary);
  root.style.setProperty("--primary-foreground", base.primaryForeground);
  root.style.setProperty("--secondary", colors.secondary);
  root.style.setProperty("--secondary-foreground", bgIsDark ? "0 0% 95%" : "0 0% 10%");
  root.style.setProperty("--muted", bgIsDark ? `${colors.background.split(' ')[0]} ${colors.background.split(' ')[1]} ${Math.min(parseLightness(colors.background) + 8, 100)}%` : base.muted);
  root.style.setProperty("--muted-foreground", bgIsDark ? "0 0% 60%" : "0 0% 40%");
  root.style.setProperty("--accent", colors.accent);
  root.style.setProperty("--accent-foreground", bgIsDark ? "0 0% 95%" : "0 0% 5%");
  root.style.setProperty("--destructive", base.destructive);
  root.style.setProperty("--destructive-foreground", base.destructiveForeground);
  root.style.setProperty("--border", bgIsDark ? "0 0% 18%" : "0 0% 88%");
  root.style.setProperty("--input", bgIsDark ? "0 0% 18%" : "0 0% 88%");
  root.style.setProperty("--ring", bgIsDark ? "0 0% 80%" : "0 0% 10%");

  // Sidebar - adapt foreground based on sidebar background lightness
  root.style.setProperty("--sidebar-background", colors.sidebar);
  root.style.setProperty("--sidebar-foreground", sidebarIsDark ? "0 0% 90%" : "0 0% 10%");
  root.style.setProperty("--sidebar-primary", colors.primary);
  root.style.setProperty("--sidebar-primary-foreground", sidebarIsDark ? "0 0% 100%" : "0 0% 100%");
  root.style.setProperty("--sidebar-accent", sidebarIsDark ? "0 0% 18%" : "0 0% 93%");
  root.style.setProperty("--sidebar-accent-foreground", sidebarIsDark ? "0 0% 95%" : "0 0% 5%");
  root.style.setProperty("--sidebar-border", sidebarIsDark ? "0 0% 22%" : "0 0% 86%");
  root.style.setProperty("--sidebar-ring", sidebarIsDark ? "0 0% 80%" : "0 0% 10%");

  if (mode === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function ThemeProvider({ children, isAdmin = false }: { children: React.ReactNode; isAdmin?: boolean }) {
  const [mode, setModeState] = useState<ThemeMode>("light");
  const [colors, setColorsState] = useState<ThemeColors>(DEFAULT_COLORS);
  const [loading, setLoading] = useState(true);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  // Load theme from DB
  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("theme_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        const m = (data.theme_mode === "dark" ? "dark" : "light") as ThemeMode;
        const c: ThemeColors = {
          background: data.background_color || DEFAULT_COLORS.background,
          primary: data.primary_color || DEFAULT_COLORS.primary,
          secondary: data.secondary_color || DEFAULT_COLORS.secondary,
          accent: data.accent_color || DEFAULT_COLORS.accent,
          sidebar: data.sidebar_color || DEFAULT_COLORS.sidebar,
        };
        setModeState(m);
        setColorsState(c);
        setSettingsId(data.id);
        applyThemeToDOM(m, c);
      }
      setLoading(false);
    }
    load();
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    setColorsState((prev) => {
      applyThemeToDOM(m, prev);
      return prev;
    });
  }, []);

  const setColors = useCallback((partial: Partial<ThemeColors>) => {
    setColorsState((prev) => {
      const next = { ...prev, ...partial };
      setModeState((m) => {
        applyThemeToDOM(m, next);
        return m;
      });
      return next;
    });
  }, []);

  const saveTheme = useCallback(async () => {
    if (!settingsId) return;
    const { error } = await supabase
      .from("theme_settings")
      .update({
        theme_mode: mode,
        background_color: colors.background,
        primary_color: colors.primary,
        secondary_color: colors.secondary,
        accent_color: colors.accent,
        sidebar_color: colors.sidebar,
        updated_at: new Date().toISOString(),
      })
      .eq("id", settingsId);

    if (error) {
      console.error("Error saving theme:", error);
      throw error;
    }
  }, [settingsId, mode, colors]);

  return (
    <ThemeContext.Provider value={{ mode, colors, setMode, setColors, saveTheme, loading, isAdmin }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
