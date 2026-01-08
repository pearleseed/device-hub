import { describe, it, expect, beforeEach, mock } from "bun:test";
import { departmentsRoutes } from "../../routes/departments";
import {
  createMockRequest,
  createAuthenticatedRequest,
  parseResponse,
  mockDepartments,
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

describe("Departments Routes", () => {
  let userToken: string;
  let adminToken: string;

  beforeEach(async () => {
    mockDb.mockReset();
    mockDb.unsafe.mockReset();
    userToken = await generateToken(2, "user@example.com", "user");
    adminToken = await generateToken(1, "admin@example.com", "admin");
  });

  describe("GET /api/departments", () => {
    it("should return all departments (public endpoint)", async () => {
      mockDb.mockResolvedValueOnce(mockDepartments);

      const request = createMockRequest(
        "GET",
        "http://localhost/api/departments",
      );

      const response = await departmentsRoutes.getAll(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
    });

    it("should return departments sorted by name", async () => {
      const departments = [
        { id: 2, name: "Marketing", code: "MKT" },
        { id: 1, name: "Engineering", code: "ENG" },
      ];
      mockDb.mockResolvedValueOnce(departments);

      const request = createMockRequest(
        "GET",
        "http://localhost/api/departments",
      );

      const response = await departmentsRoutes.getAll(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.data).toHaveLength(2);
    });
  });

  describe("GET /api/departments/:id", () => {
    it("should return department by ID", async () => {
      mockDb.mockResolvedValueOnce([mockDepartments[0]]);

      const request = createMockRequest(
        "GET",
        "http://localhost/api/departments/1",
      );

      const response = await departmentsRoutes.getById(request, { id: "1" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(1);
      expect(data.data.name).toBe("Engineering");
    });

    it("should return 400 for invalid ID", async () => {
      const request = createMockRequest(
        "GET",
        "http://localhost/api/departments/abc",
      );

      const response = await departmentsRoutes.getById(request, { id: "abc" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("Invalid department ID");
    });

    it("should return 404 when department not found", async () => {
      mockDb.mockResolvedValueOnce([]);

      const request = createMockRequest(
        "GET",
        "http://localhost/api/departments/999",
      );

      const response = await departmentsRoutes.getById(request, { id: "999" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(404);
      expect(data.error).toBe("Department not found");
    });
  });

  describe("POST /api/departments", () => {
    it("should return 401 when not authenticated", async () => {
      const request = createMockRequest(
        "POST",
        "http://localhost/api/departments",
        {
          body: { name: "New Department", code: "NEW" },
        },
      );

      const response = await departmentsRoutes.create(request);
      const { status } = await parseResponse(response);

      expect(status).toBe(401);
    });

    it("should return 401 when non-admin tries to create", async () => {
      const request = createAuthenticatedRequest(
        "POST",
        "http://localhost/api/departments",
        userToken,
        {
          body: { name: "New Department", code: "NEW" },
        },
      );

      const response = await departmentsRoutes.create(request);
      const { status } = await parseResponse(response);

      expect(status).toBe(401);
    });

    it("should return 400 when name is missing", async () => {
      const request = createAuthenticatedRequest(
        "POST",
        "http://localhost/api/departments",
        adminToken,
        {
          body: { code: "NEW" },
        },
      );

      const response = await departmentsRoutes.create(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("Name is required");
    });

    it("should return 400 when code is missing", async () => {
      const request = createAuthenticatedRequest(
        "POST",
        "http://localhost/api/departments",
        adminToken,
        {
          body: { name: "New Department" },
        },
      );

      const response = await departmentsRoutes.create(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("Code is required");
    });

    it("should return 400 when code already exists", async () => {
      mockDb.mockResolvedValueOnce([{ id: 1 }]); // Existing code

      const request = createAuthenticatedRequest(
        "POST",
        "http://localhost/api/departments",
        adminToken,
        {
          body: { name: "Engineering 2", code: "ENG" },
        },
      );

      const response = await departmentsRoutes.create(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("Department code already exists");
    });

    it("should create department successfully", async () => {
      const newDepartment = {
        id: 3,
        name: "Sales",
        code: "SLS",
        created_at: new Date(),
      };
      mockDb
        .mockResolvedValueOnce([]) // No existing code
        .mockResolvedValueOnce(undefined) // INSERT
        .mockResolvedValueOnce([newDepartment]); // Get created department

      const request = createAuthenticatedRequest(
        "POST",
        "http://localhost/api/departments",
        adminToken,
        {
          body: { name: "Sales", code: "SLS" },
        },
      );

      const response = await departmentsRoutes.create(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message).toBe("Department created");
    });

    it("should uppercase department code", async () => {
      const newDepartment = {
        id: 3,
        name: "Sales",
        code: "SLS",
        created_at: new Date(),
      };
      mockDb
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce([newDepartment]);

      const request = createAuthenticatedRequest(
        "POST",
        "http://localhost/api/departments",
        adminToken,
        {
          body: { name: "Sales", code: "sls" },
        },
      );

      const response = await departmentsRoutes.create(request);
      const { status } = await parseResponse(response);

      expect(status).toBe(201);
    });
  });

  describe("PUT /api/departments/:id", () => {
    it("should return 401 when not authenticated", async () => {
      const request = createMockRequest(
        "PUT",
        "http://localhost/api/departments/1",
        {
          body: { name: "Updated Name" },
        },
      );

      const response = await departmentsRoutes.update(request, { id: "1" });
      const { status } = await parseResponse(response);

      expect(status).toBe(401);
    });

    it("should return 401 when non-admin tries to update", async () => {
      const request = createAuthenticatedRequest(
        "PUT",
        "http://localhost/api/departments/1",
        userToken,
        {
          body: { name: "Updated Name" },
        },
      );

      const response = await departmentsRoutes.update(request, { id: "1" });
      const { status } = await parseResponse(response);

      expect(status).toBe(401);
    });

    it("should return 400 for invalid ID", async () => {
      const request = createAuthenticatedRequest(
        "PUT",
        "http://localhost/api/departments/abc",
        adminToken,
        {
          body: { name: "Updated Name" },
        },
      );

      const response = await departmentsRoutes.update(request, { id: "abc" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("Invalid department ID");
    });

    it("should return 400 when no fields to update", async () => {
      const request = createAuthenticatedRequest(
        "PUT",
        "http://localhost/api/departments/1",
        adminToken,
        {
          body: {},
        },
      );

      const response = await departmentsRoutes.update(request, { id: "1" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("No fields to update");
    });

    it("should return 400 when duplicate code", async () => {
      mockDb.mockResolvedValueOnce([{ id: 2 }]); // Code exists for different department

      const request = createAuthenticatedRequest(
        "PUT",
        "http://localhost/api/departments/1",
        adminToken,
        {
          body: { code: "MKT" },
        },
      );

      const response = await departmentsRoutes.update(request, { id: "1" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("Department code already exists");
    });

    it("should update department successfully", async () => {
      const updatedDept = {
        id: 1,
        name: "Updated Engineering",
        code: "ENG",
        created_at: new Date(),
      };
      mockDb.unsafe.mockResolvedValueOnce(undefined);
      mockDb.mockResolvedValueOnce([updatedDept]);

      const request = createAuthenticatedRequest(
        "PUT",
        "http://localhost/api/departments/1",
        adminToken,
        {
          body: { name: "Updated Engineering" },
        },
      );

      const response = await departmentsRoutes.update(request, { id: "1" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("Department updated");
    });
  });

  describe("DELETE /api/departments/:id", () => {
    it("should return 401 when not authenticated", async () => {
      const request = createMockRequest(
        "DELETE",
        "http://localhost/api/departments/1",
      );

      const response = await departmentsRoutes.delete(request, { id: "1" });
      const { status } = await parseResponse(response);

      expect(status).toBe(401);
    });

    it("should return 401 when non-admin tries to delete", async () => {
      const request = createAuthenticatedRequest(
        "DELETE",
        "http://localhost/api/departments/1",
        userToken,
      );

      const response = await departmentsRoutes.delete(request, { id: "1" });
      const { status } = await parseResponse(response);

      expect(status).toBe(401);
    });

    it("should return 400 for invalid ID", async () => {
      const request = createAuthenticatedRequest(
        "DELETE",
        "http://localhost/api/departments/abc",
        adminToken,
      );

      const response = await departmentsRoutes.delete(request, { id: "abc" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("Invalid department ID");
    });

    it("should return 400 when department has users", async () => {
      mockDb.mockResolvedValueOnce([{ user_count: 5, equipment_count: 0 }]); // Has users

      const request = createAuthenticatedRequest(
        "DELETE",
        "http://localhost/api/departments/1",
        adminToken,
      );

      const response = await departmentsRoutes.delete(request, { id: "1" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe(
        "Cannot delete department with users or equipment",
      );
    });

    it("should return 400 when department has equipment", async () => {
      mockDb.mockResolvedValueOnce([{ user_count: 0, equipment_count: 3 }]); // Has equipment

      const request = createAuthenticatedRequest(
        "DELETE",
        "http://localhost/api/departments/1",
        adminToken,
      );

      const response = await departmentsRoutes.delete(request, { id: "1" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe(
        "Cannot delete department with users or equipment",
      );
    });

    it("should delete department successfully", async () => {
      mockDb
        .mockResolvedValueOnce([{ user_count: 0, equipment_count: 0 }]) // No users or equipment
        .mockResolvedValueOnce(undefined); // DELETE

      const request = createAuthenticatedRequest(
        "DELETE",
        "http://localhost/api/departments/1",
        adminToken,
      );

      const response = await departmentsRoutes.delete(request, { id: "1" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("Department deleted");
    });
  });
});
