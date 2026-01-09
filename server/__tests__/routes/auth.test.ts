import { describe, it, expect, beforeEach, mock } from "bun:test";
import { authRoutes } from "../../routes/auth";
import {
  createMockRequest,
  createAuthenticatedRequest,
  parseResponse,
  createMockDb,
} from "../test-utils";
import { generateToken, hashPassword } from "../../middleware/auth";

// Create mock database instance
const { mockDb } = createMockDb();

// Mock the database module with new connection features
mock.module("../../db/connection", () => ({
  db: mockDb,
  checkConnection: mock(async () => true),
  getPoolStatus: mock(async () => ({
    active: 2,
    idle: 18,
    total: 20,
    healthy: true,
  })),
  closeConnection: mock(async () => {}),
  withRetry: mock(async <T>(operation: () => Promise<T>) => operation()),
  DatabaseError: class DatabaseError extends Error {
    constructor(
      message: string,
      public readonly code?: string,
    ) {
      super(message);
      this.name = "DatabaseError";
    }
  },
}));

describe("Auth Routes", () => {
  beforeEach(() => {
    mockDb.mockReset();
  });

  describe("POST /api/auth/login", () => {
    it("should return 400 when email is missing", async () => {
      const request = createMockRequest(
        "POST",
        "http://localhost/api/auth/login",
        {
          body: { password: "password123" },
        },
      );

      const response = await authRoutes.login(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Email and password are required");
    });

    it("should return 400 when password is missing", async () => {
      const request = createMockRequest(
        "POST",
        "http://localhost/api/auth/login",
        {
          body: { email: "test@example.com" },
        },
      );

      const response = await authRoutes.login(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Email and password are required");
    });

    it("should return 401 when user is not found", async () => {
      mockDb.mockResolvedValueOnce([]); // No user found

      const request = createMockRequest(
        "POST",
        "http://localhost/api/auth/login",
        {
          body: { email: "nonexistent@example.com", password: "password123" },
        },
      );

      const response = await authRoutes.login(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid email or password");
    });

    it("should return 401 when password is incorrect", async () => {
      const hashedPassword = await hashPassword("correctPassword");
      mockDb.mockResolvedValueOnce([
        {
          id: 1,
          email: "test@example.com",
          password_hash: hashedPassword,
          role: "user",
        },
      ]);

      const request = createMockRequest(
        "POST",
        "http://localhost/api/auth/login",
        {
          body: { email: "test@example.com", password: "wrongPassword" },
        },
      );

      const response = await authRoutes.login(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid email or password");
    });

    it("should return token and user on successful login", async () => {
      const hashedPassword = await hashPassword("password123");
      const mockUser = {
        id: 1,
        email: "test@example.com",
        password_hash: hashedPassword,
        role: "user",
        name: "Test User",
      };
      const mockUserPublic = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        role: "user",
        department_name: "Engineering",
      };

      mockDb
        .mockResolvedValueOnce([mockUser]) // User lookup
        .mockResolvedValueOnce([mockUserPublic]); // Public user view

      const request = createMockRequest(
        "POST",
        "http://localhost/api/auth/login",
        {
          body: { email: "test@example.com", password: "password123" },
        },
      );

      const response = await authRoutes.login(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.token).toBeDefined();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe("test@example.com");
    });

    it("should normalize email to lowercase", async () => {
      const hashedPassword = await hashPassword("password123");
      const mockUser = {
        id: 1,
        email: "test@example.com",
        password_hash: hashedPassword,
        role: "user",
      };
      const mockUserPublic = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        role: "user",
      };

      mockDb
        .mockResolvedValueOnce([mockUser])
        .mockResolvedValueOnce([mockUserPublic]);

      const request = createMockRequest(
        "POST",
        "http://localhost/api/auth/login",
        {
          body: { email: "TEST@EXAMPLE.COM", password: "password123" },
        },
      );

      const response = await authRoutes.login(request);
      const { status } = await parseResponse(response);

      expect(status).toBe(200);
    });
  });

  describe("POST /api/auth/signup", () => {
    it("should return 400 when name is missing", async () => {
      const request = createMockRequest(
        "POST",
        "http://localhost/api/auth/signup",
        {
          body: {
            email: "new@example.com",
            password: "password123",
            department_id: 1,
          },
        },
      );

      const response = await authRoutes.signup(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Name is required");
    });

    it("should return 400 when email is missing", async () => {
      const request = createMockRequest(
        "POST",
        "http://localhost/api/auth/signup",
        {
          body: { name: "New User", password: "password123", department_id: 1 },
        },
      );

      const response = await authRoutes.signup(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Email is required");
    });

    it("should return 400 when password is too short", async () => {
      const request = createMockRequest(
        "POST",
        "http://localhost/api/auth/signup",
        {
          body: {
            name: "New User",
            email: "new@example.com",
            password: "123",
            department_id: 1,
          },
        },
      );

      const response = await authRoutes.signup(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Password must be at least 6 characters");
    });

    it("should return 400 when department_id is missing", async () => {
      const request = createMockRequest(
        "POST",
        "http://localhost/api/auth/signup",
        {
          body: {
            name: "New User",
            email: "new@example.com",
            password: "password123",
          },
        },
      );

      const response = await authRoutes.signup(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Department is required");
    });

    it("should return 400 when email already exists", async () => {
      mockDb.mockResolvedValueOnce([{ id: 1 }]); // Existing user

      const request = createMockRequest(
        "POST",
        "http://localhost/api/auth/signup",
        {
          body: {
            name: "New User",
            email: "existing@example.com",
            password: "password123",
            department_id: 1,
          },
        },
      );

      const response = await authRoutes.signup(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("An account with this email already exists");
    });

    it("should return 400 when department does not exist", async () => {
      mockDb
        .mockResolvedValueOnce([]) // No existing user
        .mockResolvedValueOnce([]); // No department found

      const request = createMockRequest(
        "POST",
        "http://localhost/api/auth/signup",
        {
          body: {
            name: "New User",
            email: "new@example.com",
            password: "password123",
            department_id: 999,
          },
        },
      );

      const response = await authRoutes.signup(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid department");
    });

    it("should create user and return token on success", async () => {
      const newUser = {
        id: 5,
        email: "new@example.com",
        name: "New User",
        role: "user",
        department_id: 1,
      };
      const newUserPublic = {
        ...newUser,
        department_name: "Engineering",
      };

      mockDb
        .mockResolvedValueOnce([]) // No existing user
        .mockResolvedValueOnce([{ id: 1 }]) // Department exists
        .mockResolvedValueOnce(undefined) // INSERT
        .mockResolvedValueOnce([newUser]) // Get created user
        .mockResolvedValueOnce([newUserPublic]); // Get public view

      const request = createMockRequest(
        "POST",
        "http://localhost/api/auth/signup",
        {
          body: {
            name: "New User",
            email: "new@example.com",
            password: "password123",
            department_id: 1,
          },
        },
      );

      const response = await authRoutes.signup(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.token).toBeDefined();
      expect(data.user).toBeDefined();
    });
  });

  describe("GET /api/auth/me", () => {
    it("should return 401 when not authenticated", async () => {
      const request = createMockRequest("GET", "http://localhost/api/auth/me");

      const response = await authRoutes.me(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 401 with invalid token", async () => {
      const request = createMockRequest("GET", "http://localhost/api/auth/me", {
        headers: { Authorization: "Bearer invalid-token" },
      });

      const response = await authRoutes.me(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(401);
      expect(data.success).toBe(false);
    });

    it("should return user data with valid token", async () => {
      const token = await generateToken(1, "test@example.com", "user");
      const mockUserPublic = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        role: "user",
        department_name: "Engineering",
      };

      mockDb.mockResolvedValueOnce([mockUserPublic]);

      const request = createAuthenticatedRequest(
        "GET",
        "http://localhost/api/auth/me",
        token,
      );

      const response = await authRoutes.me(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.user.id).toBe(1);
      expect(data.user.email).toBe("test@example.com");
    });

    it("should return 404 when user not found", async () => {
      const token = await generateToken(999, "deleted@example.com", "user");
      mockDb.mockResolvedValueOnce([]); // User not found

      const request = createAuthenticatedRequest(
        "GET",
        "http://localhost/api/auth/me",
        token,
      );

      const response = await authRoutes.me(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe("User not found");
    });
  });
});
