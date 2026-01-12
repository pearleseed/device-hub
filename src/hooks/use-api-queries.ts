/**
 * React Query hooks for data fetching
 *
 * This module provides typed query hooks for fetching data from the backend API.
 * All hooks use the centralized API client and return properly typed data.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  DeviceWithDepartment,
  UserPublic,
  BorrowRequestWithDetails,
  ReturnRequestWithDetails,
  RenewalRequestWithDetails,
  Department,
  DepartmentName,
  DeviceCategory,
  DeviceStatus,
} from "@/types/api";

// ============================================================================
// Query Configuration
// ============================================================================

const STALE_TIME = 5 * 60 * 1000; // 5 minutes
const GC_TIME = 10 * 60 * 1000; // 10 minutes (garbage collection time)

// ============================================================================
// Filter Types
// ============================================================================

export interface DeviceFilters {
  category?: DeviceCategory;
  status?: DeviceStatus;
  search?: string;
  min_price?: number;
  max_price?: number;
  department_id?: number;
}

// ============================================================================
// Query Keys Factory
// ============================================================================

/**
 * Centralized query key factory for consistent cache management.
 * Following the pattern: ["entity"], ["entity", id], ["entity", "filter", value]
 */
export const queryKeys = {
  // Device queries
  devices: {
    all: ["devices"] as const,
    detail: (id: number) => ["devices", id] as const,
    filtered: (filters: DeviceFilters) =>
      ["devices", "filtered", filters] as const,
  },

  // User queries
  users: {
    all: ["users"] as const,
    detail: (id: number) => ["users", id] as const,
  },

  // Borrow request queries
  borrowRequests: {
    all: ["borrowRequests"] as const,
    detail: (id: number) => ["borrowRequests", id] as const,
    byUser: (userId: number) => ["borrowRequests", "user", userId] as const,
  },

  // Return request queries
  returns: {
    all: ["returns"] as const,
    detail: (id: number) => ["returns", id] as const,
  },

  // Renewal request queries
  renewals: {
    all: ["renewals"] as const,
    detail: (id: number) => ["renewals", id] as const,
    byBorrow: (borrowId: number) => ["renewals", "borrow", borrowId] as const,
  },

  // Department queries
  departments: {
    all: ["departments"] as const,
    names: ["departments", "names"] as const,
  },
} as const;

// ============================================================================
// Device Hooks
// ============================================================================

/**
 * Fetch all devices with optional filters
 */
