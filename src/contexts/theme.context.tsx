import { createContext, useContext, useEffect, useState } from "react";
import { STORAGE_KEYS } from "@/config/";

type Theme = "dark";

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  transparency: number;
  onSetTransparency: (transparency: number) => void;
  isSystemThemeDark: boolean;
};

const initialState: ThemeProviderState = {
  theme: "dark",
  setTheme: () => null,
  transparency: 10,
  onSetTransparency: () => null,
  isSystemThemeDark: true,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({ children, ...props }: any) {
  const [transparency, setTransparency] = useState<number>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.TRANSPARENCY);
    return stored ? parseInt(stored, 10) : 10;
  });

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.TRANSPARENCY && e.newValue) {
        setTransparency(parseInt(e.newValue, 10));
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Hardcode Dark Theme App-wide
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "system");
    root.classList.add("dark");
  }, []);

  // Apply transparency globally
  useEffect(() => {
    const root = window.document.documentElement;
    const opacity = (100 - transparency) / 100;

    // Apply opacity to CSS variables
    root.style.setProperty("--opacity", opacity.toString());

    // Apply backdrop filter when transparency is active
    if (transparency > 0) {
      root.style.setProperty("--backdrop-blur", "blur(12px)");
    } else {
      root.style.setProperty("--backdrop-blur", "none");
    }
  }, [transparency]);

  const onSetTransparency = (transparency: number) => {
    localStorage.setItem(STORAGE_KEYS.TRANSPARENCY, transparency.toString());
    setTransparency(transparency);
  };

  const value = {
    theme: "dark" as Theme,
    setTheme: () => {},
    isSystemThemeDark: true,
    transparency,
    onSetTransparency,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};