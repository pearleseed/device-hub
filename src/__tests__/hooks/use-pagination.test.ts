import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePagination } from "@/hooks/use-pagination";

describe("usePagination", () => {
  describe("initialization", () => {
    it("should initialize with default values", () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100 }));

      expect(result.current.currentPage).toBe(1);
      expect(result.current.pageSize).toBe(10);
      expect(result.current.totalPages).toBe(10);
    });

    it("should initialize with custom initial page", () => {
      const { result } = renderHook(() =>
        usePagination({ totalItems: 100, initialPage: 5 }),
      );

      expect(result.current.currentPage).toBe(5);
    });

    it("should initialize with custom page size", () => {
      const { result } = renderHook(() =>
        usePagination({ totalItems: 100, initialPageSize: 20 }),
      );

      expect(result.current.pageSize).toBe(20);
      expect(result.current.totalPages).toBe(5);
    });

    it("should initialize with custom page size options", () => {
      const customOptions = [10, 25, 50, 100];
      const { result } = renderHook(() =>
        usePagination({ totalItems: 100, pageSizeOptions: customOptions }),
      );

      expect(result.current.pageSizeOptions).toEqual(customOptions);
    });
  });

  describe("page calculation", () => {
    it("should calculate total pages correctly", () => {
      const { result } = renderHook(() =>
        usePagination({ totalItems: 95, initialPageSize: 10 }),
      );

      expect(result.current.totalPages).toBe(10); // 95/10 = 9.5, ceil = 10
    });

    it("should return 1 total page for empty data", () => {
      const { result } = renderHook(() => usePagination({ totalItems: 0 }));

      expect(result.current.totalPages).toBe(1);
    });

    it("should calculate startIndex and endIndex correctly", () => {
      const { result } = renderHook(() =>
        usePagination({ totalItems: 100, initialPageSize: 10 }),
      );

      expect(result.current.startIndex).toBe(0);
      expect(result.current.endIndex).toBe(10);
    });

    it("should calculate startIndex and endIndex for page 2", () => {
      const { result } = renderHook(() =>
        usePagination({ totalItems: 100, initialPage: 2, initialPageSize: 10 }),
      );

      expect(result.current.startIndex).toBe(10);
      expect(result.current.endIndex).toBe(20);
    });

    it("should handle last page with fewer items", () => {
      const { result } = renderHook(() =>
        usePagination({ totalItems: 25, initialPage: 3, initialPageSize: 10 }),
      );

      expect(result.current.startIndex).toBe(20);
      expect(result.current.endIndex).toBe(25); // Not 30
    });
  });

  describe("navigation", () => {
    it("should go to next page", () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100 }));

      act(() => {
        result.current.nextPage();
      });

      expect(result.current.currentPage).toBe(2);
    });

    it("should not go past last page", () => {
      const { result } = renderHook(() =>
        usePagination({ totalItems: 20, initialPage: 2, initialPageSize: 10 }),
      );

      act(() => {
        result.current.nextPage();
      });

      expect(result.current.currentPage).toBe(2); // Should stay on last page
    });

    it("should go to previous page", () => {
      const { result } = renderHook(() =>
        usePagination({ totalItems: 100, initialPage: 3 }),
      );

      act(() => {
        result.current.previousPage();
      });

      expect(result.current.currentPage).toBe(2);
    });

    it("should not go before first page", () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100 }));

      act(() => {
        result.current.previousPage();
      });

      expect(result.current.currentPage).toBe(1);
    });

    it("should set specific page", () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100 }));

      act(() => {
        result.current.setPage(5);
      });

      expect(result.current.currentPage).toBe(5);
    });

    it("should clamp page to valid range", () => {
      const { result } = renderHook(() =>
        usePagination({ totalItems: 100, initialPageSize: 10 }),
      );

      act(() => {
        result.current.setPage(100);
      });

      expect(result.current.currentPage).toBe(10); // Max pages

      act(() => {
        result.current.setPage(0);
      });

      expect(result.current.currentPage).toBe(1); // Min page
    });
  });

  describe("page size", () => {
    it("should change page size", () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100 }));

      act(() => {
        result.current.setPageSize(20);
      });

      expect(result.current.pageSize).toBe(20);
      expect(result.current.totalPages).toBe(5);
    });

    it("should reset to page 1 when changing page size", () => {
      const { result } = renderHook(() =>
        usePagination({ totalItems: 100, initialPage: 5 }),
      );

      act(() => {
        result.current.setPageSize(20);
      });

      expect(result.current.currentPage).toBe(1);
    });
  });

  describe("navigation flags", () => {
    it("should indicate canGoNext correctly", () => {
      const { result } = renderHook(() =>
        usePagination({ totalItems: 100, initialPage: 1 }),
      );

      expect(result.current.canGoNext).toBe(true);
    });

    it("should indicate canGoNext false on last page", () => {
      const { result } = renderHook(() =>
        usePagination({
          totalItems: 100,
          initialPage: 10,
          initialPageSize: 10,
        }),
      );

      expect(result.current.canGoNext).toBe(false);
    });

    it("should indicate canGoPrevious correctly", () => {
      const { result } = renderHook(() =>
        usePagination({ totalItems: 100, initialPage: 5 }),
      );

      expect(result.current.canGoPrevious).toBe(true);
    });

    it("should indicate canGoPrevious false on first page", () => {
      const { result } = renderHook(() =>
        usePagination({ totalItems: 100, initialPage: 1 }),
      );

      expect(result.current.canGoPrevious).toBe(false);
    });
  });

  describe("paginateData", () => {
    it("should slice data correctly", () => {
      const { result } = renderHook(() =>
        usePagination({ totalItems: 10, initialPageSize: 3 }),
      );

      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const paginated = result.current.paginateData(data);

      expect(paginated).toEqual([1, 2, 3]);
    });

    it("should slice data for page 2", () => {
      const { result } = renderHook(() =>
        usePagination({ totalItems: 10, initialPage: 2, initialPageSize: 3 }),
      );

      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const paginated = result.current.paginateData(data);

      expect(paginated).toEqual([4, 5, 6]);
    });

    it("should handle last page with fewer items", () => {
      const { result } = renderHook(() =>
        usePagination({ totalItems: 10, initialPage: 4, initialPageSize: 3 }),
      );

      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const paginated = result.current.paginateData(data);

      expect(paginated).toEqual([10]);
    });

    it("should handle empty data", () => {
      const { result } = renderHook(() => usePagination({ totalItems: 0 }));

      const data: number[] = [];
      const paginated = result.current.paginateData(data);

      expect(paginated).toEqual([]);
    });
  });

  describe("pageNumbers", () => {
    it("should generate page numbers for small total", () => {
      const { result } = renderHook(() =>
        usePagination({ totalItems: 50, initialPageSize: 10 }),
      );

      expect(result.current.pageNumbers).toEqual([1, 2, 3, 4, 5]);
    });

    it("should generate page numbers with ellipsis for large total", () => {
      const { result } = renderHook(() =>
        usePagination({
          totalItems: 200,
          initialPage: 10,
          initialPageSize: 10,
        }),
      );

      // Should contain -1 for ellipsis
      expect(result.current.pageNumbers).toContain(-1);
      expect(result.current.pageNumbers[0]).toBe(1); // Always show first
      expect(
        result.current.pageNumbers[result.current.pageNumbers.length - 1],
      ).toBe(20); // Always show last
    });

    it("should include current page in page numbers", () => {
      const { result } = renderHook(() =>
        usePagination({
          totalItems: 200,
          initialPage: 10,
          initialPageSize: 10,
        }),
      );

      expect(result.current.pageNumbers).toContain(10);
    });
  });

  describe("edge cases", () => {
    it("should handle single item", () => {
      const { result } = renderHook(() => usePagination({ totalItems: 1 }));

      expect(result.current.totalPages).toBe(1);
      expect(result.current.canGoNext).toBe(false);
      expect(result.current.canGoPrevious).toBe(false);
    });

    it("should adjust current page when total changes", () => {
      const { result, rerender } = renderHook(
        ({ totalItems }) =>
          usePagination({ totalItems, initialPage: 10, initialPageSize: 10 }),
        { initialProps: { totalItems: 100 } },
      );

      expect(result.current.currentPage).toBe(10);

      // Reduce total items so page 10 is no longer valid
      rerender({ totalItems: 50 });

      expect(result.current.currentPage).toBe(5); // Should adjust to max valid page
    });
  });
});
