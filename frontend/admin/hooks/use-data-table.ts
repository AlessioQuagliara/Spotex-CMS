"use client";

import { useState, useCallback, useEffect } from "react";
import { SortingState, ColumnFiltersState } from "@tanstack/react-table";

interface UseDataTableProps {
  initialPageSize?: number;
  onFetch: (params: {
    page: number;
    perPage: number;
    sortBy?: string;
    sortOrder?: string;
    filters?: Record<string, any>;
  }) => Promise<{
    items: any[];
    total: number;
    page: number;
    pages: number;
  }>;
}

export function useDataTable({ initialPageSize = 20, onFetch }: UseDataTableProps) {
  const [data, setData] = useState<any[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [pageCount, setPageCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Build sort params
      const sortBy = sorting[0]?.id;
      const sortOrder = sorting[0]?.desc ? "desc" : "asc";

      // Build filter params
      const filters: Record<string, any> = {};
      columnFilters.forEach((filter) => {
        filters[filter.id] = filter.value;
      });

      const result = await onFetch({
        page: pageIndex + 1,
        perPage: pageSize,
        sortBy,
        sortOrder,
        filters,
      });

      setData(result.items);
      setTotal(result.total);
      setPageCount(result.pages);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, pageSize, sorting, columnFilters, onFetch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePaginationChange = useCallback(
    (pagination: { pageIndex: number; pageSize: number }) => {
      setPageIndex(pagination.pageIndex);
      setPageSize(pagination.pageSize);
    },
    []
  );

  const handleSortingChange = useCallback((newSorting: SortingState) => {
    setSorting(newSorting);
    setPageIndex(0); // Reset to first page on sort
  }, []);

  const handleFilterChange = useCallback((newFilters: ColumnFiltersState) => {
    setColumnFilters(newFilters);
    setPageIndex(0); // Reset to first page on filter
  }, []);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    pageIndex,
    pageSize,
    pageCount,
    total,
    isLoading,
    handlePaginationChange,
    handleSortingChange,
    handleFilterChange,
    refresh,
  };
}
