/**
 * User API Tests
 *
 * Tests for user management endpoints including listing, retrieval,
 * profile updates, password reset, status toggle, and deletion.
 *
 * Requirements: 3.1-3.12
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fc from "fast-check";
import { testApiClient as api } from "../utils/api-client";
import { createUser } from "../utils/factories";
import { TEST_USERS } from "../test-config";
import type { UserPublic } from "../../src/types/api";

// ============================================================================
// Test Setup
// ============================================================================

// Use the singleton API client

let adminToken: string;
let superuserToken: string;
let userToken: string;
let regularUserId: number;
const createdUserIds: number[] = [];

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
});

afterAll(async () => {
  // Cleanup created users
  for (const userId of createdUserIds) {
    try {
      await api.delete(`/api/users/${userId}`, superuserToken);
    } catch {
      // Ignore cleanup errors
    }
  }
});

// ============================================================================
// User Listing Tests (Requirements 3.1, 3.2)
// ============================================================================

describe("User API - Listing", () => {
  describe("GET /api/users", () => {
    it("should return all users with department information for admin (Req 3.1)", async () => {
      const response = await api.get<UserPublic[]>("/api/users", adminToken);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
      expect(Array.isArray(response.data.data)).toBe(true);

      // Verify users have expected properties
      if (response.data.data && response.data.data.length > 0) {
        const user = response.data.data[0];
        expect(user).toHaveProperty("id");
        expect(user).toHaveProperty("name");
        expect(user).toHaveProperty("email");
        expect(user).toHaveProperty("department_id");
        expect(user).toHaveProperty("role");
        expect(user).toHaveProperty("is_active");
      }
    });

    it("should return 403 for non-admin user (Req 3.2)", async () => {
      const response = await api.get<UserPublic[]>("/api/users", userToken);

      expect(response.status).toBe(403);
      expect(response.data.success).toBe(false);
      expect(response.data.error).toBeDefined();
    });

    it("should return 401 for unauthenticated request", async () => {
      const response = await api.get<UserPublic[]>("/api/users");

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });
  });
});

// ============================================================================
// User Retrieval Tests (Requirements 3.3, 3.4, 3.5)
// ============================================================================

describe("User API - Retrieval", () => {
  describe("GET /api/users/:id", () => {
    it("should allow user to view their own profile (Req 3.3)", async () => {
      const response = await api.get<UserPublic>(
        `/api/users/${regularUserId}`,
        userToken,
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
      expect(response.data.data?.id).toBe(regularUserId);
      expect(response.data.data?.email).toBe(TEST_USERS.user.email);
    });

    it("should allow admin to view any user (Req 3.4)", async () => {
      const response = await api.get<UserPublic>(
        `/api/users/${regularUserId}`,
        adminToken,
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
      expect(response.data.data?.id).toBe(regularUserId);
    });

    it("should return 403 for non-admin viewing other user (Req 3.5)", async () => {
      // First get all users to find another user's ID
      const usersResponse = await api.get<UserPublic[]>(
        "/api/users",
        adminToken,
      );

      if (usersResponse.data.data && usersResponse.data.data.length > 0) {
        // Find a user that is not the regular user
        const otherUser = usersResponse.data.data.find(
          (u) => u.id !== regularUserId,
        );

        if (otherUser) {
          const response = await api.get<UserPublic>(
            `/api/users/${otherUser.id}`,
            userToken,
          );

          expect(response.status).toBe(403);
          expect(response.data.success).toBe(false);
          expect(response.data.error).toBeDefined();
        }
      }
    });

    it("should return 404 for non-existent user ID", async () => {
      const nonExistentId = 999999;

      const response = await api.get<UserPublic>(
        `/api/users/${nonExistentId}`,
        adminToken,
      );

      expect(response.status).toBe(404);
      expect(response.data.success).toBe(false);
      expect(response.data.error).toBeDefined();
    });

    it("should return 400 for invalid user ID format", async () => {
      const response = await api.get<UserPublic>(
        "/api/users/invalid",
        adminToken,
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.error).toBeDefined();
    });

    it("should return 401 for unauthenticated request", async () => {
      const response = await api.get<UserPublic>(`/api/users/${regularUserId}`);

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });
  });
});

// ============================================================================
// User Management Tests (Requirements 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12)
// ============================================================================

describe("User API - Management", () => {
  describe("PUT /api/users/:id", () => {
    it("should allow user to update their own profile (Req 3.6)", async () => {
      // Create a new user for this test
      const userData = createUser();
      const signupResponse = await api.post<{
        token: string;
        user: UserPublic;
      }>("/api/auth/signup", userData);

      // Auth endpoint returns token and user directly
      const authResponse = signupResponse.data as unknown as {
        success: boolean;
        token?: string;
        user?: UserPublic;
      };

      if (authResponse.success && authResponse.token && authResponse.user) {
        createdUserIds.push(authResponse.user.id);

        const updatedName = "Updated Test User Name";
        const response = await api.put<UserPublic>(
          `/api/users/${authResponse.user.id}`,
          { name: updatedName },
          authResponse.token,
        );

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.data?.name).toBe(updatedName);
      }
    });

    it("should return 403 for non-admin updating other user", async () => {
      // Get all users to find another user
      const usersResponse = await api.get<UserPublic[]>(
        "/api/users",
        adminToken,
      );

      if (usersResponse.data.data && usersResponse.data.data.length > 0) {
        const otherUser = usersResponse.data.data.find(
          (u) => u.id !== regularUserId,
        );

        if (otherUser) {
          const response = await api.put<UserPublic>(
            `/api/users/${otherUser.id}`,
            { name: "Unauthorized Update" },
            userToken,
          );

          expect(response.status).toBe(403);
          expect(response.data.success).toBe(false);
        }
      }
    });

    it("should return 400 for no fields to update", async () => {
      const response = await api.put<UserPublic>(
        `/api/users/${regularUserId}`,
        {},
        userToken,
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.error).toContain("No fields");
    });
  });

  describe("PATCH /api/users/:id/password", () => {
    it("should allow superuser to reset password (Req 3.7)", async () => {
      // Create a new user for this test
      const userData = createUser();
      const signupResponse = await api.post<{
        token: string;
        user: UserPublic;
      }>("/api/auth/signup", userData);

      const authResponse = signupResponse.data as unknown as {
        success: boolean;
        token?: string;
        user?: UserPublic;
      };

      if (authResponse.success && authResponse.user) {
        createdUserIds.push(authResponse.user.id);

        const response = await api.patch<{ message: string }>(
          `/api/users/${authResponse.user.id}/password`,
          { password: "newpassword123" },
          superuserToken,
        );

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.message).toContain("reset");

        // Verify new password works
        const loginResponse = await api.post<{
          token: string;
          user: UserPublic;
        }>("/api/auth/login", {
          email: userData.email,
          password: "newpassword123",
        });
        expect(loginResponse.status).toBe(200);
      }
    });

    it("should return 403 for non-superuser resetting password (Req 3.8)", async () => {
      const response = await api.patch<{ message: string }>(
        `/api/users/${regularUserId}/password`,
        { password: "newpassword123" },
        adminToken,
      );

      expect(response.status).toBe(403);
      expect(response.data.success).toBe(false);
      expect(response.data.error).toContain("Superuser");
    });

    it("should return 403 for regular user resetting password", async () => {
      const response = await api.patch<{ message: string }>(
        `/api/users/${regularUserId}/password`,
        { password: "newpassword123" },
        userToken,
      );

      expect(response.status).toBe(403);
      expect(response.data.success).toBe(false);
    });

    it("should return 400 for password less than 6 characters", async () => {
      // Create a user for this test
      const userData = createUser();
      const signupResponse = await api.post<{
        token: string;
        user: UserPublic;
      }>("/api/auth/signup", userData);

      const authResponse = signupResponse.data as unknown as {
        success: boolean;
        token?: string;
        user?: UserPublic;
      };

      if (authResponse.success && authResponse.user) {
        createdUserIds.push(authResponse.user.id);

        const response = await api.patch<{ message: string }>(
          `/api/users/${authResponse.user.id}/password`,
          { password: "12345" },
          superuserToken,
        );

        expect(response.status).toBe(400);
        expect(response.data.success).toBe(false);
        expect(response.data.error).toContain("6");
      }
    });
  });

  describe("PATCH /api/users/:id/status", () => {
    it("should allow superuser to toggle user status (Req 3.9)", async () => {
      // Create a new user for this test
      const userData = createUser();
      const signupResponse = await api.post<{
        token: string;
        user: UserPublic;
      }>("/api/auth/signup", userData);

      const authResponse = signupResponse.data as unknown as {
        success: boolean;
        token?: string;
        user?: UserPublic;
      };

      if (authResponse.success && authResponse.user) {
        createdUserIds.push(authResponse.user.id);

        // Lock the user
        const lockResponse = await api.patch<UserPublic>(
          `/api/users/${authResponse.user.id}/status`,
          { is_active: false },
          superuserToken,
        );

        expect(lockResponse.status).toBe(200);
        expect(lockResponse.data.success).toBe(true);
        // MySQL returns 0/1 for boolean, so check for falsy value
        expect(lockResponse.data.data?.is_active).toBeFalsy();

        // Unlock the user
        const unlockResponse = await api.patch<UserPublic>(
          `/api/users/${authResponse.user.id}/status`,
          { is_active: true },
          superuserToken,
        );

        expect(unlockResponse.status).toBe(200);
        expect(unlockResponse.data.success).toBe(true);
        // MySQL returns 0/1 for boolean, so check for truthy value
        expect(unlockResponse.data.data?.is_active).toBeTruthy();
      }
    });

    it("should return 400 for superuser toggling own status (Req 3.10)", async () => {
      // Get superuser's ID
      const meResponse = await api.get<{ user: UserPublic }>(
        "/api/auth/me",
        superuserToken,
      );
      const superuserId = meResponse.data.data?.user.id;

      if (superuserId) {
        const response = await api.patch<UserPublic>(
          `/api/users/${superuserId}/status`,
          { is_active: false },
          superuserToken,
        );

        expect(response.status).toBe(400);
        expect(response.data.success).toBe(false);
        expect(response.data.error).toContain("own");
      }
    });

    it("should return 403 for non-superuser toggling status", async () => {
      const response = await api.patch<UserPublic>(
        `/api/users/${regularUserId}/status`,
        { is_active: false },
        adminToken,
      );

      expect(response.status).toBe(403);
      expect(response.data.success).toBe(false);
      expect(response.data.error).toContain("Superuser");
    });

    it("should return 400 for invalid is_active value", async () => {
      // Create a user for this test
      const userData = createUser();
      const signupResponse = await api.post<{
        token: string;
        user: UserPublic;
      }>("/api/auth/signup", userData);

      const authResponse = signupResponse.data as unknown as {
        success: boolean;
        token?: string;
        user?: UserPublic;
      };

      if (authResponse.success && authResponse.user) {
        createdUserIds.push(authResponse.user.id);

        const response = await api.patch<UserPublic>(
          `/api/users/${authResponse.user.id}/status`,
          { is_active: "invalid" },
          superuserToken,
        );

        expect(response.status).toBe(400);
        expect(response.data.success).toBe(false);
      }
    });
  });

  describe("DELETE /api/users/:id", () => {
    it("should allow superuser to delete user without active requests (Req 3.11)", async () => {
      // Create a new user for this test
      const userData = createUser();
      const signupResponse = await api.post<{
        token: string;
        user: UserPublic;
      }>("/api/auth/signup", userData);

      const authResponse = signupResponse.data as unknown as {
        success: boolean;
        token?: string;
        user?: UserPublic;
      };

      if (authResponse.success && authResponse.user) {
        const userId = authResponse.user.id;

        const response = await api.delete<{ message: string }>(
          `/api/users/${userId}`,
          superuserToken,
        );

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.message).toContain("deleted");

        // Verify user is deleted
        const getResponse = await api.get<UserPublic>(
          `/api/users/${userId}`,
          superuserToken,
        );
        expect(getResponse.status).toBe(404);
      }
    });

    it("should return 403 for non-superuser deleting user", async () => {
      // Create a user for this test
      const userData = createUser();
      const signupResponse = await api.post<{
        token: string;
        user: UserPublic;
      }>("/api/auth/signup", userData);

      const authResponse = signupResponse.data as unknown as {
        success: boolean;
        token?: string;
        user?: UserPublic;
      };

      if (authResponse.success && authResponse.user) {
        createdUserIds.push(authResponse.user.id);

        const response = await api.delete<{ message: string }>(
          `/api/users/${authResponse.user.id}`,
          adminToken,
        );

        expect(response.status).toBe(403);
        expect(response.data.success).toBe(false);
        expect(response.data.error).toContain("Superuser");
      }
    });

    it("should return 400 for superuser deleting own account", async () => {
      // Get superuser's ID
      const meResponse = await api.get<{ user: UserPublic }>(
        "/api/auth/me",
        superuserToken,
      );
      const superuserId = meResponse.data.data?.user.id;

      if (superuserId) {
        const response = await api.delete<{ message: string }>(
          `/api/users/${superuserId}`,
          superuserToken,
        );

        expect(response.status).toBe(400);
        expect(response.data.success).toBe(false);
        expect(response.data.error).toContain("own");
      }
    });

    it("should return 400 for invalid user ID format on delete", async () => {
      const response = await api.delete<{ message: string }>(
        "/api/users/invalid",
        superuserToken,
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });
  });
});

// ============================================================================
// Property Tests
// ============================================================================

describe("User API - Property Tests", () => {
  /**
   * Property 7: Admin User Listing
   *
   * For any admin user, GET /api/users should return all users with
   * department information. For any non-admin user, it should return 403.
   *
   * **Validates: Requirements 3.1, 3.2**
   */
  describe("Property 7: Admin User Listing", () => {
    it("for any admin user, listing should return all users; for non-admin, should return 403", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            { token: adminToken, isAdmin: true, description: "admin" },
            { token: superuserToken, isAdmin: true, description: "superuser" },
            { token: userToken, isAdmin: false, description: "regular user" },
          ),
          async ({ token, isAdmin, description }) => {
            const response = await api.get<UserPublic[]>("/api/users", token);

            if (isAdmin) {
              // Admin/superuser should get all users
              expect(response.status).toBe(200);
              expect(response.data.success).toBe(true);
              expect(response.data.data).toBeDefined();
              expect(Array.isArray(response.data.data)).toBe(true);

              // Verify users have department information
              if (response.data.data && response.data.data.length > 0) {
                response.data.data.forEach((user) => {
                  expect(user).toHaveProperty("id");
                  expect(user).toHaveProperty("name");
                  expect(user).toHaveProperty("email");
                  expect(user).toHaveProperty("department_id");
                  expect(user).toHaveProperty("role");
                });
              }
            } else {
              // Non-admin should get 403
              expect(response.status).toBe(403);
              expect(response.data.success).toBe(false);
            }

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 8: User Self-Access
   *
   * For any authenticated user, GET /api/users/:id with their own ID
   * should return their user data.
   *
   * **Validates: Requirements 3.3**
   */
  describe("Property 8: User Self-Access", () => {
    it("for any authenticated user, accessing own profile should return their data", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            {
              email: TEST_USERS.user.email,
              password: TEST_USERS.user.password,
            },
            {
              email: TEST_USERS.admin.email,
              password: TEST_USERS.admin.password,
            },
            {
              email: TEST_USERS.superuser.email,
              password: TEST_USERS.superuser.password,
            },
          ),
          async (credentials) => {
            // Login to get token and user info
            const loginResult = await api.login(
              credentials.email,
              credentials.password,
            );
            const userId = loginResult.user.id;
            const token = loginResult.token;

            // Access own profile
            const response = await api.get<UserPublic>(
              `/api/users/${userId}`,
              token,
            );

            // Should always succeed for own profile
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(response.data.data).toBeDefined();
            expect(response.data.data?.id).toBe(userId);
            expect(response.data.data?.email).toBe(credentials.email);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
