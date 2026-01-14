import { useEffect, useState, useCallback, useMemo, useSyncExternalStore } from "react";

type Theme = "dark" | "light" | "system";

const getSystemTheme = (): "dark" | "light" =>
  typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

// External store for system theme preference
const subscribeToSystemTheme = (callback: () => void) => {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
};

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() =>
    typeof window !== "undefined" ? (localStorage.getItem("theme") as Theme) || "light" : "light"
  );

  // Use useSyncExternalStore to track system theme changes
  const systemTheme = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemTheme,
    () => "light" as const
  );

  // Compute resolved theme synchronously (not in effect)
  const resolvedTheme = theme === "system" ? systemTheme : theme;

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.add("theme-transitioning");
    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);
    localStorage.setItem("theme", theme);

    const timeout = setTimeout(() => root.classList.remove("theme-transitioning"), 350);

    return () => {
      clearTimeout(timeout);
    };
  }, [theme, resolvedTheme]);

  const setTheme = useCallback((newTheme: Theme) => setThemeState(newTheme), []);

  return useMemo(() => ({ theme, setTheme, resolvedTheme }), [theme, setTheme, resolvedTheme]);
}
