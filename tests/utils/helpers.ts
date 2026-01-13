/**
 * Test Helper Functions for Device Hub
 *
 * Provides utility functions for common test operations.
 */

import type {
  UserPublic,
  DeviceWithDepartment,
  BorrowRequestWithDetails,
} from "../../src/types/api";
import { TestApiClient, testApiClient } from "./api-client";
import { createDevice, createUser, createBorrowRequest } from "./factories";

// ============================================================================
// Types
// ============================================================================

export interface TestContext {
  adminToken: string;
  superuserToken: string;
  userToken: string;
  adminUserId: number;
  regularUserId: number;
  testDevice?: DeviceWithDepartment;
  testUser?: UserPublic;
  testBorrowRequest?: BorrowRequestWithDetails;
}

// ============================================================================
// Cleanup Tracking
// ============================================================================

// Global arrays for tracking created resources
export const createdDeviceIds: number[] = [];
export const createdBorrowRequestIds: number[] = [];
export const createdUserIds: number[] = [];

/**
 * Reset all cleanup arrays
 */
export function resetCleanupArrays(): void {
  createdDeviceIds.length = 0;
  createdBorrowRequestIds.length = 0;
  createdUserIds.length = 0;
}

/**
 * Cleanup all created resources
 */
export async function cleanupResources(
  adminToken: string,
  superuserToken: string,
): Promise<void> {
  // Cleanup borrow requests first (by rejecting them to free devices)
  for (const requestId of createdBorrowRequestIds) {
    try {
      await testApiClient.patch(
        `/api/borrow/${requestId}/status`,
        { status: "rejected" },
        adminToken,
      );
    } catch {
      // Ignore cleanup errors
    }
  }

  // Cleanup devices
  for (const deviceId of createdDeviceIds) {
    try {
      await testApiClient.delete(`/api/devices/${deviceId}`, adminToken);
    } catch {
      // Ignore cleanup errors
    }
  }

  // Cleanup users
  for (const userId of createdUserIds) {
    try {
      await testApiClient.delete(`/api/users/${userId}`, superuserToken);
    } catch {
      // Ignore cleanup errors
    }
  }

  resetCleanupArrays();
}

// ============================================================================
// Context Setup Helpers
// ============================================================================

/**
 * Set up a test context with authenticated tokens
 */
export async function setupTestContext(): Promise<TestContext> {
  const [adminResult, superuserResult, userResult] = await Promise.all([
    testApiClient.loginAsAdmin(),
    testApiClient.loginAsSuperuser(),
    testApiClient.loginAsUser(),
  ]);

  return {
    adminToken: adminResult.token,
    superuserToken: superuserResult.token,
    userToken: userResult.token,
    adminUserId: adminResult.user.id,
    regularUserId: userResult.user.id,
  };
}

/**
 * Set up a test context with a test device
 */
export async function setupTestContextWithDevice(): Promise<
  TestContext & { testDevice: DeviceWithDepartment }
> {
  const context = await setupTestContext();

  const deviceData = createDevice();
  const response = await testApiClient.post<DeviceWithDepartment>(
    "/api/devices",
    deviceData,
    context.adminToken,
  );

  if (!response.data.success || !response.data.data) {
    throw new Error("Failed to create test device");
  }

  return {
    ...context,
    testDevice: response.data.data,
  };
}

// ============================================================================
// Assertion Helpers
// ============================================================================

/**
 * Assert that a response is successful (2xx status)
 */
