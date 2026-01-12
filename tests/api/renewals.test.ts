/**
 * Renewal Request API Tests
 *
 * Tests for renewal request endpoints including listing, creation,
 * status updates, and date validation.
 *
 * Requirements: 6.1-6.9
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fc from "fast-check";
import { TestApiClient } from "../utils/api-client";
import {
  createDevice,
  createBorrowRequest,
  createRenewalRequest,
} from "../utils/factories";
import { daysFromNow } from "../utils/helpers";
import type {
  RenewalRequestWithDetails,
  BorrowRequestWithDetails,
  DeviceWithDepartment,
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

let deviceCounter = Date.now();

/**
 * Create a test device and return its ID
 */
async function createTestDevice(): Promise<number> {
  deviceCounter++;
  const uniqueAssetTag = `REN-${deviceCounter}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const deviceData = createDevice({
    asset_tag: uniqueAssetTag,
    name: `Renewal Test Device ${deviceCounter}`,
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
): Promise<BorrowRequestWithDetails> {
  const borrowData = createBorrowRequest({
    device_id: deviceId,
    start_date: daysFromNow(1),
    end_date: daysFromNow(7),
    reason: "Test borrow request for renewal testing",
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

/**
 * Create an active borrow request (approved and activated)
 */
async function createActiveBorrowRequest(
  deviceId: number,
  token: string = userToken,
): Promise<BorrowRequestWithDetails> {
  const borrowRequest = await createTestBorrowRequest(deviceId, token);

  // Approve the request
  await api.patch(
    `/api/borrow/${borrowRequest.id}/status`,
    { status: "approved" },
    adminToken,
  );

  // Activate the request
  const activateResponse = await api.patch<BorrowRequestWithDetails>(
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
// Renewal Request Listing Tests (Requirements 6.1, 6.2)
// ============================================================================

describe("Renewal Request API - Listing", () => {
  describe("GET /api/renewals", () => {
    it("should return all renewal requests for admin (Req 6.1)", async () => {
      const response = await api.get<RenewalRequestWithDetails[]>(
        "/api/renewals",
        adminToken,
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
      expect(Array.isArray(response.data.data)).toBe(true);

      // Verify renewals have expected properties
      if (response.data.data && response.data.data.length > 0) {
        const renewal = response.data.data[0];
        expect(renewal).toHaveProperty("id");
        expect(renewal).toHaveProperty("borrow_request_id");
        expect(renewal).toHaveProperty("user_id");
        expect(renewal).toHaveProperty("current_end_date");
        expect(renewal).toHaveProperty("requested_end_date");
        expect(renewal).toHaveProperty("reason");
        expect(renewal).toHaveProperty("status");
      }
    });

    it("should return only own renewals for non-admin (Req 6.2)", async () => {
      const response = await api.get<RenewalRequestWithDetails[]>(
        "/api/renewals",
        userToken,
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
      expect(Array.isArray(response.data.data)).toBe(true);

      // All returned requests should belong to the regular user
      if (response.data.data && response.data.data.length > 0) {
        response.data.data.forEach((renewal) => {
          expect(renewal.user_id).toBe(regularUserId);
        });
      }
    });

    it("should return 401 for unauthenticated request", async () => {
      const response =
        await api.get<RenewalRequestWithDetails[]>("/api/renewals");

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });

    it("should filter by status parameter", async () => {
      const response = await api.get<RenewalRequestWithDetails[]>(
        "/api/renewals",
        adminToken,
        { status: "pending" },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      // All returned requests should have pending status
      if (response.data.data && response.data.data.length > 0) {
        response.data.data.forEach((renewal) => {
          expect(renewal.status).toBe("pending");
        });
      }
    });
  });
});

// ============================================================================
// Renewal Request Creation Tests (Requirements 6.3, 6.4, 6.5, 6.6, 6.7)
// ============================================================================

describe("Renewal Request API - Creation", () => {
  describe("POST /api/renewals", () => {
    it("should create renewal for active loan (Req 6.3)", async () => {
      // Create a device and an active borrow request
      const deviceId = await createTestDevice();
      const borrowRequest = await createActiveBorrowRequest(deviceId);

      const renewalData = createRenewalRequest({
        borrow_request_id: borrowRequest.id,
        requested_end_date: daysFromNow(14), // Extend by 7 more days
        reason: "Need more time to complete testing",
      });

      const response = await api.post<RenewalRequestWithDetails>(
        "/api/renewals",
        renewalData,
        userToken,
      );

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
      expect(response.data.data?.borrow_request_id).toBe(borrowRequest.id);
      expect(response.data.data?.user_id).toBe(regularUserId);
      expect(response.data.data?.status).toBe("pending");
    });

    it("should return 400 for non-active loan (Req 6.4)", async () => {
      // Create a device and a pending borrow request (not active)
      const deviceId = await createTestDevice();
      const borrowRequest = await createTestBorrowRequest(deviceId);

      const renewalData = createRenewalRequest({
        borrow_request_id: borrowRequest.id,
        requested_end_date: daysFromNow(14),
        reason: "Need more time",
      });

      const response = await api.post<RenewalRequestWithDetails>(
        "/api/renewals",
        renewalData,
        userToken,
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.error).toContain("active");
    });

    it("should return 403 for another user's loan (Req 6.5)", async () => {
      // Create a device and an active borrow request as admin
      const deviceId = await createTestDevice();

      // Create borrow request as admin
      const borrowData = createBorrowRequest({
        device_id: deviceId,
        start_date: daysFromNow(1),
        end_date: daysFromNow(7),
        reason: "Admin borrow request",
      });

      const borrowResponse = await api.post<BorrowRequestWithDetails>(
        "/api/borrow",
        borrowData,
        adminToken,
      );

      if (borrowResponse.data.data?.id) {
        createdBorrowRequestIds.push(borrowResponse.data.data.id);

        // Approve and activate
        await api.patch(
          `/api/borrow/${borrowResponse.data.data.id}/status`,
          { status: "approved" },
          adminToken,
        );
        await api.patch(
          `/api/borrow/${borrowResponse.data.data.id}/status`,
          { status: "active" },
          adminToken,
        );

        // Try to create renewal as regular user (not the borrower)
        const renewalData = createRenewalRequest({
          borrow_request_id: borrowResponse.data.data.id,
          requested_end_date: daysFromNow(14),
          reason: "Need more time",
        });

        const response = await api.post<RenewalRequestWithDetails>(
          "/api/renewals",
          renewalData,
          userToken,
        );

        expect(response.status).toBe(403);
        expect(response.data.success).toBe(false);
      }
    });

    it("should return 400 for invalid date (requested_end_date not after current_end_date) (Req 6.6)", async () => {
      // Create a device and an active borrow request
      const deviceId = await createTestDevice();
      const borrowRequest = await createActiveBorrowRequest(deviceId);

      // Try to create renewal with date before or equal to current end date
      const renewalData = createRenewalRequest({
        borrow_request_id: borrowRequest.id,
        requested_end_date: daysFromNow(5), // Before the current end date (day 7)
        reason: "Need more time",
      });

      const response = await api.post<RenewalRequestWithDetails>(
        "/api/renewals",
        renewalData,
        userToken,
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.error).toContain("after");
    });

    it("should return 400 for duplicate pending renewal (Req 6.7)", async () => {
      // Create a device and an active borrow request
      const deviceId = await createTestDevice();
      const borrowRequest = await createActiveBorrowRequest(deviceId);

      // Create first renewal request
      const renewalData = createRenewalRequest({
        borrow_request_id: borrowRequest.id,
        requested_end_date: daysFromNow(14),
        reason: "First renewal request",
      });

      const firstResponse = await api.post<RenewalRequestWithDetails>(
        "/api/renewals",
        renewalData,
        userToken,
      );
      expect(firstResponse.status).toBe(201);

      // Try to create duplicate renewal request
      const duplicateData = createRenewalRequest({
        borrow_request_id: borrowRequest.id,
        requested_end_date: daysFromNow(21),
        reason: "Second renewal request",
      });

      const duplicateResponse = await api.post<RenewalRequestWithDetails>(
        "/api/renewals",
        duplicateData,
        userToken,
      );

      expect(duplicateResponse.status).toBe(400);
      expect(duplicateResponse.data.success).toBe(false);
      expect(duplicateResponse.data.error).toContain("pending");
    });

    it("should return 401 for unauthenticated request", async () => {
      const renewalData = createRenewalRequest({ borrow_request_id: 1 });

      const response = await api.post<RenewalRequestWithDetails>(
        "/api/renewals",
        renewalData,
      );

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });

    it("should return 404 for non-existent borrow request", async () => {
      const renewalData = createRenewalRequest({
        borrow_request_id: 999999,
        requested_end_date: daysFromNow(14),
        reason: "Need more time",
      });

      const response = await api.post<RenewalRequestWithDetails>(
        "/api/renewals",
        renewalData,
        userToken,
      );

      expect(response.status).toBe(404);
      expect(response.data.success).toBe(false);
    });

    it("should return 400 for missing required fields", async () => {
      const response = await api.post<RenewalRequestWithDetails>(
        "/api/renewals",
        { borrow_request_id: 1 }, // Missing requested_end_date and reason
        userToken,
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });
  });
});

// ============================================================================
// Renewal Status Tests (Requirements 6.8, 6.9)
// ============================================================================

describe("Renewal Request API - Status Updates", () => {
  describe("PATCH /api/renewals/:id/status", () => {
    it("should update borrow end date when admin approves renewal (Req 6.8)", async () => {
      // Create a device and an active borrow request
      const deviceId = await createTestDevice();
      const borrowRequest = await createActiveBorrowRequest(deviceId);

      const newEndDate = daysFromNow(14);

      // Create renewal request
      const renewalData = createRenewalRequest({
        borrow_request_id: borrowRequest.id,
        requested_end_date: newEndDate,
        reason: "Need more time to complete testing",
      });

      const renewalResponse = await api.post<RenewalRequestWithDetails>(
        "/api/renewals",
        renewalData,
        userToken,
      );
      expect(renewalResponse.status).toBe(201);

      const renewalId = renewalResponse.data.data?.id;

      // Admin approves the renewal
      const approveResponse = await api.patch<RenewalRequestWithDetails>(
        `/api/renewals/${renewalId}/status`,
        { status: "approved" },
        adminToken,
      );

      expect(approveResponse.status).toBe(200);
      expect(approveResponse.data.success).toBe(true);
      expect(approveResponse.data.data?.status).toBe("approved");

      // Verify borrow request end date was updated
      const borrowResponse = await api.get<BorrowRequestWithDetails>(
        `/api/borrow/${borrowRequest.id}`,
        userToken,
      );

      // Get the original end date from the borrow request
      const originalEndDate = new Date(borrowRequest.end_date);
      const updatedEndDate = new Date(
        borrowResponse.data.data?.end_date as unknown as string,
      );

      // The updated end date should be after the original end date
      expect(updatedEndDate.getTime()).toBeGreaterThan(
        originalEndDate.getTime(),
      );
    });

    it("should not change borrow end date when admin rejects renewal (Req 6.9)", async () => {
      // Create a device and an active borrow request
      const deviceId = await createTestDevice();
      const borrowRequest = await createActiveBorrowRequest(deviceId);

      // Store original end date
      const originalEndDate = new Date(borrowRequest.end_date)
        .toISOString()
        .split("T")[0];

      // Create renewal request
      const renewalData = createRenewalRequest({
        borrow_request_id: borrowRequest.id,
        requested_end_date: daysFromNow(14),
        reason: "Need more time to complete testing",
      });

      const renewalResponse = await api.post<RenewalRequestWithDetails>(
        "/api/renewals",
        renewalData,
        userToken,
      );
      expect(renewalResponse.status).toBe(201);

      const renewalId = renewalResponse.data.data?.id;

      // Admin rejects the renewal
      const rejectResponse = await api.patch<RenewalRequestWithDetails>(
        `/api/renewals/${renewalId}/status`,
        { status: "rejected" },
        adminToken,
      );

      expect(rejectResponse.status).toBe(200);
      expect(rejectResponse.data.success).toBe(true);
      expect(rejectResponse.data.data?.status).toBe("rejected");

      // Verify borrow request end date was NOT changed
      const borrowResponse = await api.get<BorrowRequestWithDetails>(
        `/api/borrow/${borrowRequest.id}`,
        userToken,
      );

      const currentEndDate = new Date(
        borrowResponse.data.data?.end_date as unknown as string,
      )
        .toISOString()
        .split("T")[0];
      expect(currentEndDate).toBe(originalEndDate);
    });

    it("should return 403 for non-admin updating status", async () => {
      // Create a device and an active borrow request
      const deviceId = await createTestDevice();
      const borrowRequest = await createActiveBorrowRequest(deviceId);

      // Create renewal request
      const renewalData = createRenewalRequest({
        borrow_request_id: borrowRequest.id,
        requested_end_date: daysFromNow(14),
        reason: "Need more time",
      });

      const renewalResponse = await api.post<RenewalRequestWithDetails>(
        "/api/renewals",
        renewalData,
        userToken,
      );
      expect(renewalResponse.status).toBe(201);

      const renewalId = renewalResponse.data.data?.id;

      // Regular user tries to approve
      const response = await api.patch<RenewalRequestWithDetails>(
        `/api/renewals/${renewalId}/status`,
        { status: "approved" },
        userToken,
      );

      expect(response.status).toBe(403);
      expect(response.data.success).toBe(false);
    });

    it("should return 401 for unauthenticated status update", async () => {
      const response = await api.patch<RenewalRequestWithDetails>(
        "/api/renewals/1/status",
        { status: "approved" },
      );

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });

    it("should return 404 for non-existent renewal request", async () => {
      const response = await api.patch<RenewalRequestWithDetails>(
        "/api/renewals/999999/status",
        { status: "approved" },
        adminToken,
      );

      expect(response.status).toBe(404);
      expect(response.data.success).toBe(false);
    });

    it("should return 400 for invalid renewal ID format", async () => {
      const response = await api.patch<RenewalRequestWithDetails>(
        "/api/renewals/invalid/status",
        { status: "approved" },
        adminToken,
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });

    it("should return 400 for invalid status value", async () => {
      // Create a device and an active borrow request
      const deviceId = await createTestDevice();
      const borrowRequest = await createActiveBorrowRequest(deviceId);

      // Create renewal request
      const renewalData = createRenewalRequest({
        borrow_request_id: borrowRequest.id,
        requested_end_date: daysFromNow(14),
        reason: "Need more time",
      });

      const renewalResponse = await api.post<RenewalRequestWithDetails>(
        "/api/renewals",
        renewalData,
        userToken,
      );
      expect(renewalResponse.status).toBe(201);

      const renewalId = renewalResponse.data.data?.id;

      const response = await api.patch<RenewalRequestWithDetails>(
        `/api/renewals/${renewalId}/status`,
        { status: "invalid_status" },
        adminToken,
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });

    it("should return 400 for updating non-pending renewal", async () => {
      // Create a device and an active borrow request
      const deviceId = await createTestDevice();
      const borrowRequest = await createActiveBorrowRequest(deviceId);

      // Create renewal request
      const renewalData = createRenewalRequest({
        borrow_request_id: borrowRequest.id,
        requested_end_date: daysFromNow(14),
        reason: "Need more time",
      });

      const renewalResponse = await api.post<RenewalRequestWithDetails>(
        "/api/renewals",
        renewalData,
        userToken,
      );
      expect(renewalResponse.status).toBe(201);

      const renewalId = renewalResponse.data.data?.id;

      // First approve it
      await api.patch(
        `/api/renewals/${renewalId}/status`,
        { status: "approved" },
        adminToken,
      );

      // Try to change status again
      const response = await api.patch<RenewalRequestWithDetails>(
        `/api/renewals/${renewalId}/status`,
        { status: "rejected" },
        adminToken,
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.error).toContain("pending");
    });
  });
});

// ============================================================================
// Property Tests
// ============================================================================

describe("Renewal Request API - Property Tests", () => {
  /**
   * Property 16: Renewal Request Visibility
   *
   * For any admin user, GET /api/renewals should return all renewal requests.
   * For any non-admin user, it should return only their own renewals.
   *
   * **Validates: Requirements 6.1, 6.2**
   */
  describe("Property 16: Renewal Request Visibility", () => {
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
            const response = await api.get<RenewalRequestWithDetails[]>(
              "/api/renewals",
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
              // Non-admin should only see their own renewals
              response.data.data.forEach((renewal) => {
                expect(renewal.user_id).toBe(userId);
              });
            }

            // For admins, we just verify the request succeeded
            // (they can see all renewals, so no filtering check needed)

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 17: Renewal Date Validation
   *
   * For any renewal request where requested_end_date is not after current_end_date,
   * the creation should fail with a 400 error.
   *
   * **Validates: Requirements 6.6**
   */
  describe("Property 17: Renewal Date Validation", () => {
    it("for any requested_end_date not after current_end_date, creation should fail with 400", async () => {
      // Create a device and active borrow request for testing
      const deviceId = await createTestDevice();
      const borrowRequest = await createActiveBorrowRequest(deviceId);

      // Get the current end date from the borrow request
      const currentEndDate = new Date(borrowRequest.end_date);

      await fc.assert(
        fc.asyncProperty(
          // Generate dates that are on or before the current end date
          fc.integer({ min: -30, max: 0 }), // Days relative to current end date (0 = same day, negative = before)
          async (daysOffset) => {
            // Calculate the invalid requested end date
            const invalidEndDate = new Date(currentEndDate);
            invalidEndDate.setDate(invalidEndDate.getDate() + daysOffset);
            const invalidEndDateStr = invalidEndDate
              .toISOString()
              .split("T")[0];

            const renewalData = {
              borrow_request_id: borrowRequest.id,
              requested_end_date: invalidEndDateStr,
              reason: "Property test renewal request",
            };

            const response = await api.post<RenewalRequestWithDetails>(
              "/api/renewals",
              renewalData,
              userToken,
            );

            // Should fail with 400 for invalid date (not after current end date)
            // OR 400 for duplicate pending renewal (if a previous iteration created one)
            expect(response.status).toBe(400);
            expect(response.data.success).toBe(false);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("for any requested_end_date after current_end_date, creation should not fail due to date validation", async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate positive day offsets (1 to 90 days after current end date)
          fc.integer({ min: 1, max: 90 }),
          async (daysAfterEnd) => {
            // Create a fresh device and borrow request for each iteration to avoid duplicate renewal errors
            const deviceId = await createTestDevice();
            const borrowRequest = await createActiveBorrowRequest(deviceId);

            // Get the current end date from the borrow request
            const currentEndDate = new Date(borrowRequest.end_date);

            // Calculate a valid requested end date (after current end date)
            const validEndDate = new Date(currentEndDate);
            validEndDate.setDate(validEndDate.getDate() + daysAfterEnd);
            const validEndDateStr = validEndDate.toISOString().split("T")[0];

            const renewalData = {
              borrow_request_id: borrowRequest.id,
              requested_end_date: validEndDateStr,
              reason: "Property test renewal request",
            };

            const response = await api.post<RenewalRequestWithDetails>(
              "/api/renewals",
              renewalData,
              userToken,
            );

            // Should succeed (201) - valid date after current end date
            expect(response.status).toBe(201);
            expect(response.data.success).toBe(true);
            expect(response.data.data?.status).toBe("pending");

            return true;
          },
        ),
        // Reduced iterations since each creates a device + borrow request + renewal
        { numRuns: 20 },
      );
    }, 60000); // 60 second timeout for this property test
  });
});
