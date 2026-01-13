import { useState, useEffect, useCallback, useMemo } from "react";

const STORAGE_KEY = "recently-viewed-devices";
const MAX_ITEMS = 6;

export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);

  const addToRecentlyViewed = useCallback((deviceId: string) => {
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((id) => id !== deviceId);
      return [deviceId, ...filtered].slice(0, MAX_ITEMS);
    });
  }, []);

  const clearRecentlyViewed = useCallback(() => {
    setRecentlyViewed([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return useMemo(() => ({
    recentlyViewed,
    addToRecentlyViewed,
    clearRecentlyViewed,
  }), [recentlyViewed, addToRecentlyViewed, clearRecentlyViewed]);
}
