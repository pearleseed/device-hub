import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "favorite-devices";

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = useCallback((deviceId: string) => {
    setFavorites((prev) => {
      if (prev.includes(deviceId)) {
        return prev.filter((id) => id !== deviceId);
      }
      return [...prev, deviceId];
    });
  }, []);

  const isFavorite = useCallback(
    (deviceId: string) => {
      return favorites.includes(deviceId);
    },
    [favorites],
  );

  const clearFavorites = useCallback(() => {
    setFavorites([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    favorites,
    toggleFavorite,
    isFavorite,
    clearFavorites,
    favoritesCount: favorites.length,
  };
}