export function assertSuccess<T>(response: {
  status: number;
  data: { success: boolean; data?: T };
}): T {
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Expected success status, got ${response.status}`);
  }
  if (!response.data.success) {
    throw new Error("Expected success: true in response");
  }
  return response.data.data as T;
}

/**
 * Assert that a response is an error with specific status
 */
export function assertError(
  response: { status: number; data: { success: boolean; error?: string } },
  expectedStatus: number,
): void {
  if (response.status !== expectedStatus) {
    throw new Error(
      `Expected status ${expectedStatus}, got ${response.status}`,
    );
  }
  if (response.data.success) {
    throw new Error("Expected success: false in response");
  }
}

/**
 * Assert that a response is unauthorized (401)
 */
export function assertUnauthorized(response: {
  status: number;
  data: { success: boolean };
}): void {
  assertError(response, 401);
}

/**
 * Assert that a response is forbidden (403)
 */
export function assertForbidden(response: {
  status: number;
  data: { success: boolean };
}): void {
  assertError(response, 403);
}

/**
 * Assert that a response is not found (404)
 */
export function assertNotFound(response: {
  status: number;
  data: { success: boolean };
}): void {
  assertError(response, 404);
}

/**
 * Assert that a response is a bad request (400)
 */
export function assertBadRequest(response: {
  status: number;
  data: { success: boolean };
}): void {
  assertError(response, 400);
}

// ============================================================================
// Date Helpers
// ============================================================================

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 */
export function today(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Get a date N days from today as ISO string
 */
export function daysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

/**
 * Get a date N days ago as ISO string
 */
export function daysAgo(days: number): string {
  return daysFromNow(-days);
}

// ============================================================================
// Cleanup Helpers
// ============================================================================

/**
 * Delete a device by ID (for cleanup)
 */
export async function deleteDevice(
  deviceId: number,
  adminToken: string,
): Promise<void> {
  await testApiClient.delete(`/api/devices/${deviceId}`, adminToken);
}

/**
 * Delete a user by ID (for cleanup)
 */
export async function deleteUser(
  userId: number,
  superuserToken: string,
): Promise<void> {
  await testApiClient.delete(`/api/users/${userId}`, superuserToken);
}

// ============================================================================
// Wait Helpers
// ============================================================================

/**
 * Wait for a specified number of milliseconds
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// Random Data Helpers
// ============================================================================

/**
 * Generate a random string of specified length
 */
export function randomString(length: number = 10): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a random email
 */
export function randomEmail(): string {
  return `test-${randomString(8)}@example.com`;
}

/**
 * Generate a random asset tag
 */
export function randomAssetTag(): string {
  return `ASSET-${randomString(6).toUpperCase()}`;
}

/**
 * Generate a unique asset tag with timestamp
 */
export function uniqueAssetTag(prefix: string = "TEST"): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// ============================================================================
// Test Device/User Creation Helpers
// ============================================================================

/**
 * Create a test device and track for cleanup
 */
export async function createTestDevice(
  adminToken: string,
  overrides?: Partial<Parameters<typeof createDevice>[0]>,
): Promise<DeviceWithDepartment> {
  const deviceData = createDevice({
    asset_tag: uniqueAssetTag("DEV"),
    ...overrides,
  });

  const response = await testApiClient.post<DeviceWithDepartment>(
    "/api/devices",
    deviceData,
    adminToken,
  );

  if (!response.data.success || !response.data.data?.id) {
    throw new Error(
      `Failed to create test device: ${response.data.error || "Unknown error"}`,
    );
  }

  createdDeviceIds.push(response.data.data.id);
  return response.data.data;
}

/**
 * Create a test user and track for cleanup
 */
export async function createTestUser(): Promise<{
  user: UserPublic;
  token: string;
}> {
  const userData = createUser();

  const signupResponse = await testApiClient.post<{
    token: string;
    user: UserPublic;
  }>("/api/auth/signup", userData);

  if (!signupResponse.data.success) {
    throw new Error(
      `Failed to create test user: ${(signupResponse.data as { error?: string }).error}`,
    );
  }

  const loginResponse = await testApiClient.login(
    userData.email,
    userData.password,
  );
  createdUserIds.push(loginResponse.user.id);

  return loginResponse;
}

/**
 * Create a test borrow request and track for cleanup
 */
export async function createTestBorrowRequest(
  deviceId: number,
  token: string,
  overrides?: Partial<{
    start_date: string;
    end_date: string;
    reason: string;
  }>,
): Promise<BorrowRequestWithDetails> {
  const borrowData = createBorrowRequest({
    device_id: deviceId,
    start_date: overrides?.start_date || daysFromNow(1),
    end_date: overrides?.end_date || daysFromNow(7),
    reason: overrides?.reason || "Test borrow request",
  });

  const response = await testApiClient.post<BorrowRequestWithDetails>(
    "/api/borrow",
    borrowData,
    token,
  );

  if (!response.data.success || !response.data.data?.id) {
    throw new Error(
      `Failed to create test borrow request: ${response.data.error}`,
    );
  }

  createdBorrowRequestIds.push(response.data.data.id);
  return response.data.data;
}

/**
 * Create an active borrow request (approved and activated)
 */
export async function createActiveBorrowRequest(
  deviceId: number,
  userToken: string,
  adminToken: string,
): Promise<BorrowRequestWithDetails> {
  const borrowRequest = await createTestBorrowRequest(deviceId, userToken);

  // Approve the request
  await testApiClient.patch(
    `/api/borrow/${borrowRequest.id}/status`,
    { status: "approved" },
    adminToken,
  );

  // Activate the request
  const activateResponse = await testApiClient.patch<BorrowRequestWithDetails>(
    `/api/borrow/${borrowRequest.id}/status`,
    { status: "active" },
    adminToken,
  );

  if (!activateResponse.data.success || !activateResponse.data.data) {
    throw new Error(
      `Failed to activate borrow request: ${activateResponse.data.error}`,
    );
  }

  return activateResponse.data.data;
}

// ============================================================================
// Property Test Configuration
// ============================================================================

/**
 * Default configuration for property-based tests
 */
export const propertyTestConfig = {
  numRuns: 100,
  verbose: true,
  seed: Date.now(),
};

/**
 * Get property test configuration with custom overrides
 */
export function getPropertyTestConfig(
  overrides?: Partial<typeof propertyTestConfig>,
): typeof propertyTestConfig {
  return {
    ...propertyTestConfig,
    ...overrides,
  };
}
