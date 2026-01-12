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
  testDevice?: DeviceWithDepartment;
  testUser?: UserPublic;
  testBorrowRequest?: BorrowRequestWithDetails;
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
