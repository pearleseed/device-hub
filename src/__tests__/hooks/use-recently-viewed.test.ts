import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";

describe("useRecentlyViewed", () => {
  beforeEach(() => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    vi.mocked(localStorage.setItem).mockClear();
    vi.mocked(localStorage.removeItem).mockClear();
  });

  describe("initialization", () => {
    it("should initialize with empty array", () => {
      const { result } = renderHook(() => useRecentlyViewed());

      expect(result.current.recentlyViewed).toEqual([]);
    });

    it("should load from localStorage", () => {
      vi.mocked(localStorage.getItem).mockReturnValue(
        JSON.stringify(["1", "2", "3"]),
      );

      const { result } = renderHook(() => useRecentlyViewed());

      expect(result.current.recentlyViewed).toEqual(["1", "2", "3"]);
    });
  });

  describe("addToRecentlyViewed", () => {
    it("should add item to front of list", () => {
      const { result } = renderHook(() => useRecentlyViewed());

      act(() => {
        result.current.addToRecentlyViewed("device-1");
      });

      expect(result.current.recentlyViewed[0]).toBe("device-1");
    });

    it("should add new items to front", () => {
      const { result } = renderHook(() => useRecentlyViewed());

      act(() => {
        result.current.addToRecentlyViewed("device-1");
        result.current.addToRecentlyViewed("device-2");
      });

      expect(result.current.recentlyViewed[0]).toBe("device-2");
      expect(result.current.recentlyViewed[1]).toBe("device-1");
    });

    it("should move existing item to front (remove duplicates)", () => {
      vi.mocked(localStorage.getItem).mockReturnValue(
        JSON.stringify(["1", "2", "3"]),
      );

      const { result } = renderHook(() => useRecentlyViewed());

      act(() => {
        result.current.addToRecentlyViewed("3");
      });

      expect(result.current.recentlyViewed[0]).toBe("3");
      expect(
        result.current.recentlyViewed.filter((id) => id === "3").length,
      ).toBe(1);
    });

    it("should respect MAX_ITEMS limit (6)", () => {
      const { result } = renderHook(() => useRecentlyViewed());

      act(() => {
        result.current.addToRecentlyViewed("1");
        result.current.addToRecentlyViewed("2");
        result.current.addToRecentlyViewed("3");
        result.current.addToRecentlyViewed("4");
        result.current.addToRecentlyViewed("5");
        result.current.addToRecentlyViewed("6");
        result.current.addToRecentlyViewed("7");
      });

      expect(result.current.recentlyViewed.length).toBe(6);
      expect(result.current.recentlyViewed[0]).toBe("7"); // Most recent
      expect(result.current.recentlyViewed).not.toContain("1"); // First one removed
    });

    it("should persist to localStorage", () => {
      const { result } = renderHook(() => useRecentlyViewed());

      act(() => {
        result.current.addToRecentlyViewed("device-1");
      });

      expect(localStorage.setItem).toHaveBeenCalledWith(
        "recently-viewed-devices",
        expect.stringContaining("device-1"),
      );
    });
  });

  describe("clearRecentlyViewed", () => {
    it("should clear all items", () => {
      vi.mocked(localStorage.getItem).mockReturnValue(
        JSON.stringify(["1", "2", "3"]),
      );

      const { result } = renderHook(() => useRecentlyViewed());

      expect(result.current.recentlyViewed.length).toBe(3);

      act(() => {
        result.current.clearRecentlyViewed();
      });

      expect(result.current.recentlyViewed).toEqual([]);
    });

    it("should remove from localStorage", () => {
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(["1"]));

      const { result } = renderHook(() => useRecentlyViewed());

      act(() => {
        result.current.clearRecentlyViewed();
      });

      expect(localStorage.removeItem).toHaveBeenCalledWith(
        "recently-viewed-devices",
      );
    });

    it("should handle clearing empty list", () => {
      const { result } = renderHook(() => useRecentlyViewed());

      act(() => {
        result.current.clearRecentlyViewed();
      });

      expect(result.current.recentlyViewed).toEqual([]);
    });
  });

  describe("order preservation", () => {
    it("should maintain viewing order (most recent first)", () => {
      const { result } = renderHook(() => useRecentlyViewed());

      act(() => {
        result.current.addToRecentlyViewed("a");
        result.current.addToRecentlyViewed("b");
        result.current.addToRecentlyViewed("c");
      });

      expect(result.current.recentlyViewed).toEqual(["c", "b", "a"]);
    });

    it("should update order when re-viewing", () => {
      vi.mocked(localStorage.getItem).mockReturnValue(
        JSON.stringify(["c", "b", "a"]),
      );

      const { result } = renderHook(() => useRecentlyViewed());

      act(() => {
        result.current.addToRecentlyViewed("a"); // Re-view oldest
      });

      expect(result.current.recentlyViewed).toEqual(["a", "c", "b"]);
    });
  });

  describe("persistence", () => {
    it("should save on every add", () => {
      const { result } = renderHook(() => useRecentlyViewed());

      act(() => {
        result.current.addToRecentlyViewed("device-1");
      });

      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it("should use correct storage key", () => {
      const { result } = renderHook(() => useRecentlyViewed());

      act(() => {
        result.current.addToRecentlyViewed("device-1");
      });

      expect(localStorage.setItem).toHaveBeenCalledWith(
        "recently-viewed-devices",
        expect.any(String),
      );
    });
  });
});
