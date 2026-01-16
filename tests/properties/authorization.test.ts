/**
 * Authorization Property Tests for Device Hub
 *
 * Tests for authorization rules across all API endpoints.
 * Validates that protected endpoints require tokens, admin-only endpoints
 * reject regular users, and superuser-only endpoints reject admins.
 *
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */

import { describe, it, expect, beforeAll } from "vitest";
import * as fc from "fast-check";
import { TestApiClient } from "../utils/api-client";
import { setupTestContextWithDevice, type TestContext } from "../utils/helpers";
import { invalidTokenArb } from "../utils/generators";
import type { UserPublic } from "../../src/types/api";

// ============================================================================
// Test Setup
// ============================================================================

const api = new TestApiClient();
let ctx: TestContext;

beforeAll(async () => {
  ctx = await setupTestContextWithDevice();
});

// ============================================================================
// Endpoint Definitions
// ============================================================================

/**
 * Protected endpoints that require authentication (any valid token)
 */
const protectedEndpoints = [
  { method: "GET", path: "/api/users" },
  { method: "GET", path: "/api/users/1" },
  { method: "GET", path: "/api/borrow" },
  { method: "GET", path: "/api/returns" },
  { method: "GET", path: "/api/renewals" },
  { method: "GET", path: "/api/auth/me" },
  {
    method: "POST",
    path: "/api/auth/change-password",
    body: { currentPassword: "test", newPassword: "test123" },
  },
] as const;

/**
 * Admin-only endpoints that require admin or superuser role
 */
const adminOnlyEndpoints = [
  { method: "GET", path: "/api/users", description: "List all users" },
  {
    method: "POST",
    path: "/api/devices",
    body: {
      name: "Test",
      asset_tag: "TEST-001",
      category: "laptop",
      brand: "Test",
      model: "Test",
      department_id: 1,
      purchase_price: 100,
      purchase_date: "2024-01-01",
    },
    description: "Create device",
  },
  {
    method: "PUT",
    path: "/api/devices/1",
    body: { name: "Updated" },
    description: "Update device",
  },
  { method: "DELETE", path: "/api/devices/1", description: "Delete device" },
] as const;

/**
 * Superuser-only endpoints that require superuser role
 */
const superuserOnlyEndpoints = [
  { method: "DELETE", path: "/api/users/1", description: "Delete user" },
  {
    method: "PATCH",
    path: "/api/users/1/password",
    body: { password: "newpassword123" },
    description: "Reset user password",
  },
  {
    method: "PATCH",
    path: "/api/users/1/status",
    body: { is_active: true },
    description: "Toggle user status",
  },
] as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Make a request to an endpoint with optional token
 */
async function makeRequest(
  method: string,
  path: string,
  token?: string,
  body?: unknown,
): Promise<{ status: number; data: { success: boolean; error?: string } }> {
  switch (method) {
    case "GET":
      return api.get(path, token);
    case "POST":
      return api.post(path, body || {}, token);
    case "PUT":
      return api.put(path, body || {}, token);
    case "PATCH":
      return api.patch(path, body || {}, token);
    case "DELETE":
      return api.delete(path, token);
    default:
      throw new Error(`Unknown method: ${method}`);
  }
}

// ============================================================================
// Protected Endpoints Tests (Requirement 11.1)
// ============================================================================

