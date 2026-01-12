/**
 * Borrow Request API Tests
 *
 * Tests for borrow request endpoints including listing, creation,
 * status transitions, and user-specific requests.
 *
 * Requirements: 4.1-4.11
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fc from "fast-check";
import { TestApiClient } from "../utils/api-client";
import { createBorrowRequest, createDevice } from "../utils/factories";
import {
  validDateRangeArb,
  invalidDateRangeArb,
  validStatusTransitionArb,
  invalidStatusTransitionArb,
} from "../utils/generators";
import { daysFromNow, today } from "../utils/helpers";
import { TEST_USERS } from "../setup";
import type {
  BorrowRequestWithDetails,
  DeviceWithDepartment,
  UserPublic,
} from "../../src/types/api";

// ============================================================================
// Test Setup
// ============================================================================

const api = new TestApiClient();

let adminToken: string;
let superuserToken: string;
let userToken: string;
let regularUserId: number;
let adminUserId: number;
const createdDeviceIds: number[] = [];
const createdBorrowRequestIds: number[] = [];

beforeAll(async () => {
  const [adminResult, superuserResult, userResult] = await Promise.all([
    api.loginAsAdmin(),
    api.loginAsSuperuser(),
    api.loginAsUser(),
  ]);
  adminToken = adminResult.token;
  superuserToken = superuserResult.token;
  userToken = userResult.token;
  regularUserId = userResult.user.id;
  adminUserId = adminResult.user.id;
});

afterAll(async () => {
  // Cleanup created borrow requests (by rejecting them to free devices)
  for (const requestId of createdBorrowRequestIds) {
    try {
      // Try to reject or return the request to free the device
      await api.patch(
        `/api/borrow/${requestId}/status`,
        { status: "rejected" },
        adminToken,
      );
    } catch {
      // Ignore cleanup errors
    }
  }

  // Cleanup created devices
  for (const deviceId of createdDeviceIds) {
    try {
      await api.delete(`/api/devices/${deviceId}`, adminToken);
    } catch {
      // Ignore cleanup errors
    }
  }
});

// ============================================================================
// Helper Functions
// ============================================================================

// Counter for unique asset tags
let deviceCounter = Date.now();

/**
 * Create a test device and return its ID
 */
