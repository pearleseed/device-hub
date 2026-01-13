import { useState, useMemo, useEffect, useCallback } from "react";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

/* eslint-disable react-refresh/only-export-components */

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

  const goToPage = useCallback((page: number) => {
    setCurrentPage((prev) => {
      const maxPage = Math.ceil(items.length / itemsPerPage);
      return Math.max(1, Math.min(page, maxPage));
    });
  }, [items.length, itemsPerPage]);

  const setPerPage = useCallback((perPage: number) => {
    setItemsPerPage(perPage);
    setCurrentPage(1);
  }, []);

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


// Types
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  perPageOptions?: number[];
  hasFilters?: boolean;
}

// Info component (top)
export const PaginationInfo: React.FC<PaginationProps> = ({
  startIndex,
  endIndex,
  totalItems,
  itemsPerPage,
  onPerPageChange,
  perPageOptions = [8, 12, 24, 48],
  hasFilters = false,
}) => {
  const { t } = useLanguage();
  return (
    <div className="flex items-center justify-between mb-4">
      <p className="text-sm text-muted-foreground">
        {t("pagination.showing")}{" "}
        <span className="font-medium text-foreground">
          {totalItems > 0 ? startIndex + 1 : 0}-{endIndex}
        </span>{" "}
        {t("pagination.of")}{" "}
        <span className="font-medium text-foreground">{totalItems}</span>{" "}
        {t("table.device")}
        {hasFilters && ` (${t("common.filtered")})`}
      </p>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {t("common.perPage")}:
        </span>
        <Select
          value={itemsPerPage.toString()}
          onValueChange={(v) => onPerPageChange(Number(v))}
        >
          <SelectTrigger className="w-[70px] h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {perPageOptions.map((n) => (
              <SelectItem key={n} value={n.toString()}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

// Navigation component (bottom)
export const PaginationNav: React.FC<
  Pick<PaginationProps, "currentPage" | "totalPages" | "onPageChange">
> = ({ currentPage, totalPages, onPageChange }) => {
  const { t } = useLanguage();
  if (totalPages <= 1) return null;

  const getPageNumbers = (): (number | "ellipsis")[] => {
    if (totalPages <= 5)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "ellipsis")[] = [1];
    if (currentPage > 3) pages.push("ellipsis");
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("ellipsis");
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-8 pb-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        {t("pagination.previous")}
      </Button>
      <div className="flex items-center gap-1">
        {getPageNumbers().map((page, idx) =>
          page === "ellipsis" ? (
            <span key={`e-${idx}`} className="px-2 text-muted-foreground">
              ...
            </span>
          ) : (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              className="w-8 h-8 p-0"
              onClick={() => onPageChange(page)}
            >
              {page}
            </Button>
          ),
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        {t("pagination.next")}
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
};
