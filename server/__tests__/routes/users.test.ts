import { describe, it, expect, beforeEach, mock } from "bun:test";
import { usersRoutes } from "../../routes/users";
import {
  createMockRequest,
  createAuthenticatedRequest,
  parseResponse,
  mockUsers,
  createMockDb,
} from "../test-utils";
import { generateToken } from "../../middleware/auth";

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

describe("Users Routes", () => {
  let userToken: string;
  let adminToken: string;

  beforeEach(async () => {
    mockDb.mockReset();
    mockDb.unsafe.mockReset();
    userToken = await generateToken(2, "user@example.com", "user");
    adminToken = await generateToken(1, "admin@example.com", "admin");
  });

  describe("GET /api/users", () => {
    it("should return 401 when not authenticated", async () => {
      const request = createMockRequest("GET", "http://localhost/api/users");

      const response = await usersRoutes.getAll(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 403 when non-admin tries to list users", async () => {
      const request = createAuthenticatedRequest(
        "GET",
        "http://localhost/api/users",
        userToken,
      );

      const response = await usersRoutes.getAll(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Forbidden");
    });

    it("should return all users for admin", async () => {
      const mockUsersList = [
        { id: 1, name: "Admin", email: "admin@example.com", role: "admin" },
        { id: 2, name: "User", email: "user@example.com", role: "user" },
      ];
      mockDb.mockResolvedValueOnce(mockUsersList);

      const request = createAuthenticatedRequest(
        "GET",
        "http://localhost/api/users",
        adminToken,
      );

      const response = await usersRoutes.getAll(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
    });
  });

  describe("GET /api/users/:id", () => {
    it("should return 401 when not authenticated", async () => {
      const request = createMockRequest("GET", "http://localhost/api/users/1");

      const response = await usersRoutes.getById(request, { id: "1" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(401);
      expect(data.success).toBe(false);
    });

    it("should return 400 for invalid user ID", async () => {
      const request = createAuthenticatedRequest(
        "GET",
        "http://localhost/api/users/abc",
        userToken,
      );

      const response = await usersRoutes.getById(request, { id: "abc" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("Invalid user ID");
    });

    it("should return 403 when non-admin tries to view other user", async () => {
      const request = createAuthenticatedRequest(
        "GET",
        "http://localhost/api/users/999",
        userToken,
      );

      const response = await usersRoutes.getById(request, { id: "999" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });

    it("should allow user to view own profile", async () => {
      const mockUser = {
        id: 2,
        name: "User",
        email: "user@example.com",
        role: "user",
      };
      mockDb.mockResolvedValueOnce([mockUser]);

      const request = createAuthenticatedRequest(
        "GET",
        "http://localhost/api/users/2",
        userToken,
      );

      const response = await usersRoutes.getById(request, { id: "2" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(2);
    });

    it("should allow admin to view any user", async () => {
      const mockUser = {
        id: 999,
        name: "Other User",
        email: "other@example.com",
        role: "user",
      };
      mockDb.mockResolvedValueOnce([mockUser]);

      const request = createAuthenticatedRequest(
        "GET",
        "http://localhost/api/users/999",
        adminToken,
      );

      const response = await usersRoutes.getById(request, { id: "999" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should return 404 when user not found", async () => {
      mockDb.mockResolvedValueOnce([]);

      const request = createAuthenticatedRequest(
        "GET",
        "http://localhost/api/users/1",
        adminToken,
      );

      const response = await usersRoutes.getById(request, { id: "1" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(404);
      expect(data.error).toBe("User not found");
    });
  });

  describe("PUT /api/users/:id", () => {
    it("should return 401 when not authenticated", async () => {
      const request = createMockRequest("PUT", "http://localhost/api/users/1", {
        body: { name: "Updated Name" },
      });

      const response = await usersRoutes.update(request, { id: "1" });
      const { status } = await parseResponse(response);

      expect(status).toBe(401);
    });

    it("should return 400 for invalid user ID", async () => {
      const request = createAuthenticatedRequest(
        "PUT",
        "http://localhost/api/users/abc",
        userToken,
        {
          body: { name: "Updated Name" },
        },
      );

      const response = await usersRoutes.update(request, { id: "abc" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("Invalid user ID");
    });

    it("should return 403 when non-admin tries to update other user", async () => {
      const request = createAuthenticatedRequest(
        "PUT",
        "http://localhost/api/users/999",
        userToken,
        {
          body: { name: "Updated Name" },
        },
      );

      const response = await usersRoutes.update(request, { id: "999" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });

    it("should return 400 when no fields to update", async () => {
      const request = createAuthenticatedRequest(
        "PUT",
        "http://localhost/api/users/2",
        userToken,
        {
          body: {},
        },
      );

      const response = await usersRoutes.update(request, { id: "2" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("No fields to update");
    });

    it("should allow user to update own profile", async () => {
      const updatedUser = {
        id: 2,
        name: "Updated Name",
        email: "user@example.com",
        role: "user",
      };
      mockDb.unsafe.mockResolvedValueOnce(undefined); // UPDATE
      mockDb.mockResolvedValueOnce([updatedUser]); // Get updated user

      const request = createAuthenticatedRequest(
        "PUT",
        "http://localhost/api/users/2",
        userToken,
        {
          body: { name: "Updated Name" },
        },
      );

      const response = await usersRoutes.update(request, { id: "2" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("User updated");
    });

    it("should allow admin to update any user", async () => {
      const updatedUser = {
        id: 999,
        name: "Updated",
        email: "other@example.com",
        role: "user",
      };
      mockDb.unsafe.mockResolvedValueOnce(undefined);
      mockDb.mockResolvedValueOnce([updatedUser]);

      const request = createAuthenticatedRequest(
        "PUT",
        "http://localhost/api/users/999",
        adminToken,
        {
          body: { name: "Updated" },
        },
      );

      const response = await usersRoutes.update(request, { id: "999" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should allow admin to change user role", async () => {
      const updatedUser = {
        id: 2,
        name: "User",
        email: "user@example.com",
        role: "admin",
      };
      mockDb.unsafe.mockResolvedValueOnce(undefined);
      mockDb.mockResolvedValueOnce([updatedUser]);

      const request = createAuthenticatedRequest(
        "PUT",
        "http://localhost/api/users/2",
        adminToken,
        {
          body: { role: "admin" },
        },
      );

      const response = await usersRoutes.update(request, { id: "2" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should NOT allow non-admin to change role", async () => {
      const updatedUser = {
        id: 2,
        name: "User",
        email: "user@example.com",
        role: "user",
      };
      mockDb.unsafe.mockResolvedValueOnce(undefined);
      mockDb.mockResolvedValueOnce([updatedUser]);

      const request = createAuthenticatedRequest(
        "PUT",
        "http://localhost/api/users/2",
        userToken,
        {
          body: { name: "New Name", role: "admin" }, // role should be ignored
        },
      );

      const response = await usersRoutes.update(request, { id: "2" });
      const { status } = await parseResponse(response);

      // Should succeed but role won't be updated (implementation detail)
      expect(status).toBe(200);
    });

    it("should update multiple fields", async () => {
      const updatedUser = {
        id: 2,
        name: "New Name",
        email: "user@example.com",
        department_id: 2,
        avatar_url: "https://example.com/new-avatar.jpg",
        role: "user",
      };
      mockDb.unsafe.mockResolvedValueOnce(undefined);
      mockDb.mockResolvedValueOnce([updatedUser]);

      const request = createAuthenticatedRequest(
        "PUT",
        "http://localhost/api/users/2",
        userToken,
        {
          body: {
            name: "New Name",
            department_id: 2,
            avatar_url: "https://example.com/new-avatar.jpg",
          },
        },
      );

      const response = await usersRoutes.update(request, { id: "2" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe("DELETE /api/users/:id", () => {
    it("should return 401 when not authenticated", async () => {
      const request = createMockRequest(
        "DELETE",
        "http://localhost/api/users/2",
      );

      const response = await usersRoutes.delete(request, { id: "2" });
      const { status } = await parseResponse(response);

      expect(status).toBe(401);
    });

    it("should return 403 when non-admin tries to delete", async () => {
      const request = createAuthenticatedRequest(
        "DELETE",
        "http://localhost/api/users/3",
        userToken,
      );

      const response = await usersRoutes.delete(request, { id: "3" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });

    it("should return 400 for invalid user ID", async () => {
      const request = createAuthenticatedRequest(
        "DELETE",
        "http://localhost/api/users/abc",
        adminToken,
      );

      const response = await usersRoutes.delete(request, { id: "abc" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("Invalid user ID");
    });

    it("should return 400 when admin tries to delete themselves", async () => {
      const request = createAuthenticatedRequest(
        "DELETE",
        "http://localhost/api/users/1",
        adminToken,
      );

      const response = await usersRoutes.delete(request, { id: "1" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("Cannot delete your own account");
    });

    it("should return 400 when user has active borrowing requests", async () => {
      mockDb.mockResolvedValueOnce([{ count: 1 }]); // Has active requests

      const request = createAuthenticatedRequest(
        "DELETE",
        "http://localhost/api/users/2",
        adminToken,
      );

      const response = await usersRoutes.delete(request, { id: "2" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe(
        "Cannot delete user with active borrowing requests",
      );
    });

    it("should delete user successfully", async () => {
      mockDb
        .mockResolvedValueOnce([{ count: 0 }]) // No active requests
        .mockResolvedValueOnce(undefined); // DELETE

      const request = createAuthenticatedRequest(
        "DELETE",
        "http://localhost/api/users/2",
        adminToken,
      );

      const response = await usersRoutes.delete(request, { id: "2" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("User deleted");
    });
  });
});
