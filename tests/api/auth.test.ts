/**
 * Authentication API Tests
 *
 * Tests for authentication endpoints including login, signup,
 * token validation, and password change.
 *
 * Requirements: 1.1-1.10
 */

import { describe, it, expect, beforeAll } from "vitest";
import * as fc from "fast-check";
import { TestApiClient } from "../utils/api-client";
import { createUser } from "../utils/factories";
import { validEmailArb, invalidPasswordArb } from "../utils/generators";
import { TEST_USERS } from "../setup";
import type { UserPublic } from "../../src/types/api";

// ============================================================================
// Test Setup
// ============================================================================

const api = new TestApiClient();

// ============================================================================
// Login Tests (Requirements 1.1, 1.2, 1.3)
// ============================================================================

describe("Authentication API - Login", () => {
  describe("POST /api/auth/login", () => {
    it("should return token and user data for valid credentials (Req 1.1)", async () => {
      const response = await api.post<{ token: string; user: UserPublic }>(
        "/api/auth/login",
        {
          email: TEST_USERS.user.email,
          password: TEST_USERS.user.password,
        },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      // Auth endpoints return token and user directly, not wrapped in data
      const authResponse = response.data as unknown as {
        success: boolean;
        token?: string;
        user?: UserPublic;
      };
      expect(authResponse.token).toBeDefined();
      expect(typeof authResponse.token).toBe("string");
      expect(authResponse.user).toBeDefined();
      expect(authResponse.user?.email).toBe(TEST_USERS.user.email);
    });

    it("should return 401 for invalid credentials (Req 1.2)", async () => {
      const response = await api.post<{ token: string; user: UserPublic }>(
        "/api/auth/login",
        {
          email: TEST_USERS.user.email,
          password: "wrongpassword",
        },
      );

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
      expect(response.data.error).toBeDefined();
    });

    it("should return 401 for non-existent user (Req 1.2)", async () => {
      const response = await api.post<{ token: string; user: UserPublic }>(
        "/api/auth/login",
        {
          email: "nonexistent@example.com",
          password: "anypassword",
        },
      );

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
      expect(response.data.error).toBeDefined();
    });

    it("should return 400 for missing email", async () => {
      const response = await api.post<{ token: string; user: UserPublic }>(
        "/api/auth/login",
        {
          password: "anypassword",
        },
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });

    it("should return 400 for missing password", async () => {
      const response = await api.post<{ token: string; user: UserPublic }>(
        "/api/auth/login",
        {
          email: TEST_USERS.user.email,
        },
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });
  });
});

// ============================================================================
// Signup Tests (Requirements 1.4, 1.5, 1.6)
// ============================================================================

describe("Authentication API - Signup", () => {
  describe("POST /api/auth/signup", () => {
    it("should create user and return token for valid signup data (Req 1.4)", async () => {
      const userData = createUser();

      const response = await api.post<{ token: string; user: UserPublic }>(
        "/api/auth/signup",
        userData,
      );

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      // Auth endpoints return token and user directly, not wrapped in data
      const authResponse = response.data as unknown as {
        success: boolean;
        token?: string;
        user?: UserPublic;
      };
      expect(authResponse.token).toBeDefined();
      expect(typeof authResponse.token).toBe("string");
      expect(authResponse.user).toBeDefined();
      expect(authResponse.user?.email).toBe(userData.email.toLowerCase());
      expect(authResponse.user?.name).toBe(userData.name);
    });

    it("should return 400 for duplicate email (Req 1.5)", async () => {
      // First signup
      const userData = createUser();
      await api.post<{ token: string; user: UserPublic }>(
        "/api/auth/signup",
        userData,
      );

      // Second signup with same email
      const duplicateUser = createUser({ email: userData.email });
      const response = await api.post<{ token: string; user: UserPublic }>(
        "/api/auth/signup",
        duplicateUser,
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.error).toContain("email");
    });

    it("should return 400 for password less than 6 characters (Req 1.6)", async () => {
      const userData = createUser({ password: "12345" });

      const response = await api.post<{ token: string; user: UserPublic }>(
        "/api/auth/signup",
        userData,
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.error).toContain("6");
    });

    it("should return 400 for missing name", async () => {
      const response = await api.post<{ token: string; user: UserPublic }>(
        "/api/auth/signup",
        {
          email: "test@example.com",
          password: "password123",
          department_id: 1,
        },
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });

    it("should return 400 for missing email", async () => {
      const response = await api.post<{ token: string; user: UserPublic }>(
        "/api/auth/signup",
        {
          name: "Test User",
          password: "password123",
          department_id: 1,
        },
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });

    it("should return 400 for invalid department", async () => {
      const userData = createUser({ department_id: 99999 });

      const response = await api.post<{ token: string; user: UserPublic }>(
        "/api/auth/signup",
        userData,
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });
  });
});

// ============================================================================
// Token Validation Tests (Requirements 1.7, 1.8)
// ============================================================================

describe("Authentication API - Token Validation", () => {
  describe("GET /api/auth/me", () => {
    it("should return user data for valid token (Req 1.7)", async () => {
      // First login to get a valid token
      const loginResult = await api.loginAsUser();

      const response = await api.get<{ user: UserPublic }>(
        "/api/auth/me",
        loginResult.token,
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      // Auth /me endpoint returns user directly, not wrapped in data
      const authResponse = response.data as unknown as {
        success: boolean;
        user?: UserPublic;
      };
      expect(authResponse.user).toBeDefined();
      expect(authResponse.user?.email).toBe(TEST_USERS.user.email);
    });

    it("should return 401 for invalid token (Req 1.8)", async () => {
      const response = await api.get<{ user: UserPublic }>(
        "/api/auth/me",
        "invalid-token-string",
      );

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });

    it("should return 401 for missing token (Req 1.8)", async () => {
      const response = await api.get<{ user: UserPublic }>("/api/auth/me");

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });

    it("should return 401 for malformed JWT token (Req 1.8)", async () => {
      const response = await api.get<{ user: UserPublic }>(
        "/api/auth/me",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature",
      );

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });
  });
});

// ============================================================================
// Password Change Tests (Requirements 1.9, 1.10)
// ============================================================================

describe("Authentication API - Password Change", () => {
  describe("POST /api/auth/change-password", () => {
    it("should allow password change with correct current password (Req 1.9)", async () => {
      // Create a new user for this test to avoid affecting other tests
      const userData = createUser();
      const signupResponse = await api.post<{
        token: string;
        user: UserPublic;
      }>("/api/auth/signup", userData);

      // Check if signup succeeded
      if (signupResponse.status !== 201) {
        console.log("Signup failed:", signupResponse.data);
      }
      expect(signupResponse.status).toBe(201);

      // Auth endpoints return token directly, not wrapped in data
      const authResponse = signupResponse.data as unknown as {
        success: boolean;
        token?: string;
        user?: UserPublic;
      };
      const token = authResponse.token;
      expect(token).toBeDefined();

      const response = await api.post<{ message: string }>(
        "/api/auth/change-password",
        {
          currentPassword: userData.password,
          newPassword: "newpassword123",
        },
        token,
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      // Verify new password works
      const loginResponse = await api.post<{ token: string; user: UserPublic }>(
        "/api/auth/login",
        {
          email: userData.email,
          password: "newpassword123",
        },
      );
      expect(loginResponse.status).toBe(200);
      expect(loginResponse.data.success).toBe(true);
    });

    it("should return 401 for incorrect current password (Req 1.10)", async () => {
      const loginResult = await api.loginAsUser();

      const response = await api.post<{ message: string }>(
        "/api/auth/change-password",
        {
          currentPassword: "wrongpassword",
          newPassword: "newpassword123",
        },
        loginResult.token,
      );

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
      expect(response.data.error).toBeDefined();
    });

    it("should return 401 for missing token", async () => {
      const response = await api.post<{ message: string }>(
        "/api/auth/change-password",
        {
          currentPassword: "anypassword",
          newPassword: "newpassword123",
        },
      );

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });

    it("should return 400 for new password less than 6 characters", async () => {
      const loginResult = await api.loginAsUser();

      const response = await api.post<{ message: string }>(
        "/api/auth/change-password",
        {
          currentPassword: TEST_USERS.user.password,
          newPassword: "12345",
        },
        loginResult.token,
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });

    it("should return 400 for missing current password", async () => {
      const loginResult = await api.loginAsUser();

      const response = await api.post<{ message: string }>(
        "/api/auth/change-password",
        {
          newPassword: "newpassword123",
        },
        loginResult.token,
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });
  });
});

// ============================================================================
// Property Tests
// ============================================================================

describe("Authentication API - Property Tests", () => {
  /**
   * Property 1: Authentication Token Validity
   *
   * For any valid user credentials, logging in should return a JWT token
   * that can be used to access protected endpoints, and using that token
   * with GET /api/auth/me should return the same user's data.
   *
   * **Validates: Requirements 1.1, 1.7**
   */
  describe("Property 1: Authentication Token Validity", () => {
    it("for any valid user, login token should work with /api/auth/me", async () => {
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
            // Login to get token
            const loginResponse = await api.post<{
              token: string;
              user: UserPublic;
            }>("/api/auth/login", credentials);

            // Verify login succeeded
            expect(loginResponse.status).toBe(200);
            expect(loginResponse.data.success).toBe(true);

            // Auth endpoints return token and user directly, not wrapped in data
            const authResponse = loginResponse.data as unknown as {
              success: boolean;
              token?: string;
              user?: UserPublic;
            };
            expect(authResponse.token).toBeDefined();

            const token = authResponse.token!;
            const loginUser = authResponse.user!;

            // Use token to access /api/auth/me
            const meResponse = await api.get<{ user: UserPublic }>(
              "/api/auth/me",
              token,
            );

            // Verify token works and returns same user
            expect(meResponse.status).toBe(200);
            expect(meResponse.data.success).toBe(true);

            // Auth /me endpoint returns user directly, not wrapped in data
            const meAuthResponse = meResponse.data as unknown as {
              success: boolean;
              user?: UserPublic;
            };
            expect(meAuthResponse.user).toBeDefined();
            expect(meAuthResponse.user?.id).toBe(loginUser.id);
            expect(meAuthResponse.user?.email).toBe(loginUser.email);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
