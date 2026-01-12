/**
 * React Query Hooks Integration Tests
 *
 * Tests for the React Query hooks (src/hooks/use-api-queries.ts, src/hooks/use-api-mutations.ts)
 * Validates data fetching, caching, mutations, and cache invalidation.
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor, act } from "@testing-library/react";
import React from "react";

// Import hooks to test
import {
  useDevices,
  useDevice,
  useUsers,
  useBorrowRequests,
  useRefreshData,
  queryKeys,
} from "../../src/hooks/use-api-queries";
import {
  useCreateDevice,
  useUpdateDevice,
  useDeleteDevice,
  useCreateBorrowRequest,
  useUpdateBorrowStatus,
} from "../../src/hooks/use-api-mutations";

// Import API client for mocking
import { apiClient } from "../../src/lib/api-client";

// Import toast for mocking
import * as toastModule from "../../src/hooks/use-toast";

// ============================================================================
// Test Setup
// ============================================================================

// Mock the API client
vi.mock("../../src/lib/api-client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock the toast hook
vi.mock("../../src/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

// Mock device data
const mockDevices = [
  {
    id: 1,
    name: 'MacBook Pro 16"',
    asset_tag: "DEV-001",
    category: "laptop",
    brand: "Apple",
    model: "MacBook Pro",
    status: "available",
    department_id: 1,
    department_name: "Engineering",
    purchase_price: 2499,
    selling_price: null,
    purchase_date: new Date("2024-01-15"),
    specs_json: '{"cpu": "M3 Pro", "ram": "32GB"}',
    image_url: "/images/macbook.jpg",
    image_thumbnail_url: "/images/macbook-thumb.jpg",
    created_at: new Date("2024-01-15"),
  },
  {
    id: 2,
    name: "Dell XPS 15",
    asset_tag: "DEV-002",
    category: "laptop",
    brand: "Dell",
    model: "XPS 15",
    status: "borrowed",
    department_id: 2,
    department_name: "Design",
    purchase_price: 1899,
    selling_price: null,
    purchase_date: new Date("2024-02-20"),
    specs_json: '{"cpu": "Intel i9", "ram": "64GB"}',
    image_url: "/images/dell.jpg",
    image_thumbnail_url: "/images/dell-thumb.jpg",
    created_at: new Date("2024-02-20"),
  },
];

// Mock user data
const mockUsers = [
  {
    id: 1,
    name: "John Doe",
    email: "john.doe@company.com",
    department_id: 1,
    department_name: "Engineering",
    role: "admin",
    avatar_url: null,
    avatar_thumbnail_url: null,
    is_active: true,
    last_login_at: new Date("2024-06-01"),
    created_at: new Date("2024-01-01"),
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane.smith@company.com",
    department_id: 2,
    department_name: "Design",
    role: "user",
    avatar_url: null,
    avatar_thumbnail_url: null,
    is_active: true,
    last_login_at: new Date("2024-06-02"),
    created_at: new Date("2024-01-15"),
  },
];

// Mock borrow request data
const mockBorrowRequests = [
  {
    id: 1,
    device_id: 2,
    user_id: 2,
    approved_by: 1,
    start_date: new Date("2024-06-01"),
    end_date: new Date("2024-06-30"),
    reason: "Project work",
    status: "active",
    created_at: new Date("2024-05-28"),
    updated_at: new Date("2024-06-01"),
    device_name: "Dell XPS 15",
    device_asset_tag: "DEV-002",
    user_name: "Jane Smith",
    user_email: "jane.smith@company.com",
    approved_by_name: "John Doe",
  },
];

// Create a wrapper with QueryClientProvider
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

// Create a wrapper that exposes the queryClient for testing cache invalidation
function createWrapperWithClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  return { wrapper, queryClient };
}

describe("React Query Hooks Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // useDevices Hook Tests (Requirement 9.1)
  // ==========================================================================

  describe("useDevices Hook", () => {
    it("should fetch devices from the API and return typed data", async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockDevices);

      const { result } = renderHook(() => useDevices(), {
        wrapper: createWrapper(),
      });

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify data
      expect(result.current.data).toEqual(mockDevices);
      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0].name).toBe('MacBook Pro 16"');
      expect(apiClient.get).toHaveBeenCalledWith("/api/devices", {});
    });

    it("should fetch devices with filters", async () => {
      const filteredDevices = [mockDevices[0]];
      vi.mocked(apiClient.get).mockResolvedValue(filteredDevices);

      const filters = {
        category: "laptop" as const,
        status: "available" as const,
      };
      const { result } = renderHook(() => useDevices(filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(filteredDevices);
      expect(apiClient.get).toHaveBeenCalledWith("/api/devices", {
        category: "laptop",
        status: "available",
      });
    });

    it("should handle API errors gracefully", async () => {
      const error = new Error("Failed to fetch devices");
      vi.mocked(apiClient.get).mockRejectedValue(error);

      const { result } = renderHook(() => useDevices(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  // ==========================================================================
  // useDevice Hook Tests (Requirement 9.2)
  // ==========================================================================

  describe("useDevice Hook", () => {
    it("should fetch a single device by ID", async () => {
      const singleDevice = mockDevices[0];
      vi.mocked(apiClient.get).mockResolvedValue(singleDevice);

      const { result } = renderHook(() => useDevice(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(singleDevice);
      expect(apiClient.get).toHaveBeenCalledWith("/api/devices/1");
    });

    it("should not fetch when ID is 0 or negative", async () => {
      const { result } = renderHook(() => useDevice(0), {
        wrapper: createWrapper(),
      });

      // Query should be disabled
      expect(result.current.fetchStatus).toBe("idle");
      expect(apiClient.get).not.toHaveBeenCalled();
    });

    it("should handle device not found error", async () => {
      const error = new Error("Device not found");
      vi.mocked(apiClient.get).mockRejectedValue(error);

      const { result } = renderHook(() => useDevice(999), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  // ==========================================================================
  // useUsers Hook Tests (Requirement 9.3)
  // ==========================================================================

  describe("useUsers Hook", () => {
    it("should fetch all users from the API", async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockUsers);

      const { result } = renderHook(() => useUsers(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockUsers);
      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0].name).toBe("John Doe");
      expect(apiClient.get).toHaveBeenCalledWith("/api/users");
    });

    it("should handle unauthorized error for non-admin users", async () => {
      const error = new Error("Forbidden");
      vi.mocked(apiClient.get).mockRejectedValue(error);

      const { result } = renderHook(() => useUsers(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  // ==========================================================================
  // useBorrowRequests Hook Tests (Requirement 9.4)
  // ==========================================================================

  describe("useBorrowRequests Hook", () => {
    it("should fetch borrow requests from the API", async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockBorrowRequests);

      const { result } = renderHook(() => useBorrowRequests(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockBorrowRequests);
      expect(result.current.data).toHaveLength(1);
      expect(result.current.data?.[0].status).toBe("active");
      expect(apiClient.get).toHaveBeenCalledWith("/api/borrow");
    });

    it("should handle API errors gracefully", async () => {
      const error = new Error("Failed to fetch borrow requests");
      vi.mocked(apiClient.get).mockRejectedValue(error);

      const { result } = renderHook(() => useBorrowRequests(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  // ==========================================================================
  // Mutation Success Invalidates Queries Tests (Requirement 9.5)
  // ==========================================================================

  describe("Mutation Success Invalidates Queries", () => {
    it("should invalidate device queries after creating a device", async () => {
      const newDevice = {
        ...mockDevices[0],
        id: 3,
        name: "New Device",
        asset_tag: "DEV-003",
      };
      vi.mocked(apiClient.post).mockResolvedValue(newDevice);
      vi.mocked(apiClient.get).mockResolvedValue(mockDevices);

      const { wrapper, queryClient } = createWrapperWithClient();

      // Pre-populate the cache
      queryClient.setQueryData(queryKeys.devices.all, mockDevices);

      const { result } = renderHook(() => useCreateDevice(), { wrapper });

      // Spy on invalidateQueries
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      await act(async () => {
        await result.current.mutateAsync({
          name: "New Device",
          asset_tag: "DEV-003",
          category: "laptop",
          brand: "Test",
          model: "Test Model",
          department_id: 1,
          purchase_price: 1000,
          purchase_date: "2024-01-01",
          specs_json: "{}",
          image_url: "/test.jpg",
        });
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.devices.all,
      });
    });

    it("should invalidate device queries after updating a device", async () => {
      const updatedDevice = { ...mockDevices[0], name: "Updated Device" };
      vi.mocked(apiClient.put).mockResolvedValue(updatedDevice);

      const { wrapper, queryClient } = createWrapperWithClient();

      // Pre-populate the cache
      queryClient.setQueryData(queryKeys.devices.all, mockDevices);
      queryClient.setQueryData(queryKeys.devices.detail(1), mockDevices[0]);

      const { result } = renderHook(() => useUpdateDevice(), { wrapper });

      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      await act(async () => {
        await result.current.mutateAsync({
          id: 1,
          data: { name: "Updated Device" },
        });
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.devices.all,
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.devices.detail(1),
      });
    });

    it("should invalidate device queries after deleting a device", async () => {
      vi.mocked(apiClient.delete).mockResolvedValue(undefined);

      const { wrapper, queryClient } = createWrapperWithClient();

      // Pre-populate the cache
      queryClient.setQueryData(queryKeys.devices.all, mockDevices);

      const { result } = renderHook(() => useDeleteDevice(), { wrapper });

      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      await act(async () => {
        await result.current.mutateAsync(1);
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.devices.all,
      });
    });

    it("should invalidate borrow and device queries after creating a borrow request", async () => {
      const newBorrowRequest = {
        ...mockBorrowRequests[0],
        id: 2,
      };
      vi.mocked(apiClient.post).mockResolvedValue(newBorrowRequest);

      const { wrapper, queryClient } = createWrapperWithClient();

      // Pre-populate the cache
      queryClient.setQueryData(
        queryKeys.borrowRequests.all,
        mockBorrowRequests,
      );
      queryClient.setQueryData(queryKeys.devices.all, mockDevices);

      const { result } = renderHook(() => useCreateBorrowRequest(), {
        wrapper,
      });

      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      await act(async () => {
        await result.current.mutateAsync({
          device_id: 1,
          start_date: "2024-07-01",
          end_date: "2024-07-31",
          reason: "Testing",
        });
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.borrowRequests.all,
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.devices.all,
      });
    });

    it("should invalidate queries after updating borrow status", async () => {
      const updatedRequest = { ...mockBorrowRequests[0], status: "returned" };
      vi.mocked(apiClient.patch).mockResolvedValue(updatedRequest);

      const { wrapper, queryClient } = createWrapperWithClient();

      // Pre-populate the cache
      queryClient.setQueryData(
        queryKeys.borrowRequests.all,
        mockBorrowRequests,
      );

      const { result } = renderHook(() => useUpdateBorrowStatus(), { wrapper });

      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      await act(async () => {
        await result.current.mutateAsync({
          id: 1,
          status: "returned",
        });
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.borrowRequests.all,
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.devices.all,
      });
    });
  });

  // ==========================================================================
  // Mutation Failure Shows Error Toast Tests (Requirement 9.6)
  // ==========================================================================

  describe("Mutation Failure Shows Error Toast", () => {
    it("should show error toast when device creation fails", async () => {
      const error = new Error("Failed to create device");
      vi.mocked(apiClient.post).mockRejectedValue(error);

      const { result } = renderHook(() => useCreateDevice(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            name: "New Device",
            asset_tag: "DEV-003",
            category: "laptop",
            brand: "Test",
            model: "Test Model",
            department_id: 1,
            purchase_price: 1000,
            purchase_date: "2024-01-01",
            specs_json: "{}",
            image_url: "/test.jpg",
          });
        } catch {
          // Expected to throw
        }
      });

      expect(toastModule.toast).toHaveBeenCalledWith({
        title: "Create Device Failed",
        description: "Failed to create device",
        variant: "destructive",
      });
    });

    it("should show error toast when device update fails", async () => {
      const error = new Error("Failed to update device");
      vi.mocked(apiClient.put).mockRejectedValue(error);

      const { result } = renderHook(() => useUpdateDevice(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            id: 1,
            data: { name: "Updated Device" },
          });
        } catch {
          // Expected to throw
        }
      });

      expect(toastModule.toast).toHaveBeenCalledWith({
        title: "Update Device Failed",
        description: "Failed to update device",
        variant: "destructive",
      });
    });

    it("should show error toast when device deletion fails", async () => {
      const error = new Error("Cannot delete device with active requests");
      vi.mocked(apiClient.delete).mockRejectedValue(error);

      const { result } = renderHook(() => useDeleteDevice(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(1);
        } catch {
          // Expected to throw
        }
      });

      expect(toastModule.toast).toHaveBeenCalledWith({
        title: "Delete Device Failed",
        description: "Cannot delete device with active requests",
        variant: "destructive",
      });
    });

    it("should show error toast when borrow request creation fails", async () => {
      const error = new Error("Device is not available");
      vi.mocked(apiClient.post).mockRejectedValue(error);

      const { result } = renderHook(() => useCreateBorrowRequest(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            device_id: 1,
            start_date: "2024-07-01",
            end_date: "2024-07-31",
            reason: "Testing",
          });
        } catch {
          // Expected to throw
        }
      });

      expect(toastModule.toast).toHaveBeenCalledWith({
        title: "Create Borrow Request Failed",
        description: "Device is not available",
        variant: "destructive",
      });
    });

    it("should show error toast when borrow status update fails", async () => {
      const error = new Error("Invalid status transition");
      vi.mocked(apiClient.patch).mockRejectedValue(error);

      const { result } = renderHook(() => useUpdateBorrowStatus(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            id: 1,
            status: "approved",
          });
        } catch {
          // Expected to throw
        }
      });

      expect(toastModule.toast).toHaveBeenCalledWith({
        title: "Update Borrow Status Failed",
        description: "Invalid status transition",
        variant: "destructive",
      });
    });
  });

  // ==========================================================================
  // useRefreshData Invalidates Caches Tests (Requirement 9.7)
  // ==========================================================================

  describe("useRefreshData Invalidates Caches", () => {
    it("should invalidate device queries when refreshDevices is called", async () => {
      const { wrapper, queryClient } = createWrapperWithClient();

      // Pre-populate the cache
      queryClient.setQueryData(queryKeys.devices.all, mockDevices);

      const { result } = renderHook(() => useRefreshData(), { wrapper });

      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      await act(async () => {
        result.current.refreshDevices();
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["devices"] });
    });

    it("should invalidate user queries when refreshUsers is called", async () => {
      const { wrapper, queryClient } = createWrapperWithClient();

      // Pre-populate the cache
      queryClient.setQueryData(queryKeys.users.all, mockUsers);

      const { result } = renderHook(() => useRefreshData(), { wrapper });

      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      await act(async () => {
        result.current.refreshUsers();
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["users"] });
    });

    it("should invalidate borrow request queries when refreshBorrowRequests is called", async () => {
      const { wrapper, queryClient } = createWrapperWithClient();

      // Pre-populate the cache
      queryClient.setQueryData(
        queryKeys.borrowRequests.all,
        mockBorrowRequests,
      );

      const { result } = renderHook(() => useRefreshData(), { wrapper });

      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      await act(async () => {
        result.current.refreshBorrowRequests();
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["borrowRequests"],
      });
    });

    it("should invalidate return queries when refreshReturns is called", async () => {
      const { wrapper, queryClient } = createWrapperWithClient();

      const { result } = renderHook(() => useRefreshData(), { wrapper });

      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      await act(async () => {
        result.current.refreshReturns();
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["returns"] });
    });

    it("should invalidate renewal queries when refreshRenewals is called", async () => {
      const { wrapper, queryClient } = createWrapperWithClient();

      const { result } = renderHook(() => useRefreshData(), { wrapper });

      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      await act(async () => {
        result.current.refreshRenewals();
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["renewals"] });
    });

    it("should invalidate department queries when refreshDepartments is called", async () => {
      const { wrapper, queryClient } = createWrapperWithClient();

      const { result } = renderHook(() => useRefreshData(), { wrapper });

      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      await act(async () => {
        result.current.refreshDepartments();
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["departments"] });
    });

    it("should invalidate all queries when refreshAll is called", async () => {
      const { wrapper, queryClient } = createWrapperWithClient();

      // Pre-populate multiple caches
      queryClient.setQueryData(queryKeys.devices.all, mockDevices);
      queryClient.setQueryData(queryKeys.users.all, mockUsers);
      queryClient.setQueryData(
        queryKeys.borrowRequests.all,
        mockBorrowRequests,
      );

      const { result } = renderHook(() => useRefreshData(), { wrapper });

      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      await act(async () => {
        result.current.refreshAll();
      });

      expect(invalidateSpy).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Query Keys Tests
  // ==========================================================================

  describe("Query Keys", () => {
    it("should generate correct query keys for devices", () => {
      expect(queryKeys.devices.all).toEqual(["devices"]);
      expect(queryKeys.devices.detail(1)).toEqual(["devices", 1]);
      expect(queryKeys.devices.filtered({ category: "laptop" })).toEqual([
        "devices",
        "filtered",
        { category: "laptop" },
      ]);
    });

    it("should generate correct query keys for users", () => {
      expect(queryKeys.users.all).toEqual(["users"]);
      expect(queryKeys.users.detail(1)).toEqual(["users", 1]);
    });

    it("should generate correct query keys for borrow requests", () => {
      expect(queryKeys.borrowRequests.all).toEqual(["borrowRequests"]);
      expect(queryKeys.borrowRequests.detail(1)).toEqual(["borrowRequests", 1]);
      expect(queryKeys.borrowRequests.byUser(1)).toEqual([
        "borrowRequests",
        "user",
        1,
      ]);
    });

    it("should generate correct query keys for returns", () => {
      expect(queryKeys.returns.all).toEqual(["returns"]);
      expect(queryKeys.returns.detail(1)).toEqual(["returns", 1]);
    });

    it("should generate correct query keys for renewals", () => {
      expect(queryKeys.renewals.all).toEqual(["renewals"]);
      expect(queryKeys.renewals.detail(1)).toEqual(["renewals", 1]);
      expect(queryKeys.renewals.byBorrow(1)).toEqual(["renewals", "borrow", 1]);
    });

    it("should generate correct query keys for departments", () => {
      expect(queryKeys.departments.all).toEqual(["departments"]);
      expect(queryKeys.departments.names).toEqual(["departments", "names"]);
    });
  });
});