describe("Authorization - Protected Endpoints Require Token", () => {
  describe("All protected endpoints should return 401 without token", () => {
    it("GET /api/users requires token (Req 11.1)", async () => {
      const response = await api.get("/api/users");
      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });

    it("GET /api/users/:id requires token (Req 11.1)", async () => {
      const response = await api.get("/api/users/1");
      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });

    it("GET /api/borrow requires token (Req 11.1)", async () => {
      const response = await api.get("/api/borrow");
      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });

    it("GET /api/returns requires token (Req 11.1)", async () => {
      const response = await api.get("/api/returns");
      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });

    it("GET /api/renewals requires token (Req 11.1)", async () => {
      const response = await api.get("/api/renewals");
      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });

    it("GET /api/auth/me requires token (Req 11.1)", async () => {
      const response = await api.get("/api/auth/me");
      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });

    it("POST /api/auth/change-password requires token (Req 11.1)", async () => {
      const response = await api.post("/api/auth/change-password", {
        currentPassword: "test",
        newPassword: "test123",
      });
      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });

    it("POST /api/borrow requires token (Req 11.1)", async () => {
      const response = await api.post("/api/borrow", {
        device_id: 1,
        start_date: "2024-01-01",
        end_date: "2024-01-15",
        reason: "Test",
      });
      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });

    it("POST /api/returns requires token (Req 11.1)", async () => {
      const response = await api.post("/api/returns", {
        borrow_request_id: 1,
        condition: "good",
      });
      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });

    it("POST /api/renewals requires token (Req 11.1)", async () => {
      const response = await api.post("/api/renewals", {
        borrow_request_id: 1,
        requested_end_date: "2024-02-01",
        reason: "Test",
      });
      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });

    it("POST /api/devices requires token (Req 11.1)", async () => {
      const response = await api.post("/api/devices", {
        name: "Test Device",
        asset_tag: "TEST-001",
        category: "laptop",
        brand: "Test",
        model: "Test",
        department_id: 1,
        purchase_price: 100,
        purchase_date: "2024-01-01",
      });
      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });

    it("PUT /api/devices/:id requires token (Req 11.1)", async () => {
      const response = await api.put("/api/devices/1", { name: "Updated" });
      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });

    it("DELETE /api/devices/:id requires token (Req 11.1)", async () => {
      const response = await api.delete("/api/devices/1");
      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });

    it("DELETE /api/users/:id requires token (Req 11.1)", async () => {
      const response = await api.delete("/api/users/1");
      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });

    it("PATCH /api/users/:id/password requires token (Req 11.1)", async () => {
      const response = await api.patch("/api/users/1/password", {
        password: "newpassword123",
      });
      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });

    it("PATCH /api/users/:id/status requires token (Req 11.1)", async () => {
      const response = await api.patch("/api/users/1/status", {
        is_active: true,
      });
      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });
  });
});

// ============================================================================
// Admin-Only Endpoints Tests (Requirement 11.2)
// ============================================================================

describe("Authorization - Admin-Only Endpoints Reject Regular Users", () => {
  it("GET /api/users returns 403 for regular user (Req 11.2)", async () => {
    const response = await api.get("/api/users", ctx.userToken);
    expect(response.status).toBe(403);
    expect(response.data.success).toBe(false);
  });

  it("POST /api/devices returns 401 for regular user (Req 11.2)", async () => {
    const response = await api.post(
      "/api/devices",
      {
        name: "Test Device",
        asset_tag: "TEST-AUTH-001",
        category: "laptop",
        brand: "Test",
        model: "Test",
        department_id: 1,
        purchase_price: 100,
        purchase_date: "2024-01-01",
      },
      ctx.userToken,
    );
    expect(response.status).toBe(403);
    expect(response.data.success).toBe(false);
  });

  it("PUT /api/devices/:id returns 403 for regular user (Req 11.2)", async () => {
    const response = await api.put(
      `/api/devices/${ctx.testDevice!.id}`,
      { name: "Updated" },
      ctx.userToken,
    );
    expect(response.status).toBe(403);
    expect(response.data.success).toBe(false);
  });

  it("DELETE /api/devices/:id returns 403 for regular user (Req 11.2)", async () => {
    const response = await api.delete(
      `/api/devices/${ctx.testDevice!.id}`,
      ctx.userToken,
    );
    expect(response.status).toBe(403);
    expect(response.data.success).toBe(false);
  });

  it("PATCH /api/borrow/:id/status (approve) returns 403 for regular user (Req 11.2)", async () => {
    // First get a pending request if available
    const borrowResponse = await api.get("/api/borrow", ctx.adminToken);
    const requests = borrowResponse.data.data as Array<{
      id: number;
      status: string;
    }>;
    const pendingRequest = requests?.find((r) => r.status === "pending");

    if (pendingRequest) {
      const response = await api.patch(
        `/api/borrow/${pendingRequest.id}/status`,
        { status: "approved" },
        ctx.userToken,
      );
      expect(response.status).toBe(403);
      expect(response.data.success).toBe(false);
    } else {
      // If no pending request, test with a dummy ID - should still return 403 or 404
      const response = await api.patch(
        "/api/borrow/99999/status",
        { status: "approved" },
        ctx.userToken,
      );
      expect([403, 404]).toContain(response.status);
    }
  });

  it("PATCH /api/renewals/:id/status returns 403 for regular user (Req 11.2)", async () => {
    const response = await api.patch(
      "/api/renewals/1/status",
      { status: "approved" },
      ctx.userToken,
    );
    expect(response.status).toBe(403);
    expect(response.data.success).toBe(false);
  });

  // Verify admin CAN access admin-only endpoints
  it("GET /api/users succeeds for admin (Req 11.2)", async () => {
    const response = await api.get("/api/users", ctx.adminToken);
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
  });
});