export function useDevices(
  filters?: DeviceFilters,
): UseQueryResult<DeviceWithDepartment[]> {
  return useQuery({
    queryKey: filters
      ? queryKeys.devices.filtered(filters)
      : queryKeys.devices.all,
    queryFn: async () => {
      const params: Record<string, string> = {};

      if (filters) {
        if (filters.category) params.category = filters.category;
        if (filters.status) params.status = filters.status;
        if (filters.search) params.search = filters.search;
        if (filters.min_price !== undefined)
          params.min_price = String(filters.min_price);
        if (filters.max_price !== undefined)
          params.max_price = String(filters.max_price);
        if (filters.department_id !== undefined)
          params.department_id = String(filters.department_id);
      }

      return apiClient.get<DeviceWithDepartment[]>("/api/devices", params);
    },
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

/**
 * Fetch a single device by ID
 */
export function useDevice(id: number): UseQueryResult<DeviceWithDepartment> {
  return useQuery({
    queryKey: queryKeys.devices.detail(id),
    queryFn: () => apiClient.get<DeviceWithDepartment>(`/api/devices/${id}`),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    enabled: id > 0,
  });
}

// ============================================================================
// User Hooks
// ============================================================================

/**
 * Fetch all users
 */
export function useUsers(): UseQueryResult<UserPublic[]> {
  return useQuery({
    queryKey: queryKeys.users.all,
    queryFn: () => apiClient.get<UserPublic[]>("/api/users"),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

/**
 * Fetch a single user by ID
 */
export function useUser(id: number): UseQueryResult<UserPublic> {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => apiClient.get<UserPublic>(`/api/users/${id}`),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    enabled: id > 0,
  });
}

// ============================================================================
// Borrow Request Hooks
// ============================================================================

/**
 * Fetch all borrow requests
 */
export function useBorrowRequests(): UseQueryResult<
  BorrowRequestWithDetails[]
> {
  return useQuery({
    queryKey: queryKeys.borrowRequests.all,
    queryFn: () => apiClient.get<BorrowRequestWithDetails[]>("/api/borrow"),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

/**
 * Fetch borrow requests for a specific user
 */
export function useUserBorrowRequests(
  userId: number,
): UseQueryResult<BorrowRequestWithDetails[]> {
  return useQuery({
    queryKey: queryKeys.borrowRequests.byUser(userId),
    queryFn: () =>
      apiClient.get<BorrowRequestWithDetails[]>(`/api/borrow/user/${userId}`),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    enabled: userId > 0,
  });
}

// ============================================================================
// Return Request Hooks
// ============================================================================

/**
 * Fetch all return requests
 */
export function useReturns(): UseQueryResult<ReturnRequestWithDetails[]> {
  return useQuery({
    queryKey: queryKeys.returns.all,
    queryFn: () => apiClient.get<ReturnRequestWithDetails[]>("/api/returns"),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

// ============================================================================
// Renewal Request Hooks
// ============================================================================

/**
 * Fetch all renewal requests
 */
export function useRenewals(): UseQueryResult<RenewalRequestWithDetails[]> {
  return useQuery({
    queryKey: queryKeys.renewals.all,
    queryFn: () => apiClient.get<RenewalRequestWithDetails[]>("/api/renewals"),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

/**
 * Fetch renewal requests for a specific borrow request
 */
export function useRenewalsByBorrow(
  borrowId: number,
): UseQueryResult<RenewalRequestWithDetails[]> {
  return useQuery({
    queryKey: queryKeys.renewals.byBorrow(borrowId),
    queryFn: () =>
      apiClient.get<RenewalRequestWithDetails[]>(
        `/api/renewals/borrow/${borrowId}`,
      ),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    enabled: borrowId > 0,
  });
}

// ============================================================================
// Department Hooks
// ============================================================================

/**
 * Fetch all departments with user/device counts
 */
export function useDepartments(): UseQueryResult<Department[]> {
  return useQuery({
    queryKey: queryKeys.departments.all,
    queryFn: () => apiClient.get<Department[]>("/api/departments"),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

/**
 * Fetch department names for dropdown options
 */
export function useDepartmentNames(): UseQueryResult<DepartmentName[]> {
  return useQuery({
    queryKey: queryKeys.departments.names,
    queryFn: () => apiClient.get<DepartmentName[]>("/api/departments/names"),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

// ============================================================================
// Cache Invalidation Hook
// ============================================================================

/**
 * Hook for manual cache invalidation
 * Provides methods to invalidate specific query groups
 */
export function useRefreshData() {
  const queryClient = useQueryClient();

  return {
    /** Invalidate all device queries */
    refreshDevices: () =>
      queryClient.invalidateQueries({ queryKey: ["devices"] }),

    /** Invalidate all user queries */
    refreshUsers: () => queryClient.invalidateQueries({ queryKey: ["users"] }),

    /** Invalidate all borrow request queries */
    refreshBorrowRequests: () =>
      queryClient.invalidateQueries({ queryKey: ["borrowRequests"] }),

    /** Invalidate all return request queries */
    refreshReturns: () =>
      queryClient.invalidateQueries({ queryKey: ["returns"] }),

    /** Invalidate all renewal request queries */
    refreshRenewals: () =>
      queryClient.invalidateQueries({ queryKey: ["renewals"] }),

    /** Invalidate all department queries */
    refreshDepartments: () =>
      queryClient.invalidateQueries({ queryKey: ["departments"] }),

    /** Invalidate all queries */
    refreshAll: () => queryClient.invalidateQueries(),
  };
}
