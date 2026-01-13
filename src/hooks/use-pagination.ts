import { useState, useMemo, useEffect } from "react";

export interface UsePaginationOptions {
  initialPage?: number;
  initialPerPage?: number;
}

export function usePagination<T>(
  items: T[],
  deps: unknown[] = [],
  options: UsePaginationOptions = {},
) {
  const { initialPage = 1, initialPerPage = 12 } = options;
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = useState(initialPerPage);

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, items.length);
  const paginatedItems = useMemo(
    () => items.slice(startIndex, endIndex),
    [items, startIndex, endIndex],
  );

  useEffect(() => {
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const goToPage = (page: number) =>
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  const setPerPage = (perPage: number) => {
    setItemsPerPage(perPage);
    setCurrentPage(1);
  };

  return {
    currentPage,
    itemsPerPage,
    totalPages,
    startIndex,
    endIndex,
    paginatedItems,
    totalItems: items.length,
    goToPage,
    setPerPage,
  };
}
