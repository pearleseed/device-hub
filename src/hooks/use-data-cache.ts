import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  devices as mockDevices,
  users as mockUsers,
  bookingRequests as mockBookingRequests,
  getRequestsByUser,
  getDeviceById,
  getDevicesByStatus,
  getRequestsByStatus,
  getUserById,
  getRenewalsByBorrowRequest,
} from "@/lib/mockData";

// Cache duration constants (in milliseconds)
const STALE_TIME = 5 * 60 * 1000; // 5 minutes - data considered fresh
const GC_TIME = 10 * 60 * 1000; // 10 minutes - garbage collection time

// Obfuscated timestamp for cache versioning
const getCacheTimestamp = () => {
  const now = Date.now();
  // Encode timestamp with simple obfuscation
  return btoa(String(now)).slice(0, 8);
};

// Query keys with versioning
export const queryKeys = {
  devices: ["devices"] as const,
  device: (id: string) => ["device", id] as const,
  devicesByStatus: (status: string) => ["devices", "status", status] as const,
  users: ["users"] as const,
  user: (id: string) => ["user", id] as const,
  requests: ["requests"] as const,
  userRequests: (userId: string) => ["requests", "user", userId] as const,
  requestsByStatus: (status: string) => ["requests", "status", status] as const,
  renewals: (borrowRequestId: string) => ["renewals", borrowRequestId] as const,
};

// Simulated async fetch with minimal delay (for UX smoothness)
const simulateFetch = <T>(data: T, delay = 100): Promise<T> => {
  return new Promise((resolve) => setTimeout(() => resolve(data), delay));
};

// Hook for all devices
export function useDevices() {
  return useQuery({
    queryKey: queryKeys.devices,
    queryFn: () => simulateFetch([...mockDevices]),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

// Hook for single device
export function useDevice(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.device(id || ""),
    queryFn: () => simulateFetch(getDeviceById(id || "")),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    enabled: !!id,
  });
}

// Hook for devices by status
export function useDevicesByStatus(status: "available" | "borrowed" | "maintenance") {
  return useQuery({
    queryKey: queryKeys.devicesByStatus(status),
    queryFn: () => simulateFetch(getDevicesByStatus(status)),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

// Hook for all users
export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: () => simulateFetch([...mockUsers]),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

// Hook for single user
export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.user(id || ""),
    queryFn: () => simulateFetch(getUserById(id || "")),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    enabled: !!id,
  });
}

// Hook for all booking requests
export function useBookingRequests() {
  return useQuery({
    queryKey: queryKeys.requests,
    queryFn: () => simulateFetch([...mockBookingRequests]),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

// Hook for user's requests
export function useUserRequests(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.userRequests(userId || ""),
    queryFn: () => simulateFetch(getRequestsByUser(userId || "")),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    enabled: !!userId,
  });
}

// Hook for requests by status
export function useRequestsByStatus(status: string) {
  return useQuery({
    queryKey: queryKeys.requestsByStatus(status),
    queryFn: () => simulateFetch(getRequestsByStatus(status as any)),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

// Hook for renewals by borrow request
export function useRenewals(borrowRequestId: string) {
  return useQuery({
    queryKey: queryKeys.renewals(borrowRequestId),
    queryFn: () => simulateFetch(getRenewalsByBorrowRequest(borrowRequestId)),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    enabled: !!borrowRequestId,
  });
}

// Hook to invalidate and refresh data
export function useRefreshData() {
  const queryClient = useQueryClient();

  const refreshAll = () => {
    queryClient.invalidateQueries();
  };

  const refreshDevices = () => {
    queryClient.invalidateQueries({ queryKey: ["devices"] });
  };

  const refreshRequests = () => {
    queryClient.invalidateQueries({ queryKey: ["requests"] });
  };

  const refreshUsers = () => {
    queryClient.invalidateQueries({ queryKey: ["users"] });
  };

  return {
    refreshAll,
    refreshDevices,
    refreshRequests,
    refreshUsers,
    getCacheTimestamp,
  };
}

// Dashboard data hook - combines multiple queries efficiently
export function useDashboardData(userId: string) {
  const devicesQuery = useDevices();
  const userRequestsQuery = useUserRequests(userId);

  const isLoading = devicesQuery.isLoading || userRequestsQuery.isLoading;
  const isFetching = devicesQuery.isFetching || userRequestsQuery.isFetching;

  return {
    devices: devicesQuery.data || [],
    userRequests: userRequestsQuery.data || [],
    isLoading,
    isFetching,
    isStale: devicesQuery.isStale || userRequestsQuery.isStale,
  };
}

// Admin dashboard data hook
export function useAdminDashboardData() {
  const devicesQuery = useDevices();
  const usersQuery = useUsers();
  const requestsQuery = useBookingRequests();

  const isLoading = devicesQuery.isLoading || usersQuery.isLoading || requestsQuery.isLoading;
  const isFetching = devicesQuery.isFetching || usersQuery.isFetching || requestsQuery.isFetching;

  return {
    devices: devicesQuery.data || [],
    users: usersQuery.data || [],
    requests: requestsQuery.data || [],
    isLoading,
    isFetching,
  };
}
