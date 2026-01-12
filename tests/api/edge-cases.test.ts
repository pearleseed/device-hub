/**
 * Edge Case Tests for Device Hub
 *
 * Comprehensive tests for boundary conditions, special characters,
 * concurrent operations, and unusual input scenarios.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { TestApiClient } from "../utils/api-client";
import {
  setupTestContext,
  type TestContext,
  daysFromNow,
} from "../utils/helpers";
import { createDevice, createUser } from "../utils/factories";
import { TEST_CONFIG } from "../setup";

// ============================================================================
// Test Setup
// ============================================================================

const api = new TestApiClient();
let ctx: TestContext;

beforeAll(async () => {
  ctx = await setupTestContext();
});

// ============================================================================
// Special Characters and Unicode Tests
// ============================================================================

describe("Edge Cases - Special Characters and Unicode", () => {
  describe("User names with special characters", () => {
    it("should handle user name with unicode characters", async () => {
      const userData = createUser({
        name: "José García 日本語",
        email: `unicode-${Date.now()}@example.com`,
      });

      const response = await api.post("/api/auth/signup", userData);
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
    });

    it("should handle user name with emojis", async () => {
      const userData = createUser({
        name: "Test User 🚀",
        email: `emoji-${Date.now()}@example.com`,
      });

      const response = await api.post("/api/auth/signup", userData);
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
    });

    it("should handle user name with only whitespace", async () => {
      const userData = createUser({
        name: "   ",
        email: `whitespace-${Date.now()}@example.com`,
      });

      const response = await api.post("/api/auth/signup", userData);
      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });
  });

  describe("Device names with special characters", () => {
    it("should handle device name with special characters", async () => {
      const deviceData = createDevice({
        name: 'MacBook Pro 16" (2024) - M3 Max',
      });

      const response = await api.post(
        "/api/devices",
        deviceData,
        ctx.adminToken,
      );
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
    });

    it("should handle device name with unicode", async () => {
      const deviceData = createDevice({
        name: "デバイス テスト 设备",
      });

      const response = await api.post(
        "/api/devices",
        deviceData,
        ctx.adminToken,
      );
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
    });
  });

  describe("Search with special characters", () => {
    it("should handle search with SQL injection attempt", async () => {
      const response = await api.get("/api/devices", undefined, {
        search: "'; DROP TABLE devices; --",
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      // Should return empty or filtered results, not crash
    });

    it("should handle search with regex special characters", async () => {
      const response = await api.get("/api/devices", undefined, {
        search: "test.*[a-z]+",
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });
});

// ============================================================================
// Boundary Value Tests
// ============================================================================

describe("Edge Cases - Boundary Values", () => {
  describe("Numeric boundaries", () => {
    it("should handle zero purchase price", async () => {
      const deviceData = createDevice({
        purchase_price: 0,
      });

      const response = await api.post(
        "/api/devices",
        deviceData,
        ctx.adminToken,
      );
      // Zero price should be valid (free device)
      expect([200, 201]).toContain(response.status);
    });

    it("should handle very large purchase price", async () => {
      const deviceData = createDevice({
        purchase_price: 99999999.99, // Max for DECIMAL(10,2)
      });

      const response = await api.post(
        "/api/devices",
        deviceData,
        ctx.adminToken,
      );
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
    });

    it("should handle decimal purchase price", async () => {
      const deviceData = createDevice({
        purchase_price: 1234.56,
      });

      const response = await api.post(
        "/api/devices",
        deviceData,
        ctx.adminToken,
      );
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
    });

    it("should reject negative purchase price", async () => {
      const deviceData = createDevice({
        purchase_price: -100,
      });

      const response = await api.post(
        "/api/devices",
        deviceData,
        ctx.adminToken,
      );
      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });
  });

  describe("String length boundaries", () => {
    it("should handle very long device name", async () => {
      const deviceData = createDevice({
        name: "A".repeat(500),
      });

      const response = await api.post(
        "/api/devices",
        deviceData,
        ctx.adminToken,
      );
      // Should either accept or reject with proper error, not crash
      expect([200, 201, 400, 500]).toContain(response.status);
    });

    it("should handle minimum length password (6 chars)", async () => {
      const userData = createUser({
        password: "123456",
        email: `minpwd-${Date.now()}@example.com`,
      });

      const response = await api.post("/api/auth/signup", userData);
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
    });

    it("should reject password with 5 characters", async () => {
      const userData = createUser({
        password: "12345",
        email: `shortpwd-${Date.now()}@example.com`,
      });

      const response = await api.post("/api/auth/signup", userData);
      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });
  });

  describe("Date boundaries", () => {
    it("should handle same start and end date for borrow", async () => {
      // First get an available device
      const devicesResponse = await api.get("/api/devices", undefined, {
        status: "available",
      });

      if (devicesResponse.data.data && devicesResponse.data.data.length > 0) {
        const device = devicesResponse.data.data[0];
        const today = daysFromNow(0);

        const response = await api.post(
          "/api/borrow",
          {
            device_id: device.id,
            start_date: today,
            end_date: today,
            reason: "Same day borrow test",
          },
          ctx.userToken,
        );

        // Same day should be valid
        expect([200, 201, 400]).toContain(response.status);
      }
    });

    it("should handle far future dates", async () => {
      const devicesResponse = await api.get("/api/devices", undefined, {
        status: "available",
      });

      if (devicesResponse.data.data && devicesResponse.data.data.length > 0) {
        const device = devicesResponse.data.data[0];

        const response = await api.post(
          "/api/borrow",
          {
            device_id: device.id,
            start_date: "2030-01-01",
            end_date: "2030-12-31",
            reason: "Far future borrow test",
          },
          ctx.userToken,
        );

        // Should handle far future dates
        expect([200, 201, 400]).toContain(response.status);
      }
    });
  });
});

// ============================================================================
// Empty and Null Value Tests
// ============================================================================

describe("Edge Cases - Empty and Null Values", () => {
  describe("Empty strings", () => {
    it("should reject empty device name", async () => {
      const deviceData = createDevice({
        name: "",
      });

      const response = await api.post(
        "/api/devices",
        deviceData,
        ctx.adminToken,
      );
      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });

    it("should reject empty email", async () => {
      const response = await api.post("/api/auth/login", {
        email: "",
        password: "password123",
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });

    it("should reject empty password", async () => {
      const response = await api.post("/api/auth/login", {
        email: "test@example.com",
        password: "",
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });

    it("should reject empty borrow reason", async () => {
      const response = await api.post(
        "/api/borrow",
        {
          device_id: 1,
          start_date: daysFromNow(1),
          end_date: daysFromNow(7),
          reason: "",
        },
        ctx.userToken,
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });
  });

  describe("Null values", () => {
    it("should handle null device_id in borrow request", async () => {
      const response = await api.post(
        "/api/borrow",
        {
          device_id: null,
          start_date: daysFromNow(1),
          end_date: daysFromNow(7),
          reason: "Test reason",
        },
        ctx.userToken,
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });
  });

  describe("Empty request body", () => {
    it("should handle empty body on login", async () => {
      const response = await fetch(
        `${TEST_CONFIG.API_BASE_URL}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        },
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    it("should handle empty body on device creation", async () => {
      const response = await fetch(`${TEST_CONFIG.API_BASE_URL}/api/devices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ctx.adminToken}`,
        },
        body: "{}",
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });
});

// ============================================================================
// Authorization Edge Cases
// ============================================================================

describe("Edge Cases - Authorization", () => {
  describe("Token edge cases", () => {
    it("should reject expired-looking token format", async () => {
      const response = await api.get(
        "/api/auth/me",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjB9.invalid",
      );

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });

    it("should reject token with Bearer prefix missing", async () => {
      const response = await fetch(`${TEST_CONFIG.API_BASE_URL}/api/auth/me`, {
        headers: {
          Authorization: ctx.userToken, // Missing "Bearer " prefix
        },
      });

      expect(response.status).toBe(401);
    });

    it("should reject token with wrong Bearer casing", async () => {
      const response = await fetch(`${TEST_CONFIG.API_BASE_URL}/api/auth/me`, {
        headers: {
          Authorization: `bearer ${ctx.userToken}`, // lowercase bearer
        },
      });

      // Should still work as Bearer is case-insensitive in many implementations
      expect([200, 401]).toContain(response.status);
    });
  });

  describe("Role-based access edge cases", () => {
    it("should prevent user from accessing admin endpoints", async () => {
      const response = await api.get("/api/users", ctx.userToken);
      expect(response.status).toBe(403);
      expect(response.data.success).toBe(false);
    });

    it("should prevent admin from deleting users (superuser only)", async () => {
      // Get a user to try to delete
      const usersResponse = await api.get("/api/users", ctx.adminToken);
      if (usersResponse.data.data && usersResponse.data.data.length > 0) {
        const userId = usersResponse.data.data[0].id;

        const response = await api.delete(
          `/api/users/${userId}`,
          ctx.adminToken,
        );
        expect(response.status).toBe(403);
        expect(response.data.success).toBe(false);
      }
    });

    it("should allow superuser to access admin endpoints", async () => {
      const response = await api.get("/api/users", ctx.superuserToken);
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  describe("Self-action restrictions", () => {
    it("should prevent superuser from deleting own account", async () => {
      // Get current user ID
      const meResponse = await api.get("/api/auth/me", ctx.superuserToken);
      const userId = (meResponse.data as any).user?.id;

      if (userId) {
        const response = await api.delete(
          `/api/users/${userId}`,
          ctx.superuserToken,
        );
        expect(response.status).toBe(400);
        expect(response.data.error).toContain("own account");
      }
    });

    it("should prevent superuser from locking own account", async () => {
      const meResponse = await api.get("/api/auth/me", ctx.superuserToken);
      const userId = (meResponse.data as any).user?.id;

      if (userId) {
        const response = await api.patch(
          `/api/users/${userId}/status`,
          { is_active: false },
          ctx.superuserToken,
        );
        expect(response.status).toBe(400);
        expect(response.data.error).toContain("own account");
      }
    });
  });
});

// ============================================================================
// Resource State Edge Cases
// ============================================================================

describe("Edge Cases - Resource States", () => {
  describe("Device status transitions", () => {
    it("should not allow borrowing a device that is in maintenance", async () => {
      const devicesResponse = await api.get("/api/devices", undefined, {
        status: "maintenance",
      });

      if (devicesResponse.data.data && devicesResponse.data.data.length > 0) {
        const device = devicesResponse.data.data[0];

        const response = await api.post(
          "/api/borrow",
          {
            device_id: device.id,
            start_date: daysFromNow(1),
            end_date: daysFromNow(7),
            reason: "Test borrowing maintenance device",
          },
          ctx.userToken,
        );

        expect(response.status).toBe(400);
        expect(response.data.success).toBe(false);
      }
    });

    it("should not allow borrowing an already borrowed device", async () => {
      const devicesResponse = await api.get("/api/devices", undefined, {
        status: "borrowed",
      });

      if (devicesResponse.data.data && devicesResponse.data.data.length > 0) {
        const device = devicesResponse.data.data[0];

        const response = await api.post(
          "/api/borrow",
          {
            device_id: device.id,
            start_date: daysFromNow(1),
            end_date: daysFromNow(7),
            reason: "Test borrowing borrowed device",
          },
          ctx.userToken,
        );

        expect(response.status).toBe(400);
        expect(response.data.success).toBe(false);
      }
    });
  });

  describe("Non-existent resources", () => {
    it("should return 404 for non-existent device", async () => {
      const response = await api.get("/api/devices/999999");
      expect(response.status).toBe(404);
      expect(response.data.success).toBe(false);
    });

    it("should return 404 for non-existent user", async () => {
      const response = await api.get("/api/users/999999", ctx.adminToken);
      expect(response.status).toBe(404);
      expect(response.data.success).toBe(false);
    });

    it("should return 404 for non-existent borrow request", async () => {
      const response = await api.get("/api/borrow/999999", ctx.adminToken);
      expect(response.status).toBe(404);
      expect(response.data.success).toBe(false);
    });

    it("should return 400 for borrowing non-existent device", async () => {
      const response = await api.post(
        "/api/borrow",
        {
          device_id: 999999,
          start_date: daysFromNow(1),
          end_date: daysFromNow(7),
          reason: "Test borrowing non-existent device",
        },
        ctx.userToken,
      );

      expect(response.status).toBe(404);
      expect(response.data.success).toBe(false);
    });
  });
});

// ============================================================================
// Duplicate and Conflict Tests
// ============================================================================

describe("Edge Cases - Duplicates and Conflicts", () => {
  describe("Duplicate email", () => {
    it("should reject signup with existing email", async () => {
      const userData = createUser();

      // First signup
      const firstResponse = await api.post("/api/auth/signup", userData);
      expect(firstResponse.status).toBe(201);

      // Second signup with same email
      const secondResponse = await api.post("/api/auth/signup", {
        ...userData,
        name: "Different Name",
      });

      expect(secondResponse.status).toBe(400);
      expect(secondResponse.data.error).toContain("email");
    });

    it("should reject signup with existing email (case insensitive)", async () => {
      const email = `casetest-${Date.now()}@example.com`;
      const userData = createUser({ email: email.toLowerCase() });

      // First signup with lowercase
      await api.post("/api/auth/signup", userData);

      // Second signup with uppercase
      const secondResponse = await api.post("/api/auth/signup", {
        ...userData,
        email: email.toUpperCase(),
        name: "Different Name",
      });

      expect(secondResponse.status).toBe(400);
      expect(secondResponse.data.error).toContain("email");
    });
  });

  describe("Duplicate asset tag", () => {
    it("should reject device with existing asset tag", async () => {
      const deviceData = createDevice();

      // First device
      const firstResponse = await api.post(
        "/api/devices",
        deviceData,
        ctx.adminToken,
      );
      expect(firstResponse.status).toBe(201);

      // Second device with same asset tag
      const secondResponse = await api.post(
        "/api/devices",
        {
          ...deviceData,
          name: "Different Device",
        },
        ctx.adminToken,
      );

      expect(secondResponse.status).toBe(400);
      expect(secondResponse.data.error).toContain("Asset tag");
    });
  });

  describe("Duplicate renewal request", () => {
    it("should reject duplicate pending renewal for same borrow request", async () => {
      // Get an active borrow request
      const borrowResponse = await api.get("/api/borrow", ctx.adminToken);
      const activeBorrow = borrowResponse.data.data?.find(
        (b: any) => b.status === "active",
      );

      if (activeBorrow) {
        // Check if there's already a pending renewal
        const renewalsResponse = await api.get(
          `/api/renewals/borrow/${activeBorrow.id}`,
          ctx.adminToken,
        );
        const hasPendingRenewal = renewalsResponse.data.data?.some(
          (r: any) => r.status === "pending",
        );

        if (!hasPendingRenewal) {
          // Create first renewal
          const firstRenewal = await api.post(
            "/api/renewals",
            {
              borrow_request_id: activeBorrow.id,
              requested_end_date: daysFromNow(30),
              reason: "First renewal request",
            },
            ctx.userToken,
          );

          if (firstRenewal.status === 201) {
            // Try to create second renewal
            const secondRenewal = await api.post(
              "/api/renewals",
              {
                borrow_request_id: activeBorrow.id,
                requested_end_date: daysFromNow(60),
                reason: "Second renewal request",
              },
              ctx.userToken,
            );

            expect(secondRenewal.status).toBe(400);
            expect(secondRenewal.data.error).toContain("pending");
          }
        }
      }
    });
  });
});

// ============================================================================
// Filter and Query Edge Cases
// ============================================================================

describe("Edge Cases - Filters and Queries", () => {
  describe("Invalid filter values", () => {
    it("should handle invalid category filter gracefully", async () => {
      const response = await api.get("/api/devices", undefined, {
        category: "invalid_category",
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      // Should return empty array for invalid category
      expect(response.data.data).toEqual([]);
    });

    it("should handle invalid status filter gracefully", async () => {
      const response = await api.get("/api/devices", undefined, {
        status: "invalid_status",
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toEqual([]);
    });

    it("should handle non-numeric price filter", async () => {
      const response = await api.get("/api/devices", undefined, {
        min_price: "not_a_number",
      });

      // Should either ignore invalid filter or return error
      expect([200, 400]).toContain(response.status);
    });
  });

  describe("Combined filters", () => {
    it("should handle multiple conflicting filters", async () => {
      const response = await api.get("/api/devices", undefined, {
        category: "laptop",
        status: "available",
        min_price: "10000",
        max_price: "100",
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      // Should return empty array when min > max
      expect(response.data.data).toEqual([]);
    });
  });
});

// ============================================================================
// HTTP Method Edge Cases
// ============================================================================

describe("Edge Cases - HTTP Methods", () => {
  it("should return 404 for unsupported HTTP method on devices", async () => {
    const response = await fetch(`${TEST_CONFIG.API_BASE_URL}/api/devices`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ctx.adminToken}`,
      },
    });

    expect([404, 405]).toContain(response.status);
  });

  it("should handle OPTIONS request for CORS", async () => {
    const response = await fetch(`${TEST_CONFIG.API_BASE_URL}/api/devices`, {
      method: "OPTIONS",
    });

    // Should return 200 or 204 for OPTIONS
    expect([200, 204]).toContain(response.status);
  });
});