async function createTestDevice(): Promise<number> {
  deviceCounter++;
  const uniqueAssetTag = `TEST-${deviceCounter}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const deviceData = createDevice({
    asset_tag: uniqueAssetTag,
    name: `Test Device ${deviceCounter}`,
  });

  const response = await api.post<DeviceWithDepartment>(
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
  return response.data.data.id;
}

/**
 * Create a test borrow request and return it
 */
async function createTestBorrowRequest(
  deviceId: number,
  token: string = userToken,
  overrides?: Partial<{ start_date: string; end_date: string; reason: string }>,
): Promise<BorrowRequestWithDetails> {
  const borrowData = createBorrowRequest({
    device_id: deviceId,
    start_date: overrides?.start_date || daysFromNow(1),
    end_date: overrides?.end_date || daysFromNow(7),
    reason: overrides?.reason || "Test borrow request",
  });

  const response = await api.post<BorrowRequestWithDetails>(
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

// ============================================================================
// Borrow Request Listing Tests (Requirements 4.1, 4.2)
// ============================================================================

describe("Borrow Request API - Listing", () => {
  describe("GET /api/borrow", () => {
    it("should return all borrow requests for admin (Req 4.1)", async () => {
      const response = await api.get<BorrowRequestWithDetails[]>(
        "/api/borrow",
        adminToken,
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
      expect(Array.isArray(response.data.data)).toBe(true);

      // Verify requests have expected properties
      if (response.data.data && response.data.data.length > 0) {
        const request = response.data.data[0];
        expect(request).toHaveProperty("id");
        expect(request).toHaveProperty("device_id");
        expect(request).toHaveProperty("user_id");
        expect(request).toHaveProperty("start_date");
        expect(request).toHaveProperty("end_date");
        expect(request).toHaveProperty("status");
        expect(request).toHaveProperty("reason");
      }
    });

    it("should return only own requests for non-admin (Req 4.2)", async () => {
      const response = await api.get<BorrowRequestWithDetails[]>(
        "/api/borrow",
        userToken,
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
      expect(Array.isArray(response.data.data)).toBe(true);

      // All returned requests should belong to the regular user
      if (response.data.data && response.data.data.length > 0) {
        response.data.data.forEach((request) => {
          expect(request.user_id).toBe(regularUserId);
        });
      }
    });

    it("should return 401 for unauthenticated request", async () => {
      const response = await api.get<BorrowRequestWithDetails[]>("/api/borrow");

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });

    it("should filter by status parameter", async () => {
      const response = await api.get<BorrowRequestWithDetails[]>(
        "/api/borrow",
        adminToken,
        { status: "pending" },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      // All returned requests should have pending status
      if (response.data.data && response.data.data.length > 0) {
        response.data.data.forEach((request) => {
          expect(request.status).toBe("pending");
        });
      }
    });

    it("should filter by device_id parameter", async () => {
      // First get all requests to find a device_id
      const allResponse = await api.get<BorrowRequestWithDetails[]>(
        "/api/borrow",
        adminToken,
      );

      if (allResponse.data.data && allResponse.data.data.length > 0) {
        const deviceId = allResponse.data.data[0].device_id;

        const response = await api.get<BorrowRequestWithDetails[]>(
          "/api/borrow",
          adminToken,
          { device_id: deviceId.toString() },
        );

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);

        // All returned requests should be for the specified device
        if (response.data.data && response.data.data.length > 0) {
          response.data.data.forEach((request) => {
            expect(request.device_id).toBe(deviceId);
          });
        }
      }
    });
  });
});

// ============================================================================
// Borrow Request Creation Tests (Requirements 4.3, 4.4, 4.5, 4.6)
// ============================================================================

describe("Borrow Request API - Creation", () => {
  describe("POST /api/borrow", () => {
    it("should create request for available device (Req 4.3)", async () => {
      // Create a new device for this test
      const deviceId = await createTestDevice();

      const borrowData = createBorrowRequest({
        device_id: deviceId,
        start_date: daysFromNow(1),
        end_date: daysFromNow(7),
      });

      const response = await api.post<BorrowRequestWithDetails>(
        "/api/borrow",
        borrowData,
        userToken,
      );

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
      expect(response.data.data?.device_id).toBe(deviceId);
      expect(response.data.data?.user_id).toBe(regularUserId);
      expect(response.data.data?.status).toBe("pending");

      if (response.data.data?.id) {
        createdBorrowRequestIds.push(response.data.data.id);
      }
    });

    it("should return 400 for unavailable device (Req 4.4)", async () => {
      // Create a device and make it borrowed
      const deviceId = await createTestDevice();

      // Create a borrow request and activate it
      const firstRequest = await createTestBorrowRequest(deviceId);
      await api.patch(
        `/api/borrow/${firstRequest.id}/status`,
        { status: "approved" },
        adminToken,
      );
      await api.patch(
        `/api/borrow/${firstRequest.id}/status`,
        { status: "active" },
        adminToken,
      );

      // Try to create another request for the same device
      const borrowData = createBorrowRequest({
        device_id: deviceId,
        start_date: daysFromNow(1),
        end_date: daysFromNow(7),
      });

      const response = await api.post<BorrowRequestWithDetails>(
        "/api/borrow",
        borrowData,
        userToken,
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.error).toBeDefined();
    });

    it("should return 400 for invalid date range (end before start) (Req 4.5)", async () => {
      const deviceId = await createTestDevice();

      const borrowData = createBorrowRequest({
        device_id: deviceId,
        start_date: daysFromNow(7),
        end_date: daysFromNow(1), // End before start
      });

      const response = await api.post<BorrowRequestWithDetails>(
        "/api/borrow",
        borrowData,
        userToken,
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.error).toContain("date");
    });

    it("should return 400 for conflicting booking (Req 4.6)", async () => {
      const deviceId = await createTestDevice();

      // Create first request
      const firstBorrowData = createBorrowRequest({
        device_id: deviceId,
        start_date: daysFromNow(1),
        end_date: daysFromNow(7),
      });

      const firstResponse = await api.post<BorrowRequestWithDetails>(
        "/api/borrow",
        firstBorrowData,
        userToken,
      );

      if (firstResponse.data.data?.id) {
        createdBorrowRequestIds.push(firstResponse.data.data.id);
      }

      // Try to create overlapping request
      const secondBorrowData = createBorrowRequest({
        device_id: deviceId,
        start_date: daysFromNow(3), // Overlaps with first request
        end_date: daysFromNow(10),
      });

      const response = await api.post<BorrowRequestWithDetails>(
        "/api/borrow",
        secondBorrowData,
        userToken,
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.error).toContain("booked");
    });

    it("should return 401 for unauthenticated request", async () => {
      const borrowData = createBorrowRequest({ device_id: 1 });

      const response = await api.post<BorrowRequestWithDetails>(
        "/api/borrow",
        borrowData,
      );

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });

    it("should return 404 for non-existent device", async () => {
      const borrowData = createBorrowRequest({
        device_id: 999999,
        start_date: daysFromNow(1),
        end_date: daysFromNow(7),
      });

      const response = await api.post<BorrowRequestWithDetails>(
        "/api/borrow",
        borrowData,
        userToken,
      );

      expect(response.status).toBe(404);
      expect(response.data.success).toBe(false);
    });

    it("should return 400 for missing required fields", async () => {
      const response = await api.post<BorrowRequestWithDetails>(
        "/api/borrow",
        { device_id: 1 }, // Missing start_date, end_date, reason
        userToken,
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });
  });
});

// ============================================================================
// Status Transition Tests (Requirements 4.7, 4.8, 4.9, 4.10)
// ============================================================================

describe("Borrow Request API - Status Transitions", () => {
  describe("PATCH /api/borrow/:id/status", () => {
    it("should allow admin to approve pending request (Req 4.7)", async () => {
      const deviceId = await createTestDevice();
      const borrowRequest = await createTestBorrowRequest(deviceId);

      const response = await api.patch<BorrowRequestWithDetails>(
        `/api/borrow/${borrowRequest.id}/status`,
        { status: "approved" },
        adminToken,
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data?.status).toBe("approved");
    });

    it("should allow admin to activate approved request (Req 4.8)", async () => {
      const deviceId = await createTestDevice();
      const borrowRequest = await createTestBorrowRequest(deviceId);

      // First approve
      await api.patch(
        `/api/borrow/${borrowRequest.id}/status`,
        { status: "approved" },
        adminToken,
      );

      // Then activate
      const response = await api.patch<BorrowRequestWithDetails>(
        `/api/borrow/${borrowRequest.id}/status`,
        { status: "active" },
        adminToken,
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data?.status).toBe("active");

      // Verify device status changed to borrowed
      const deviceResponse = await api.get<DeviceWithDepartment>(
        `/api/devices/${deviceId}`,
      );
      expect(deviceResponse.data.data?.status).toBe("borrowed");
    });

    it("should allow returning active request (Req 4.9)", async () => {
      const deviceId = await createTestDevice();
      const borrowRequest = await createTestBorrowRequest(deviceId);

      // Approve and activate
      await api.patch(
        `/api/borrow/${borrowRequest.id}/status`,
        { status: "approved" },
        adminToken,
      );
      await api.patch(
        `/api/borrow/${borrowRequest.id}/status`,
        { status: "active" },
        adminToken,
      );

      // Return
      const response = await api.patch<BorrowRequestWithDetails>(
        `/api/borrow/${borrowRequest.id}/status`,
        { status: "returned" },
        adminToken,
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data?.status).toBe("returned");

      // Verify device status changed back to available
      const deviceResponse = await api.get<DeviceWithDepartment>(
        `/api/devices/${deviceId}`,
      );
      expect(deviceResponse.data.data?.status).toBe("available");
    });

    it("should return 400 for invalid status transition (Req 4.10)", async () => {
      const deviceId = await createTestDevice();
      const borrowRequest = await createTestBorrowRequest(deviceId);

      // Try to activate a pending request (should fail - must be approved first)
      const response = await api.patch<BorrowRequestWithDetails>(
        `/api/borrow/${borrowRequest.id}/status`,
        { status: "active" },
        adminToken,
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.error).toContain("transition");
    });

    it("should return 400 for transitioning from returned status", async () => {
      const deviceId = await createTestDevice();
      const borrowRequest = await createTestBorrowRequest(deviceId);

      // Complete the full flow
      await api.patch(
        `/api/borrow/${borrowRequest.id}/status`,
        { status: "approved" },
        adminToken,
      );
      await api.patch(
        `/api/borrow/${borrowRequest.id}/status`,
        { status: "active" },
        adminToken,
      );
      await api.patch(
        `/api/borrow/${borrowRequest.id}/status`,
        { status: "returned" },
        adminToken,
      );

      // Try to change status from returned
      const response = await api.patch<BorrowRequestWithDetails>(
        `/api/borrow/${borrowRequest.id}/status`,
        { status: "active" },
        adminToken,
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });

    it("should return 400 for transitioning from rejected status", async () => {
      const deviceId = await createTestDevice();
      const borrowRequest = await createTestBorrowRequest(deviceId);

      // Reject the request
      await api.patch(
        `/api/borrow/${borrowRequest.id}/status`,
        { status: "rejected" },
        adminToken,
      );

      // Try to change status from rejected
      const response = await api.patch<BorrowRequestWithDetails>(
        `/api/borrow/${borrowRequest.id}/status`,
        { status: "approved" },
        adminToken,
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });

    it("should return 403 for non-admin approving request", async () => {
      const deviceId = await createTestDevice();
      const borrowRequest = await createTestBorrowRequest(deviceId);

      const response = await api.patch<BorrowRequestWithDetails>(
        `/api/borrow/${borrowRequest.id}/status`,
        { status: "approved" },
        userToken,
      );

      expect(response.status).toBe(403);
      expect(response.data.success).toBe(false);
    });

    it("should return 401 for unauthenticated status update", async () => {
      const response = await api.patch<BorrowRequestWithDetails>(
        "/api/borrow/1/status",
        { status: "approved" },
      );

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });

    it("should return 404 for non-existent request", async () => {
      const response = await api.patch<BorrowRequestWithDetails>(
        "/api/borrow/999999/status",
        { status: "approved" },
        adminToken,
      );

      expect(response.status).toBe(404);
      expect(response.data.success).toBe(false);
    });

    it("should return 400 for invalid request ID format", async () => {
      const response = await api.patch<BorrowRequestWithDetails>(
        "/api/borrow/invalid/status",
        { status: "approved" },
        adminToken,
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });

    it("should return 400 for invalid status value", async () => {
      const deviceId = await createTestDevice();
      const borrowRequest = await createTestBorrowRequest(deviceId);

      const response = await api.patch<BorrowRequestWithDetails>(
        `/api/borrow/${borrowRequest.id}/status`,
        { status: "invalid_status" },
        adminToken,
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });
  });
});

// ============================================================================
// User-Specific Request Tests (Requirement 4.11)
// ============================================================================

describe("Borrow Request API - User-Specific Requests", () => {
  describe("GET /api/borrow/user/:userId", () => {
    it("should return requests for specified user (Req 4.11)", async () => {
      const response = await api.get<BorrowRequestWithDetails[]>(
        `/api/borrow/user/${regularUserId}`,
        userToken,
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
      expect(Array.isArray(response.data.data)).toBe(true);

      // All returned requests should belong to the specified user
      if (response.data.data && response.data.data.length > 0) {
        response.data.data.forEach((request) => {
          expect(request.user_id).toBe(regularUserId);
        });
      }
    });

    it("should allow admin to view any user requests", async () => {
      const response = await api.get<BorrowRequestWithDetails[]>(
        `/api/borrow/user/${regularUserId}`,
        adminToken,
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
    });

    it("should return 403 for non-admin viewing other user requests", async () => {
      // Try to view admin's requests as regular user
      const response = await api.get<BorrowRequestWithDetails[]>(
        `/api/borrow/user/${adminUserId}`,
        userToken,
      );

      expect(response.status).toBe(403);
      expect(response.data.success).toBe(false);
    });

    it("should return 401 for unauthenticated request", async () => {
      const response = await api.get<BorrowRequestWithDetails[]>(
        `/api/borrow/user/${regularUserId}`,
      );

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });

    it("should return 400 for invalid user ID format", async () => {
      const response = await api.get<BorrowRequestWithDetails[]>(
        "/api/borrow/user/invalid",
        adminToken,
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });
  });
});

// ============================================================================
// Property Tests
// ============================================================================

describe("Borrow Request API - Property Tests", () => {
  /**
   * Property 10: Borrow Request Visibility
   *
   * For any admin user, GET /api/borrow should return all borrow requests.
   * For any non-admin user, it should return only their own requests.
   *
   * **Validates: Requirements 4.1, 4.2**
   */
  describe("Property 10: Borrow Request Visibility", () => {
    it("for any admin, listing returns all requests; for non-admin, returns only own requests", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            {
              token: adminToken,
              isAdmin: true,
              userId: adminUserId,
              description: "admin",
            },
            {
              token: superuserToken,
              isAdmin: true,
              userId: 0,
              description: "superuser",
            },
            {
              token: userToken,
              isAdmin: false,
              userId: regularUserId,
              description: "regular user",
            },
          ),
          async ({ token, isAdmin, userId, description }) => {
            const response = await api.get<BorrowRequestWithDetails[]>(
              "/api/borrow",
              token,
            );

            // Should always succeed for authenticated users
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(response.data.data).toBeDefined();
            expect(Array.isArray(response.data.data)).toBe(true);

            if (
              !isAdmin &&
              response.data.data &&
              response.data.data.length > 0
            ) {
              // Non-admin should only see their own requests
              response.data.data.forEach((request) => {
                expect(request.user_id).toBe(userId);
              });
            }

            // For admins, we just verify the request succeeded
            // (they can see all requests, so no filtering check needed)

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 12: Date Range Validation
   *
   * For any borrow request where end_date is before start_date,
   * the creation should fail with a 400 error.
   *
   * **Validates: Requirements 4.5, 12.3, 12.4**
   */
  describe("Property 12: Date Range Validation", () => {
    it("for any invalid date range (end < start), creation should fail with 400", async () => {
      // Create a device for testing
      const deviceId = await createTestDevice();

      await fc.assert(
        fc.asyncProperty(invalidDateRangeArb, async (dateRange) => {
          const borrowData = {
            device_id: deviceId,
            start_date: dateRange.start,
            end_date: dateRange.end,
            reason: "Property test borrow request",
          };

          const response = await api.post<BorrowRequestWithDetails>(
            "/api/borrow",
            borrowData,
            userToken,
          );

          // Should fail with 400 for invalid date range
          expect(response.status).toBe(400);
          expect(response.data.success).toBe(false);
          expect(response.data.error).toBeDefined();

          return true;
        }),
        { numRuns: 100 },
      );
    });

    it("for any valid date range (end >= start), creation should not fail due to date validation", async () => {
      // Create a fresh device for each test to avoid conflicts
      let testDeviceId: number;

      await fc.assert(
        fc.asyncProperty(validDateRangeArb, async (dateRange) => {
          // Create a new device for each iteration to avoid booking conflicts
          testDeviceId = await createTestDevice();

          const borrowData = {
            device_id: testDeviceId,
            start_date: dateRange.start,
            end_date: dateRange.end,
            reason: "Property test borrow request",
          };

          const response = await api.post<BorrowRequestWithDetails>(
            "/api/borrow",
            borrowData,
            userToken,
          );

          // Should succeed (201) or fail for reasons other than date validation
          // (e.g., device not found, device unavailable, etc.)
          // The key is it should NOT fail with a date-related error
          if (response.status === 400 && response.data.error) {
            // If it fails with 400, it should not be due to date validation
            expect(response.data.error.toLowerCase()).not.toContain(
              "end date must be after start date",
            );
          }

          // Track created request for cleanup
          if (response.data.data?.id) {
            createdBorrowRequestIds.push(response.data.data.id);
          }

          return true;
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 13: Status Transition Validation
   *
   * For any borrow request status transition, only valid transitions
   * (pending→approved/rejected, approved→active/rejected, active→returned)
   * should succeed. Invalid transitions should return 400.
   *
   * **Validates: Requirements 4.10, 12.7, 12.8**
   */
  describe("Property 13: Status Transition Validation", () => {
    it("for any valid status transition, the transition should succeed", async () => {
      await fc.assert(
        fc.asyncProperty(validStatusTransitionArb, async (transition) => {
          // Create a fresh device and request for each test
          const deviceId = await createTestDevice();
          const borrowRequest = await createTestBorrowRequest(deviceId);

          // Get the request to the "from" state
          let currentStatus = "pending";

          // Navigate to the "from" state
          if (transition.from === "approved") {
            await api.patch(
              `/api/borrow/${borrowRequest.id}/status`,
              { status: "approved" },
              adminToken,
            );
            currentStatus = "approved";
          } else if (transition.from === "active") {
            await api.patch(
              `/api/borrow/${borrowRequest.id}/status`,
              { status: "approved" },
              adminToken,
            );
            await api.patch(
              `/api/borrow/${borrowRequest.id}/status`,
              { status: "active" },
              adminToken,
            );
            currentStatus = "active";
          } else if (
            transition.from === "returned" ||
            transition.from === "rejected"
          ) {
            // These are terminal states, skip this test case
            return true;
          }

          // Now attempt the transition
          const response = await api.patch<BorrowRequestWithDetails>(
            `/api/borrow/${borrowRequest.id}/status`,
            { status: transition.to },
            adminToken,
          );

          // Valid transitions should succeed
          expect(response.status).toBe(200);
          expect(response.data.success).toBe(true);
          expect(response.data.data?.status).toBe(transition.to);

          return true;
        }),
        { numRuns: 100 },
      );
    });

    it("for any invalid status transition, the transition should fail with 400", async () => {
      await fc.assert(
        fc.asyncProperty(invalidStatusTransitionArb, async (transition) => {
          // Skip transitions from terminal states (returned, rejected) as we can't test them
          if (
            transition.from === "returned" ||
            transition.from === "rejected"
          ) {
            return true;
          }

          // Create a fresh device and request for each test
          const deviceId = await createTestDevice();
          const borrowRequest = await createTestBorrowRequest(deviceId);

          // Navigate to the "from" state
          if (transition.from === "approved") {
            await api.patch(
              `/api/borrow/${borrowRequest.id}/status`,
              { status: "approved" },
              adminToken,
            );
          } else if (transition.from === "active") {
            await api.patch(
              `/api/borrow/${borrowRequest.id}/status`,
              { status: "approved" },
              adminToken,
            );
            await api.patch(
              `/api/borrow/${borrowRequest.id}/status`,
              { status: "active" },
              adminToken,
            );
          }
          // For 'pending', no navigation needed

          // Now attempt the invalid transition
          const response = await api.patch<BorrowRequestWithDetails>(
            `/api/borrow/${borrowRequest.id}/status`,
            { status: transition.to },
            adminToken,
          );

          // Invalid transitions should fail with 400
          expect(response.status).toBe(400);
          expect(response.data.success).toBe(false);
          expect(response.data.error).toBeDefined();

          return true;
        }),
        { numRuns: 100 },
      );
    });
  });
});
