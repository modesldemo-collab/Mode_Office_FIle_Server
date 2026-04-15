import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeCtx = createContext(null);

export const useTheme = () => useContext(ThemeCtx);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("mde_theme");
    if (saved === "light" || saved === "dark") return saved;
    return "dark";
  });

  useEffect(() => {
    localStorage.setItem("mde_theme", theme);
    document.documentElement.classList.remove("theme-dark", "theme-light");
    document.documentElement.classList.add(theme === "light" ? "theme-light" : "theme-dark");
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    }),
    [theme]
  );

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}
