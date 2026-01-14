import { describe, it, expect } from "vitest";
import { 
  generateToken, 
  verifyToken, 
  hashPassword, 
  verifyPassword,
} from "../../server/middleware/auth";
import type { JWTPayload, UserRole } from "../../server/types";

describe("Modern Auth Middleware", () => {
  const mockUser = {
    id: 123,
    email: "test@example.com",
    role: "user" as UserRole,
  };

  describe("JWT Handling (jose)", () => {
    it("should generate a valid JWT token", async () => {
      const token = await generateToken(mockUser.id, mockUser.email, mockUser.role);
      expect(token).toEqual(expect.any(String));
      expect(token.split(".").length).toBe(3);
    });

    it("should verify a valid JWT token and return payload", async () => {
      const token = await generateToken(mockUser.id, mockUser.email, mockUser.role);
      const payload = await verifyToken(token);
      
      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe(mockUser.id);
      expect(payload?.email).toBe(mockUser.email);
      expect(payload?.role).toBe(mockUser.role);
      expect(payload?.exp).toBeGreaterThan(0);
    });

    it("should return null for invalid token", async () => {
      const payload = await verifyToken("invalid.token.here");
      expect(payload).toBeNull();
    });

    it("should respect expiration (mocked)", async () => {
        // We can't easily mock time with bun:test natively like jest, 
        // but we can verify the exp claim is set correctly for default vs rememberMe
        const tokenDefault = await generateToken(mockUser.id, mockUser.email, mockUser.role, false);
        const payloadDefault = await verifyToken(tokenDefault);
        
        const tokenRemember = await generateToken(mockUser.id, mockUser.email, mockUser.role, true);
        const payloadRemember = await verifyToken(tokenRemember);

        // approximate checks (default 24h, remember 30d)
        const now = Math.floor(Date.now() / 1000);
        const day = 24 * 60 * 60;
        
        expect(payloadDefault?.exp).toBeGreaterThan(now + day - 100);
        expect(payloadDefault?.exp).toBeLessThan(now + day + 100);

        expect(payloadRemember?.exp).toBeGreaterThan(now + 30 * day - 100);
        expect(payloadRemember?.exp).toBeLessThan(now + 30 * day + 100);
    });
  });

  describe("Password Hashing (Argon2id)", () => {
    it("should hash password using Argon2id", async () => {
      const password = "mySecurePassword123!";
      const hash = await hashPassword(password);
      
      expect(hash).toEqual(expect.any(String));
      expect(hash).toContain("$argon2id$"); // standard Argon2id prefix
    });

    it("should verify correct password with Argon2id hash", async () => {
      const password = "password123";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);
      
      expect(isValid).toBe(true);
    });

    it("should reject incorrect password with Argon2id hash", async () => {
      const password = "password123";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword("wrongpassword", hash);
      
      expect(isValid).toBe(false);
    });
  });


});
