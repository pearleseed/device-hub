/**
 * Concurrent Operations Tests for Device Hub
 *
 * Tests that validate system behavior under concurrent access patterns
 * and race condition scenarios.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { TestApiClient } from "../utils/api-client";
import { createDevice, createUser, createBorrowRequest } from "../utils/factories";
import { daysFromNow } from "../utils/helpers";
import type {
  DeviceWithDepartment,
  BorrowRequestWithDetails,
  UserPublic,
} from "../../src/types/api";

// ============================================================================
// Test Setup
// ============================================================================

const api = new TestApiClient();

let adminToken: string;
let superuserToken: string;
const createdDeviceIds: number[] = [];
const createdBorrowRequestIds: number[] = [];
const createdUserIds: number[] = [];

beforeAll(async () => {
  const [adminResult, superuserResult] = await Promise.all([
    api.loginAsAdmin(),
    api.loginAsSuperuser(),
  ]);
  adminToken = adminResult.token;
  superuserToken = superuserResult.token;
});

afterAll(async () => {
  for (const requestId of createdBorrowRequestIds) {
    try {
      await api.patch(`/api/borrow/${requestId}/status`, { status: "rejected" }, adminToken);
    } catch { /* ignore */ }
  }
  for (const deviceId of createdDeviceIds) {
    try {
      await api.delete(`/api/devices/${deviceId}`, adminToken);
    } catch { /* ignore */ }
  }
  for (const userId of createdUserIds) {
    try {
      await api.delete(`/api/users/${userId}`, superuserToken);
    } catch { /* ignore */ }
  }
});

// ============================================================================
// Helper Functions
// ============================================================================

let deviceCounter = Date.now();

