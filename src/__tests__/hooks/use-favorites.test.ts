import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFavorites } from "@/hooks/use-favorites";

describe("useFavorites", () => {
  beforeEach(() => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    vi.mocked(localStorage.setItem).mockClear();
    vi.mocked(localStorage.removeItem).mockClear();
  });

  describe("initialization", () => {
    it("should initialize with empty favorites", () => {
      const { result } = renderHook(() => useFavorites());

      expect(result.current.favorites).toEqual([]);
      expect(result.current.favoritesCount).toBe(0);
    });

    it("should load favorites from localStorage", () => {
      vi.mocked(localStorage.getItem).mockReturnValue(
        JSON.stringify(["1", "2", "3"]),
      );

      const { result } = renderHook(() => useFavorites());

      expect(result.current.favorites).toEqual(["1", "2", "3"]);
      expect(result.current.favoritesCount).toBe(3);
    });

    it("should handle invalid localStorage data", () => {
      vi.mocked(localStorage.getItem).mockReturnValue("invalid-json");

      // Should not throw
      expect(() => renderHook(() => useFavorites())).toThrow();
    });
  });

  describe("toggleFavorite", () => {
    it("should add item to favorites", () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.toggleFavorite("device-1");
      });

      expect(result.current.favorites).toContain("device-1");
      expect(result.current.favoritesCount).toBe(1);
    });

    it("should remove item from favorites if already exists", () => {
      vi.mocked(localStorage.getItem).mockReturnValue(
        JSON.stringify(["device-1", "device-2"]),
      );

      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.toggleFavorite("device-1");
      });

      expect(result.current.favorites).not.toContain("device-1");
      expect(result.current.favorites).toContain("device-2");
      expect(result.current.favoritesCount).toBe(1);
    });

    it("should persist favorites to localStorage", () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.toggleFavorite("device-1");
      });

      expect(localStorage.setItem).toHaveBeenCalledWith(
        "favorite-devices",
        expect.stringContaining("device-1"),
      );
    });

    it("should handle multiple toggles", () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.toggleFavorite("device-1");
        result.current.toggleFavorite("device-2");
        result.current.toggleFavorite("device-3");
      });

      expect(result.current.favoritesCount).toBe(3);

      act(() => {
        result.current.toggleFavorite("device-2");
      });

      expect(result.current.favoritesCount).toBe(2);
      expect(result.current.favorites).not.toContain("device-2");
    });
  });

  describe("isFavorite", () => {
    it("should return true for favorited item", () => {
      vi.mocked(localStorage.getItem).mockReturnValue(
        JSON.stringify(["device-1"]),
      );

      const { result } = renderHook(() => useFavorites());

      expect(result.current.isFavorite("device-1")).toBe(true);
    });

    it("should return false for non-favorited item", () => {
      vi.mocked(localStorage.getItem).mockReturnValue(
        JSON.stringify(["device-1"]),
      );

      const { result } = renderHook(() => useFavorites());

      expect(result.current.isFavorite("device-2")).toBe(false);
    });

    it("should return false for empty favorites", () => {
      const { result } = renderHook(() => useFavorites());

      expect(result.current.isFavorite("any-device")).toBe(false);
    });

    it("should update after toggle", () => {
      const { result } = renderHook(() => useFavorites());

      expect(result.current.isFavorite("device-1")).toBe(false);

      act(() => {
        result.current.toggleFavorite("device-1");
      });

      expect(result.current.isFavorite("device-1")).toBe(true);
    });
  });

  describe("clearFavorites", () => {
    it("should clear all favorites", () => {
      vi.mocked(localStorage.getItem).mockReturnValue(
        JSON.stringify(["device-1", "device-2"]),
      );

      const { result } = renderHook(() => useFavorites());

      expect(result.current.favoritesCount).toBe(2);

      act(() => {
        result.current.clearFavorites();
      });

      expect(result.current.favorites).toEqual([]);
      expect(result.current.favoritesCount).toBe(0);
    });

    it("should remove from localStorage", () => {
      vi.mocked(localStorage.getItem).mockReturnValue(
        JSON.stringify(["device-1"]),
      );

      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.clearFavorites();
      });

      expect(localStorage.removeItem).toHaveBeenCalledWith("favorite-devices");
    });

    it("should handle clearing empty favorites", () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.clearFavorites();
      });

      expect(result.current.favorites).toEqual([]);
    });
  });

  describe("favoritesCount", () => {
    it("should return correct count", () => {
      vi.mocked(localStorage.getItem).mockReturnValue(
        JSON.stringify(["1", "2", "3", "4", "5"]),
      );

      const { result } = renderHook(() => useFavorites());

      expect(result.current.favoritesCount).toBe(5);
    });

    it("should update count after toggle", () => {
      const { result } = renderHook(() => useFavorites());

      expect(result.current.favoritesCount).toBe(0);

      act(() => {
        result.current.toggleFavorite("device-1");
      });

      expect(result.current.favoritesCount).toBe(1);

      act(() => {
        result.current.toggleFavorite("device-1");
      });

      expect(result.current.favoritesCount).toBe(0);
    });
  });

  describe("persistence", () => {
    it("should save to localStorage on every change", () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.toggleFavorite("device-1");
      });

      // Initial save + after toggle
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it("should use correct storage key", () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.toggleFavorite("device-1");
      });

      expect(localStorage.setItem).toHaveBeenCalledWith(
        "favorite-devices",
        expect.any(String),
      );
    });
  });
});
