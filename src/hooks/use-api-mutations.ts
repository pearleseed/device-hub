/**
 * React Query mutation hooks for create/update/delete operations
 *
 * This module provides typed mutation hooks for modifying data via the backend API.
 * All mutations use the centralized API client and invalidate related queries on success.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";
import { queryKeys } from "@/hooks/use-api-queries";
import type {
  DeviceWithDepartment,
  UserPublic,
  BorrowRequestWithDetails,
  ReturnRequestWithDetails,
  RenewalRequestWithDetails,
  CreateDeviceRequest,
  UpdateDeviceRequest,
  CreateBorrowRequest,
  CreateReturnRequest,
  CreateRenewalRequest,
  RequestStatus,
  RenewalStatus,
} from "@/types/api";

// ============================================================================
// Error Handling Helper
// ============================================================================

/**
 * Display error toast for mutation failures
 */
function handleMutationError(error: Error, operation: string): void {
  toast({
    title: `${operation} Failed`,
    description: error.message || "An unexpected error occurred",
    variant: "destructive",
  });
}

/**
 * Display success toast for mutation successes
 */
function handleMutationSuccess(message: string): void {
  toast({
    title: "Success",
    description: message,
  });
}

// ============================================================================
// Device Mutations
// ============================================================================

/**
 * Create a new device
 */
export function useCreateDevice(): UseMutationResult<
  DeviceWithDepartment,
  Error,
  CreateDeviceRequest
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDeviceRequest) =>
      apiClient.post<DeviceWithDepartment>("/api/devices", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.devices.all });
      handleMutationSuccess("Device created successfully");
    },
    onError: (error: Error) => {
      handleMutationError(error, "Create Device");
    },
  });
}

/**
 * Update an existing device
 */
export function useUpdateDevice(): UseMutationResult<
  DeviceWithDepartment,
  Error,
  { id: number; data: UpdateDeviceRequest }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateDeviceRequest }) =>
      apiClient.put<DeviceWithDepartment>(`/api/devices/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.devices.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.devices.detail(variables.id),
      });
      handleMutationSuccess("Device updated successfully");
    },
    onError: (error: Error) => {
      handleMutationError(error, "Update Device");
    },
  });
}

/**
 * Delete a device
 */
export function useDeleteDevice(): UseMutationResult<void, Error, number> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiClient.delete<void>(`/api/devices/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.devices.all });
      handleMutationSuccess("Device deleted successfully");
    },
    onError: (error: Error) => {
      handleMutationError(error, "Delete Device");
    },
  });
}

// ============================================================================
// Borrow Request Mutations
// ============================================================================

/**
 * Create a new borrow request
 */
export function useCreateBorrowRequest(): UseMutationResult<
  BorrowRequestWithDetails,
  Error,
  CreateBorrowRequest
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBorrowRequest) =>
      apiClient.post<BorrowRequestWithDetails>("/api/borrow", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.borrowRequests.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.devices.all });
      handleMutationSuccess("Borrow request submitted successfully");
    },
    onError: (error: Error) => {
      handleMutationError(error, "Create Borrow Request");
    },
  });
}

/**
 * Update borrow request status (approve/reject/etc.)
 */
export function useUpdateBorrowStatus(): UseMutationResult<
  BorrowRequestWithDetails,
  Error,
  { id: number; status: RequestStatus }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: RequestStatus }) =>
      apiClient.patch<BorrowRequestWithDetails>(`/api/borrow/${id}/status`, {
        status,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.borrowRequests.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.borrowRequests.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.devices.all });
      handleMutationSuccess(`Borrow request ${variables.status} successfully`);
    },
    onError: (error: Error) => {
      handleMutationError(error, "Update Borrow Status");
    },
  });
}

// ============================================================================
// Return Request Mutations
// ============================================================================

/**
 * Create a new return request
 */
export function useCreateReturnRequest(): UseMutationResult<
  ReturnRequestWithDetails,
  Error,
  CreateReturnRequest
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReturnRequest) =>
      apiClient.post<ReturnRequestWithDetails>("/api/returns", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.returns.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.borrowRequests.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.devices.all });
      handleMutationSuccess("Return request submitted successfully");
    },
    onError: (error: Error) => {
      handleMutationError(error, "Create Return Request");
    },
  });
}

// ============================================================================
// Renewal Request Mutations
// ============================================================================

/**
 * Create a new renewal request
 */
export function useCreateRenewalRequest(): UseMutationResult<
  RenewalRequestWithDetails,
  Error,
  CreateRenewalRequest
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRenewalRequest) =>
      apiClient.post<RenewalRequestWithDetails>("/api/renewals", data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.renewals.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.renewals.byBorrow(variables.borrow_request_id),
      });
      handleMutationSuccess("Renewal request submitted successfully");
    },
    onError: (error: Error) => {
      handleMutationError(error, "Create Renewal Request");
    },
  });
}

/**
 * Update renewal request status (approve/reject)
 */
export function useUpdateRenewalStatus(): UseMutationResult<
  RenewalRequestWithDetails,
  Error,
  { id: number; status: RenewalStatus }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: RenewalStatus }) =>
      apiClient.patch<RenewalRequestWithDetails>(`/api/renewals/${id}/status`, {
        status,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.renewals.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.renewals.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.borrowRequests.all });
      handleMutationSuccess(`Renewal request ${variables.status} successfully`);
    },
    onError: (error: Error) => {
      handleMutationError(error, "Update Renewal Status");
    },
  });
}

// ============================================================================
// User Mutations
// ============================================================================

/**
 * Update user profile/details
 */
export function useUpdateUser(): UseMutationResult<
  UserPublic,
  Error,
  { id: number; data: Partial<UserPublic> }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<UserPublic> }) =>
      apiClient.put<UserPublic>(`/api/users/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.detail(variables.id),
      });
      handleMutationSuccess("User updated successfully");
    },
    onError: (error: Error) => {
      handleMutationError(error, "Update User");
    },
  });
}

/**
 * Reset user password (superuser only)
 */
export function useResetUserPassword(): UseMutationResult<void, Error, number> {
  return useMutation({
    mutationFn: (id: number) =>
      apiClient.patch<void>(`/api/users/${id}/password`, {}),
    onSuccess: () => {
      handleMutationSuccess(
        "Password reset successfully. User will need to change password on next login.",
      );
    },
    onError: (error: Error) => {
      handleMutationError(error, "Reset Password");
    },
  });
}

/**
 * Toggle user active status
 */
export function useToggleUserStatus(): UseMutationResult<
  UserPublic,
  Error,
  { id: number; is_active: boolean }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      apiClient.patch<UserPublic>(`/api/users/${id}/status`, { is_active }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.detail(variables.id),
      });
      handleMutationSuccess(
        variables.is_active
          ? "User activated successfully"
          : "User deactivated successfully",
      );
    },
    onError: (error: Error) => {
      handleMutationError(error, "Toggle User Status");
    },
  });
}

/**
 * Delete a user (superuser only)
 */
export function useDeleteUser(): UseMutationResult<void, Error, number> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiClient.delete<void>(`/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      handleMutationSuccess("User deleted successfully");
    },
    onError: (error: Error) => {
      handleMutationError(error, "Delete User");
    },
  });
}