// ============================================================================
// Superuser-Only Endpoints Tests (Requirement 11.3)
// ============================================================================

describe("Authorization - Superuser-Only Endpoints Reject Admins", () => {
  it("DELETE /api/users/:id returns 403 for admin (Req 11.3)", async () => {
    // Use a user ID that exists but is not the admin themselves
    const usersResponse = await api.get("/api/users", ctx.adminToken);
    const users = usersResponse.data.data as Array<{
      id: number;
      role: string;
    }>;
    const regularUser = users?.find((u) => u.role === "user");

    if (regularUser) {
      const response = await api.delete(
        `/api/users/${regularUser.id}`,
        ctx.adminToken,
      );
      expect(response.status).toBe(403);
      expect(response.data.success).toBe(false);
    }
  });

  it("PATCH /api/users/:id/password returns 403 for admin (Req 11.3)", async () => {
    const response = await api.patch(
      "/api/users/1/password",
      { password: "newpassword123" },
      ctx.adminToken,
    );
    expect(response.status).toBe(403);
    expect(response.data.success).toBe(false);
  });

  it("PATCH /api/users/:id/status returns 403 for admin (Req 11.3)", async () => {
    const response = await api.patch(
      "/api/users/1/status",
      { is_active: true },
      ctx.adminToken,
    );
    expect(response.status).toBe(403);
    expect(response.data.success).toBe(false);
  });

  // Verify superuser CAN access superuser-only endpoints
  it("PATCH /api/users/:id/password succeeds for superuser (Req 11.3)", async () => {
    // Get a user to reset password for
    const usersResponse = await api.get("/api/users", ctx.superuserToken);
    const users = usersResponse.data.data as Array<{
      id: number;
      role: string;
    }>;
    const regularUser = users?.find((u) => u.role === "user");

    if (regularUser) {
      const response = await api.patch(
        `/api/users/${regularUser.id}/password`,
        { password: "password123" },
        ctx.superuserToken,
      );
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    }
  });
});

// ============================================================================
// User Resource Ownership Tests (Requirement 11.4)
// ============================================================================

describe("Authorization - User Resource Ownership", () => {
  it("GET /api/users/:id returns 403 when non-admin accesses another user (Req 11.4)", async () => {
    // Get the current user's ID
    const meResponse = await api.get<{ user: UserPublic }>("/api/auth/me", ctx.userToken);
    const currentUser = (meResponse.data as any).user;

    // Get all users to find another user
    const usersResponse = await api.get<UserPublic[]>("/api/users", ctx.adminToken);
    const users = usersResponse.data.data;
    const otherUser = users?.find((u) => u.id !== currentUser?.id);

    if (otherUser) {
      const response = await api.get(
        `/api/users/${otherUser.id}`,
        ctx.userToken,
      );
      expect(response.status).toBe(403);
      expect(response.data.success).toBe(false);
    }
  });

  it("GET /api/users/:id succeeds when user accesses own profile (Req 11.4)", async () => {
    // Get the current user's ID
    const meResponse = await api.get<{ user: UserPublic }>("/api/auth/me", ctx.userToken);
    const currentUser = (meResponse.data as any).user;

    if (currentUser) {
      const response = await api.get(
        `/api/users/${currentUser.id}`,
        ctx.userToken,
      );
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    }
  });

  it("GET /api/borrow/user/:userId returns 403 when non-admin accesses another user requests (Req 11.4)", async () => {
    // Get the current user's ID
    const meResponse = await api.get<{ user: UserPublic }>("/api/auth/me", ctx.userToken);
    const currentUser = (meResponse.data as any).user;

    // Get all users to find another user
    const usersResponse = await api.get<UserPublic[]>("/api/users", ctx.adminToken);
    const users = usersResponse.data.data;
    const otherUser = users?.find((u) => u.id !== currentUser?.id);

    if (otherUser) {
      const response = await api.get(
        `/api/borrow/user/${otherUser.id}`,
        ctx.userToken,
      );
      expect(response.status).toBe(403);
      expect(response.data.success).toBe(false);
    }
  });
});

