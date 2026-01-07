import { useState, useMemo } from 'react';

interface UsePaginationOptions {
  totalItems: number;
  initialPage?: number;
  initialPageSize?: number;
  pageSizeOptions?: number[];
}

interface UsePaginationReturn<T> {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  pageSizeOptions: number[];
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  paginateData: (data: T[]) => T[];
  pageNumbers: number[];
}

export function usePagination<T = unknown>({
  totalItems,
  initialPage = 1,
  initialPageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
}: UsePaginationOptions): UsePaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  
  // Ensure current page is valid when total changes
  const validCurrentPage = Math.min(currentPage, totalPages);
  if (validCurrentPage !== currentPage) {
    setCurrentPage(validCurrentPage);
  }

  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const setPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  };

  const setPageSize = (size: number) => {
    setPageSizeState(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const nextPage = () => {
    if (validCurrentPage < totalPages) {
      setCurrentPage(validCurrentPage + 1);
    }
  };

  const previousPage = () => {
    if (validCurrentPage > 1) {
      setCurrentPage(validCurrentPage - 1);
    }
  };

  const canGoNext = validCurrentPage < totalPages;
  const canGoPrevious = validCurrentPage > 1;

  const paginateData = (data: T[]): T[] => {
    return data.slice(startIndex, endIndex);
  };

  // Generate page numbers for pagination UI
  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Calculate range around current page
      let start = Math.max(2, validCurrentPage - 1);
      let end = Math.min(totalPages - 1, validCurrentPage + 1);
      
      // Add ellipsis indicator (-1) if needed
      if (start > 2) {
        pages.push(-1); // Ellipsis
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < totalPages - 1) {
        pages.push(-1); // Ellipsis
      }
      
      // Always show last page
      pages.push(totalPages);
    }
    
    return pages;
  }, [totalPages, validCurrentPage]);

  return {
    currentPage: validCurrentPage,
    pageSize,
    totalPages,
    startIndex,
    endIndex,
    pageSizeOptions,
    setPage,
    setPageSize,
    nextPage,
    previousPage,
    canGoNext,
    canGoPrevious,
    paginateData,
    pageNumbers,
  };
}