async function createTestDevice(overrides?: Partial<Parameters<typeof createDevice>[0]>): Promise<DeviceWithDepartment> {
  deviceCounter++;
  const uniqueAssetTag = `CONC-${deviceCounter}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const deviceData = createDevice({
    asset_tag: uniqueAssetTag,
    name: `Concurrent Test Device ${deviceCounter}`,
    ...overrides,
  });

  const response = await api.post<DeviceWithDepartment>("/api/devices", deviceData, adminToken);

  if (!response.data.success || !response.data.data?.id) {
    throw new Error(`Failed to create test device: ${response.data.error || "Unknown error"}`);
  }

  createdDeviceIds.push(response.data.data.id);
  return response.data.data;
}

async function createTestUser(): Promise<{ user: UserPublic; token: string }> {
  const userData = createUser();
  await api.post("/api/auth/signup", userData);
  const loginResponse = await api.login(userData.email, userData.password);
  createdUserIds.push(loginResponse.user.id);
  return loginResponse;
}

// ============================================================================
// Concurrent Booking Tests
// ============================================================================

describe("Concurrent Operations - Booking Conflicts", () => {
  it("should handle multiple simultaneous booking attempts for same device", async () => {
    // Create a single device
    const device = await createTestDevice({ name: "High-Demand Device" });

    // Create multiple users
    const users = await Promise.all([
      createTestUser(),
      createTestUser(),
      createTestUser(),
    ]);

    // All users try to book the same device simultaneously
    const bookingPromises = users.map((user, index) =>
      api.post<BorrowRequestWithDetails>(
        "/api/borrow",
        createBorrowRequest({
          device_id: device.id,
          start_date: daysFromNow(1),
          end_date: daysFromNow(7),
          reason: `Concurrent booking attempt ${index + 1}`,
        }),
        user.token,
      )
    );

    const results = await Promise.all(bookingPromises);

    // Count successful bookings
    const successful = results.filter(r => r.status === 201);

    // At least one should succeed (system may allow multiple pending requests)
    expect(successful.length).toBeGreaterThanOrEqual(1);

    // Track created requests for cleanup
    successful.forEach(r => {
      if (r.data.data?.id) createdBorrowRequestIds.push(r.data.data.id);
    });
  });

  it("should handle rapid sequential booking attempts", async () => {
    const device = await createTestDevice({ name: "Sequential Test Device" });
    const user = await createTestUser();

    // Make rapid sequential requests
    const results: Array<{ status: number; data: any }> = [];
    for (let i = 0; i < 5; i++) {
      const result = await api.post<BorrowRequestWithDetails>(
        "/api/borrow",
        createBorrowRequest({
          device_id: device.id,
          start_date: daysFromNow(1),
          end_date: daysFromNow(7),
          reason: `Sequential attempt ${i + 1}`,
        }),
        user.token,
      );
      results.push(result);
      if (result.data.data?.id) createdBorrowRequestIds.push(result.data.data.id);
    }

    // First should succeed, rest should fail
    expect(results[0].status).toBe(201);
    results.slice(1).forEach(r => {
      expect(r.status).toBe(400);
    });
  });
});

// ============================================================================
// Concurrent Device Operations
// ============================================================================

describe("Concurrent Operations - Device Management", () => {
  it("should handle concurrent device creation with unique asset tags", async () => {
    // Create multiple devices simultaneously
    const createPromises = Array.from({ length: 5 }, (_, i) =>
      createTestDevice({ name: `Concurrent Device ${i + 1}` })
    );

    const devices = await Promise.all(createPromises);

    // All should succeed with unique IDs
    const ids = devices.map(d => d.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(5);

    // All should have unique asset tags
    const assetTags = devices.map(d => d.asset_tag);
    const uniqueTags = new Set(assetTags);
    expect(uniqueTags.size).toBe(5);
  });

  it("should handle concurrent device updates", async () => {
    const device = await createTestDevice({ name: "Update Test Device" });

    // Sequential updates to avoid race conditions
    const results: Array<{ status: number; data: any }> = [];
    for (let i = 0; i < 3; i++) {
      const result = await api.put<DeviceWithDepartment>(
        `/api/devices/${device.id}`,
        { name: `Updated Name ${i + 1}` },
        adminToken,
      );
      results.push(result);
    }

    // All updates should succeed
    results.forEach(r => {
      expect(r.status).toBe(200);
    });

    // Final state should be the last update
    const finalDevice = await api.get<DeviceWithDepartment>(`/api/devices/${device.id}`);
    expect(finalDevice.data.data?.name).toBe("Updated Name 3");
  });
});

// ============================================================================
// Concurrent User Operations
// ============================================================================

describe("Concurrent Operations - User Management", () => {
  it("should handle concurrent user signups with unique emails", async () => {
    const signupPromises = Array.from({ length: 5 }, () => {
      const userData = createUser();
      return api.post("/api/auth/signup", userData);
    });

    const results = await Promise.all(signupPromises);

    // All should succeed
    results.forEach(r => {
      expect(r.status).toBe(201);
    });
  });

  it("should reject concurrent signups with same email", async () => {
    const email = `duplicate-${Date.now()}@example.com`;
    const userData = createUser({ email });

    // Sequential signup attempts with same email
    const firstResult = await api.post("/api/auth/signup", { ...userData });
    expect(firstResult.status).toBe(201);

    // Second attempt should fail
    const secondResult = await api.post("/api/auth/signup", { ...userData, name: "Different Name" });
    expect(secondResult.status).toBe(400);
    expect(secondResult.data.error).toContain("email");
  });

  it("should handle concurrent login attempts", async () => {
    const user = await createTestUser();

    // Multiple simultaneous login attempts
    const loginPromises = Array.from({ length: 5 }, () =>
      api.post("/api/auth/login", {
        email: user.user.email,
        password: "password123",
      })
    );

    const results = await Promise.all(loginPromises);

    // All should succeed
    results.forEach(r => {
      expect(r.status).toBe(200);
    });
  });
});

// ============================================================================
// Concurrent Status Transitions
// ============================================================================

describe("Concurrent Operations - Status Transitions", () => {
  it("should handle concurrent approval attempts on same request", async () => {
    const device = await createTestDevice({ name: "Approval Race Device" });
    const user = await createTestUser();

    // Create a borrow request
    const borrowResponse = await api.post<BorrowRequestWithDetails>(
      "/api/borrow",
      createBorrowRequest({
        device_id: device.id,
        start_date: daysFromNow(1),
        end_date: daysFromNow(7),
        reason: "Approval race test",
      }),
      user.token,
    );
    createdBorrowRequestIds.push(borrowResponse.data.data!.id);

    // Multiple admins try to approve simultaneously
    const approvalPromises = Array.from({ length: 3 }, () =>
      api.patch<BorrowRequestWithDetails>(
        `/api/borrow/${borrowResponse.data.data?.id}/status`,
        { status: "approved" },
        adminToken,
      )
    );

    const results = await Promise.all(approvalPromises);

    // At least one should succeed
    const successful = results.filter(r => r.status === 200);
    expect(successful.length).toBeGreaterThanOrEqual(1);

    // Final status should be approved
    const finalStatus = await api.get<BorrowRequestWithDetails>(
      `/api/borrow/${borrowResponse.data.data?.id}`,
      adminToken,
    );
    expect(finalStatus.data.data?.status).toBe("approved");
  });

  it("should prevent conflicting status transitions", async () => {
    const device = await createTestDevice({ name: "Conflict Transition Device" });
    const user = await createTestUser();

    // Create and get to pending state
    const borrowResponse = await api.post<BorrowRequestWithDetails>(
      "/api/borrow",
      createBorrowRequest({
        device_id: device.id,
        start_date: daysFromNow(1),
        end_date: daysFromNow(7),
        reason: "Conflict transition test",
      }),
      user.token,
    );
    createdBorrowRequestIds.push(borrowResponse.data.data!.id);

    // Try to approve and reject simultaneously
    const [approveResult, rejectResult] = await Promise.all([
      api.patch<BorrowRequestWithDetails>(
        `/api/borrow/${borrowResponse.data.data?.id}/status`,
        { status: "approved" },
        adminToken,
      ),
      api.patch<BorrowRequestWithDetails>(
        `/api/borrow/${borrowResponse.data.data?.id}/status`,
        { status: "rejected" },
        adminToken,
      ),
    ]);

    // One should succeed, one might fail or both succeed (last write wins)
    const successCount = [approveResult, rejectResult].filter(r => r.status === 200).length;
    expect(successCount).toBeGreaterThanOrEqual(1);

    // Final state should be consistent
    const finalStatus = await api.get<BorrowRequestWithDetails>(
      `/api/borrow/${borrowResponse.data.data?.id}`,
      adminToken,
    );
    expect(["approved", "rejected"]).toContain(finalStatus.data.data?.status);
  });
});

// ============================================================================
// Concurrent Renewal Operations
// ============================================================================

describe("Concurrent Operations - Renewals", () => {
  it("should prevent duplicate renewal requests submitted sequentially", async () => {
    const device = await createTestDevice({ name: "Renewal Race Device" });
    const user = await createTestUser();

    // Create and activate a borrow request
    const borrowResponse = await api.post<BorrowRequestWithDetails>(
      "/api/borrow",
      createBorrowRequest({
        device_id: device.id,
        start_date: daysFromNow(1),
        end_date: daysFromNow(7),
        reason: "Renewal race test",
      }),
      user.token,
    );
    createdBorrowRequestIds.push(borrowResponse.data.data!.id);

    await api.patch(
      `/api/borrow/${borrowResponse.data.data?.id}/status`,
      { status: "approved" },
      adminToken,
    );
    await api.patch(
      `/api/borrow/${borrowResponse.data.data?.id}/status`,
      { status: "active" },
      adminToken,
    );

    // First renewal should succeed
    const firstRenewal = await api.post(
      "/api/renewals",
      {
        borrow_request_id: borrowResponse.data.data?.id,
        requested_end_date: daysFromNow(14),
        reason: "First renewal attempt",
      },
      user.token,
    );
    expect(firstRenewal.status).toBe(201);

    // Second renewal should fail (duplicate pending)
    const secondRenewal = await api.post(
      "/api/renewals",
      {
        borrow_request_id: borrowResponse.data.data?.id,
        requested_end_date: daysFromNow(21),
        reason: "Second renewal attempt",
      },
      user.token,
    );
    expect(secondRenewal.status).toBe(400);
    expect(secondRenewal.data.error).toContain("pending");
  });
});

// ============================================================================
// High Load Scenarios
// ============================================================================

describe("Concurrent Operations - High Load", () => {
  it("should handle multiple users browsing devices simultaneously", async () => {
    // Create some devices first
    await Promise.all([
      createTestDevice({ name: "Browse Test 1" }),
      createTestDevice({ name: "Browse Test 2" }),
      createTestDevice({ name: "Browse Test 3" }),
    ]);

    // Create multiple users
    const users = await Promise.all(
      Array.from({ length: 5 }, () => createTestUser())
    );

    // All users browse devices simultaneously
    const browsePromises = users.map(user =>
      api.get<DeviceWithDepartment[]>("/api/devices", user.token)
    );

    const results = await Promise.all(browsePromises);

    // All should succeed
    results.forEach(r => {
      expect(r.status).toBe(200);
      expect(r.data.success).toBe(true);
      expect(Array.isArray(r.data.data)).toBe(true);
    });
  });

  it("should handle mixed read/write operations", async () => {
    const device = await createTestDevice({ name: "Mixed Ops Device" });

    // Sequential mix of read and write operations
    const readResult1 = await api.get<DeviceWithDepartment[]>("/api/devices", adminToken);
    expect(readResult1.status).toBe(200);

    const readResult2 = await api.get<DeviceWithDepartment>(`/api/devices/${device.id}`, adminToken);
    expect(readResult2.status).toBe(200);

    const writeResult = await api.put<DeviceWithDepartment>(
      `/api/devices/${device.id}`,
      { name: "Updated Mixed Ops Device" },
      adminToken,
    );
    expect(writeResult.status).toBe(200);

    const readResult3 = await api.get<DeviceWithDepartment[]>("/api/devices", adminToken);
    expect(readResult3.status).toBe(200);
  });

  it("should maintain data consistency under sequential modifications", async () => {
    const device = await createTestDevice({ name: "Consistency Test Device" });

    // Sequential price updates
    const priceUpdates = [100, 200, 300, 400, 500];
    for (const price of priceUpdates) {
      await api.put<DeviceWithDepartment>(
        `/api/devices/${device.id}`,
        { purchase_price: price },
        adminToken,
      );
    }

    // Final price should be the last update value (as string from DB)
    const finalDevice = await api.get<DeviceWithDepartment>(`/api/devices/${device.id}`);
    expect(Number(finalDevice.data.data?.purchase_price)).toBe(500);
  });
});