// ============================================================================
// Role Hierarchy Tests (Requirement 11.5)
// ============================================================================

describe("Authorization - Role Hierarchy", () => {
  it("Superuser can access admin-only endpoints (Req 11.5)", async () => {
    const response = await api.get("/api/users", ctx.superuserToken);
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
  });

  it("Admin can access user-level endpoints (Req 11.5)", async () => {
    const response = await api.get("/api/borrow", ctx.adminToken);
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
  });

  it("Superuser can access user-level endpoints (Req 11.5)", async () => {
    const response = await api.get("/api/borrow", ctx.superuserToken);
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
  });
});

// ============================================================================
// Property Tests
// ============================================================================

describe("Authorization - Property Tests", () => {
  /**
   * Property 26: Authorization Enforcement
   *
   * For any protected endpoint, requests without a token should return 401.
   * For admin-only endpoints, non-admin requests should return 403.
   * For superuser-only endpoints, non-superuser requests should return 403.
   *
   * **Validates: Requirements 11.1, 11.2, 11.3**
   */
  describe("Property 26: Authorization Enforcement", () => {
    it("for any invalid token, protected endpoints should return 401", async () => {
      await fc.assert(
        fc.asyncProperty(
          invalidTokenArb,
          fc.constantFrom(
            { method: "GET", path: "/api/users" },
            { method: "GET", path: "/api/borrow" },
            { method: "GET", path: "/api/returns" },
            { method: "GET", path: "/api/renewals" },
            { method: "GET", path: "/api/auth/me" },
          ),
          async (invalidToken, endpoint) => {
            const response = await makeRequest(
              endpoint.method,
              endpoint.path,
              invalidToken,
            );
            expect(response.status).toBe(401);
            expect(response.data.success).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("for any admin-only endpoint, regular user should be rejected", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            { method: "GET", path: "/api/users", expectedStatus: 403 },
            {
              method: "POST",
              path: "/api/devices",
              body: {
                name: "Test",
                asset_tag: "TEST-PROP-001",
                category: "laptop",
                brand: "Test",
                model: "Test",
                department_id: 1,
                purchase_price: 100,
                purchase_date: "2024-01-01",
              },
              expectedStatus: 403,
            },
            {
              method: "PUT",
              path: "/api/devices/1",
              body: { name: "Updated" },
              expectedStatus: 403,
            },
            { method: "DELETE", path: "/api/devices/1", expectedStatus: 403 },
          ),
          async (endpoint) => {
            const response = await makeRequest(
              endpoint.method,
              endpoint.path,
              ctx.userToken,
              endpoint.body,
            );
            expect(response.status).toBe(endpoint.expectedStatus);
            expect(response.data.success).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("for any superuser-only endpoint, admin should be rejected with 403", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            {
              method: "PATCH",
              path: "/api/users/1/password",
              body: { password: "newpassword123" },
            },
            {
              method: "PATCH",
              path: "/api/users/1/status",
              body: { is_active: true },
            },
          ),
          async (endpoint) => {
            const response = await makeRequest(
              endpoint.method,
              endpoint.path,
              ctx.adminToken,
              endpoint.body,
            );
            expect(response.status).toBe(403);
            expect(response.data.success).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
