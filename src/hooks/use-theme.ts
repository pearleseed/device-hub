import { useEffect, useState, useCallback, useMemo } from "react";

type Theme = "dark" | "light" | "system";

const getSystemTheme = (): "dark" | "light" =>
  typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() =>
    typeof window !== "undefined" ? (localStorage.getItem("theme") as Theme) || "light" : "light"
  );
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">(() =>
    theme === "system" ? getSystemTheme() : theme
  );

  useEffect(() => {
    const root = window.document.documentElement;
    const resolved = theme === "system" ? getSystemTheme() : theme;
    setResolvedTheme(resolved);

    root.classList.add("theme-transitioning");
    root.classList.remove("light", "dark");
    root.classList.add(resolved);
    localStorage.setItem("theme", theme);

    const timeout = setTimeout(() => root.classList.remove("theme-transitioning"), 350);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => theme === "system" && setResolvedTheme(getSystemTheme());
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      clearTimeout(timeout);
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => setThemeState(newTheme), []);

  return useMemo(() => ({ theme, setTheme, resolvedTheme }), [theme, setTheme, resolvedTheme]);
}
