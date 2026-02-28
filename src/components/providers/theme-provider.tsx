import type { Theme } from "@/lib/theme-context";

import { useEffect, useState } from "react";

import { ThemeProviderContext } from "@/lib/theme-context";

const STORAGE_KEY = "tcad-theme";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
};

export function ThemeProvider({
  children,
  defaultTheme = "system",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(STORAGE_KEY) as Theme) || defaultTheme,
  );

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      localStorage.setItem(STORAGE_KEY, newTheme);
      setTheme(newTheme);
    },
  };

  return (
    <ThemeProviderContext value={value}>
      {children}
    </ThemeProviderContext>
  );
}
