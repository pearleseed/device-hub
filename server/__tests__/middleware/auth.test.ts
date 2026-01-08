import { describe, it, expect, beforeEach } from "bun:test";
import {
  generateToken,
  verifyToken,
  hashPassword,
  verifyPassword,
  extractToken,
  authenticateRequest,
  requireAdmin,
} from "../../middleware/auth";
import {
  createMockRequest,
  createMockJWTPayload,
  createExpiredJWTPayload,
} from "../test-utils";

describe("Auth Middleware", () => {
  describe("generateToken", () => {
    it("should generate a valid JWT token", async () => {
      const token = await generateToken(1, "test@example.com", "user");

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3); // JWT has 3 parts
    });

    it("should generate different tokens for different users", async () => {
      const token1 = await generateToken(1, "user1@example.com", "user");
      const token2 = await generateToken(2, "user2@example.com", "user");

      expect(token1).not.toBe(token2);
    });

    it("should generate different tokens for different roles", async () => {
      const userToken = await generateToken(1, "test@example.com", "user");
      const adminToken = await generateToken(1, "test@example.com", "admin");

      expect(userToken).not.toBe(adminToken);
    });
  });

  describe("verifyToken", () => {
    it("should verify a valid token", async () => {
      const token = await generateToken(1, "test@example.com", "user");
      const payload = await verifyToken(token);

      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe(1);
      expect(payload?.email).toBe("test@example.com");
      expect(payload?.role).toBe("user");
    });

    it("should verify an admin token", async () => {
      const token = await generateToken(2, "admin@example.com", "admin");
      const payload = await verifyToken(token);

      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe(2);
      expect(payload?.role).toBe("admin");
    });

    it("should reject an invalid token", async () => {
      const payload = await verifyToken("invalid-token");
      expect(payload).toBeNull();
    });

    it("should reject a malformed token", async () => {
      const payload = await verifyToken("not.a.valid.jwt.token");
      expect(payload).toBeNull();
    });

    it("should reject a token with invalid signature", async () => {
      const token = await generateToken(1, "test@example.com", "user");
      const parts = token.split(".");
      // Modify the signature
      const tamperedToken = `${parts[0]}.${parts[1]}.tampered_signature`;

      const payload = await verifyToken(tamperedToken);
      expect(payload).toBeNull();
    });

    it("should reject an empty token", async () => {
      const payload = await verifyToken("");
      expect(payload).toBeNull();
    });
  });

  describe("hashPassword", () => {
    it("should hash a password", async () => {
      const password = "testPassword123";
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe("string");
      expect(hash).not.toBe(password);
      expect(hash).toContain(":"); // Salt:Hash format
    });

    it("should generate different hashes for the same password", async () => {
      const password = "testPassword123";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      // Due to random salt, hashes should be different
      expect(hash1).not.toBe(hash2);
    });

    it("should handle empty password", async () => {
      const hash = await hashPassword("");
      expect(hash).toBeDefined();
      expect(hash).toContain(":");
    });

    it("should handle special characters in password", async () => {
      const password = "p@$$w0rd!@#$%^&*()";
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).toContain(":");
    });

    it("should handle unicode characters in password", async () => {
      const password = "密码🔐";
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).toContain(":");
    });
  });

  describe("verifyPassword", () => {
    it("should verify a correct password", async () => {
      const password = "testPassword123";
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it("should reject an incorrect password", async () => {
      const password = "testPassword123";
      const hash = await hashPassword(password);

      const isValid = await verifyPassword("wrongPassword", hash);
      expect(isValid).toBe(false);
    });

    it("should reject with invalid hash format", async () => {
      const isValid = await verifyPassword(
        "password",
        "invalid-hash-without-colon",
      );
      expect(isValid).toBe(false);
    });

    it("should handle empty password verification", async () => {
      const hash = await hashPassword("actualPassword");
      const isValid = await verifyPassword("", hash);
      expect(isValid).toBe(false);
    });

    it("should verify password with special characters", async () => {
      const password = "p@$$w0rd!@#$%^&*()";
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it("should be case-sensitive", async () => {
      const password = "TestPassword";
      const hash = await hashPassword(password);

      const isValid = await verifyPassword("testpassword", hash);
      expect(isValid).toBe(false);
    });
  });

  describe("extractToken", () => {
    it("should extract token from valid Authorization header", () => {
      const request = createMockRequest("GET", "http://localhost/api/test", {
        headers: { Authorization: "Bearer my-token-123" },
      });

      const token = extractToken(request);
      expect(token).toBe("my-token-123");
    });

    it("should return null when Authorization header is missing", () => {
      const request = createMockRequest("GET", "http://localhost/api/test");

      const token = extractToken(request);
      expect(token).toBeNull();
    });

    it("should return null when Authorization header does not start with Bearer", () => {
      const request = createMockRequest("GET", "http://localhost/api/test", {
        headers: { Authorization: "Basic my-token-123" },
      });

      const token = extractToken(request);
      expect(token).toBeNull();
    });

    it('should return null when Authorization header is just "Bearer"', () => {
      const request = createMockRequest("GET", "http://localhost/api/test", {
        headers: { Authorization: "Bearer" },
      });

      const token = extractToken(request);
      expect(token).toBeNull();
    });

    it("should handle token with spaces correctly", () => {
      const request = createMockRequest("GET", "http://localhost/api/test", {
        headers: { Authorization: "Bearer token-with-no-spaces" },
      });

      const token = extractToken(request);
      expect(token).toBe("token-with-no-spaces");
    });
  });

  describe("authenticateRequest", () => {
    it("should authenticate a valid request", async () => {
      const token = await generateToken(1, "test@example.com", "user");
      const request = createMockRequest("GET", "http://localhost/api/test", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const payload = await authenticateRequest(request);

      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe(1);
      expect(payload?.email).toBe("test@example.com");
    });

    it("should return null for missing Authorization header", async () => {
      const request = createMockRequest("GET", "http://localhost/api/test");

      const payload = await authenticateRequest(request);
      expect(payload).toBeNull();
    });

    it("should return null for invalid token", async () => {
      const request = createMockRequest("GET", "http://localhost/api/test", {
        headers: { Authorization: "Bearer invalid-token" },
      });

      const payload = await authenticateRequest(request);
      expect(payload).toBeNull();
    });
  });

  describe("requireAdmin", () => {
    it("should return true for admin role", () => {
      const payload = createMockJWTPayload(1, "admin");
      expect(requireAdmin(payload)).toBe(true);
    });

    it("should return false for user role", () => {
      const payload = createMockJWTPayload(1, "user");
      expect(requireAdmin(payload)).toBe(false);
    });

    it("should return false for null payload", () => {
      expect(requireAdmin(null)).toBe(false);
    });
  });
});
