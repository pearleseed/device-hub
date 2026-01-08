import { describe, it, expect, beforeEach, mock } from "bun:test";
import { borrowingRoutes } from "../../routes/borrowing";
import {
  createMockRequest,
  createAuthenticatedRequest,
  parseResponse,
  createMockDb,
} from "../test-utils";
import { generateToken } from "../../middleware/auth";

// Create mock database instance
const { mockDb, mockTx } = createMockDb();

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
  withTransaction: mock(async <T>(operation: (tx: unknown) => Promise<T>) =>
    mockDb.begin(operation),
  ),
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

describe("Borrowing Routes", () => {
  let userToken: string;
  let adminToken: string;

  beforeEach(async () => {
    mockDb.mockReset();
    mockTx.mockReset();
    userToken = await generateToken(2, "user@example.com", "user");
    adminToken = await generateToken(1, "admin@example.com", "admin");
  });

  describe("GET /api/borrowing", () => {
    it("should return 401 when not authenticated", async () => {
      const request = createMockRequest(
        "GET",
        "http://localhost/api/borrowing",
      );

      const response = await borrowingRoutes.getAll(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return all requests for admin", async () => {
      const mockRequests = [
        { id: 1, equipment_id: 1, user_id: 2, status: "pending" },
        { id: 2, equipment_id: 2, user_id: 3, status: "active" },
      ];
      mockDb.unsafe.mockResolvedValueOnce(mockRequests);

      const request = createAuthenticatedRequest(
        "GET",
        "http://localhost/api/borrowing",
        adminToken,
      );

      const response = await borrowingRoutes.getAll(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
    });

    it("should return only user own requests for non-admin", async () => {
      const mockRequests = [
        { id: 1, equipment_id: 1, user_id: 2, status: "pending" },
      ];
      mockDb.unsafe.mockResolvedValueOnce(mockRequests);

      const request = createAuthenticatedRequest(
        "GET",
        "http://localhost/api/borrowing",
        userToken,
      );

      const response = await borrowingRoutes.getAll(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should filter by status", async () => {
      mockDb.unsafe.mockResolvedValueOnce([]);

      const request = createAuthenticatedRequest(
        "GET",
        "http://localhost/api/borrowing?status=pending",
        adminToken,
      );

      const response = await borrowingRoutes.getAll(request);
      const { status } = await parseResponse(response);

      expect(status).toBe(200);
    });

    it("should filter by equipment_id", async () => {
      mockDb.unsafe.mockResolvedValueOnce([]);

      const request = createAuthenticatedRequest(
        "GET",
        "http://localhost/api/borrowing?equipment_id=1",
        adminToken,
      );

      const response = await borrowingRoutes.getAll(request);
      const { status } = await parseResponse(response);

      expect(status).toBe(200);
    });
  });

  describe("GET /api/borrowing/:id", () => {
    it("should return 401 when not authenticated", async () => {
      const request = createMockRequest(
        "GET",
        "http://localhost/api/borrowing/1",
      );

      const response = await borrowingRoutes.getById(request, { id: "1" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(401);
      expect(data.success).toBe(false);
    });

    it("should return 400 for invalid ID", async () => {
      const request = createAuthenticatedRequest(
        "GET",
        "http://localhost/api/borrowing/abc",
        userToken,
      );

      const response = await borrowingRoutes.getById(request, { id: "abc" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("Invalid request ID");
    });

    it("should return 404 when request not found", async () => {
      mockDb.mockResolvedValueOnce([]);

      const request = createAuthenticatedRequest(
        "GET",
        "http://localhost/api/borrowing/999",
        userToken,
      );

      const response = await borrowingRoutes.getById(request, { id: "999" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(404);
      expect(data.error).toBe("Request not found");
    });

    it("should return 403 when non-admin tries to view other user request", async () => {
      const mockRequest = {
        id: 1,
        equipment_id: 1,
        user_id: 999,
        status: "pending",
      };
      mockDb.mockResolvedValueOnce([mockRequest]);

      const request = createAuthenticatedRequest(
        "GET",
        "http://localhost/api/borrowing/1",
        userToken,
      );

      const response = await borrowingRoutes.getById(request, { id: "1" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });

    it("should return request for admin viewing any request", async () => {
      const mockRequest = {
        id: 1,
        equipment_id: 1,
        user_id: 999,
        status: "pending",
      };
      mockDb.mockResolvedValueOnce([mockRequest]);

      const request = createAuthenticatedRequest(
        "GET",
        "http://localhost/api/borrowing/1",
        adminToken,
      );

      const response = await borrowingRoutes.getById(request, { id: "1" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(1);
    });
  });

  describe("POST /api/borrowing", () => {
    it("should return 401 when not authenticated", async () => {
      const request = createMockRequest(
        "POST",
        "http://localhost/api/borrowing",
        {
          body: {
            equipment_id: 1,
            start_date: "2024-02-01",
            end_date: "2024-02-15",
            reason: "Testing",
          },
        },
      );

      const response = await borrowingRoutes.create(request);
      const { status } = await parseResponse(response);

      expect(status).toBe(401);
    });

    it("should return 400 when equipment_id is missing", async () => {
      const request = createAuthenticatedRequest(
        "POST",
        "http://localhost/api/borrowing",
        userToken,
        {
          body: {
            start_date: "2024-02-01",
            end_date: "2024-02-15",
            reason: "Testing",
          },
        },
      );

      const response = await borrowingRoutes.create(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("Equipment ID is required");
    });

    it("should return 400 when start_date is missing", async () => {
      const request = createAuthenticatedRequest(
        "POST",
        "http://localhost/api/borrowing",
        userToken,
        {
          body: { equipment_id: 1, end_date: "2024-02-15", reason: "Testing" },
        },
      );

      const response = await borrowingRoutes.create(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("Start date is required");
    });

    it("should return 400 when end_date is missing", async () => {
      const request = createAuthenticatedRequest(
        "POST",
        "http://localhost/api/borrowing",
        userToken,
        {
          body: {
            equipment_id: 1,
            start_date: "2024-02-01",
            reason: "Testing",
          },
        },
      );

      const response = await borrowingRoutes.create(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("End date is required");
    });

    it("should return 400 when reason is missing", async () => {
      const request = createAuthenticatedRequest(
        "POST",
        "http://localhost/api/borrowing",
        userToken,
        {
          body: {
            equipment_id: 1,
            start_date: "2024-02-01",
            end_date: "2024-02-15",
          },
        },
      );

      const response = await borrowingRoutes.create(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("Reason is required");
    });

    it("should return 400 when end_date is before start_date", async () => {
      const request = createAuthenticatedRequest(
        "POST",
        "http://localhost/api/borrowing",
        userToken,
        {
          body: {
            equipment_id: 1,
            start_date: "2024-02-15",
            end_date: "2024-02-01",
            reason: "Testing",
          },
        },
      );

      const response = await borrowingRoutes.create(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("End date must be after start date");
    });

    it("should return 404 when equipment not found", async () => {
      mockDb.mockResolvedValueOnce([]); // Equipment not found

      const request = createAuthenticatedRequest(
        "POST",
        "http://localhost/api/borrowing",
        userToken,
        {
          body: {
            equipment_id: 999,
            start_date: "2024-02-01",
            end_date: "2024-02-15",
            reason: "Testing",
          },
        },
      );

      const response = await borrowingRoutes.create(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(404);
      expect(data.error).toBe("Equipment not found");
    });

    it("should return 400 when equipment is not available", async () => {
      mockDb.mockResolvedValueOnce([{ id: 1, status: "borrowed" }]); // Equipment borrowed

      const request = createAuthenticatedRequest(
        "POST",
        "http://localhost/api/borrowing",
        userToken,
        {
          body: {
            equipment_id: 1,
            start_date: "2024-02-01",
            end_date: "2024-02-15",
            reason: "Testing",
          },
        },
      );

      const response = await borrowingRoutes.create(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("Equipment is not available");
    });

    it("should return 400 when there are date conflicts", async () => {
      mockDb
        .mockResolvedValueOnce([{ id: 1, status: "available" }]) // Equipment available
        .mockResolvedValueOnce([{ count: 1 }]); // Conflicting booking

      const request = createAuthenticatedRequest(
        "POST",
        "http://localhost/api/borrowing",
        userToken,
        {
          body: {
            equipment_id: 1,
            start_date: "2024-02-01",
            end_date: "2024-02-15",
            reason: "Testing",
          },
        },
      );

      const response = await borrowingRoutes.create(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("Equipment is already booked for this period");
    });

    it("should create borrowing request on success", async () => {
      const newRequest = {
        id: 1,
        equipment_id: 1,
        user_id: 2,
        start_date: "2024-02-01",
        end_date: "2024-02-15",
        reason: "Testing",
        status: "pending",
      };

      mockDb
        .mockResolvedValueOnce([{ id: 1, status: "available" }]) // Equipment available
        .mockResolvedValueOnce([{ count: 0 }]) // No conflicts
        .mockResolvedValueOnce(undefined) // INSERT
        .mockResolvedValueOnce([newRequest]); // Get created request

      const request = createAuthenticatedRequest(
        "POST",
        "http://localhost/api/borrowing",
        userToken,
        {
          body: {
            equipment_id: 1,
            start_date: "2024-02-01",
            end_date: "2024-02-15",
            reason: "Testing",
          },
        },
      );

      const response = await borrowingRoutes.create(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message).toBe("Borrowing request created");
    });
  });

  describe("PATCH /api/borrowing/:id/status", () => {
    it("should return 401 when not authenticated", async () => {
      const request = createMockRequest(
        "PATCH",
        "http://localhost/api/borrowing/1/status",
        {
          body: { status: "approved" },
        },
      );

      const response = await borrowingRoutes.updateStatus(request, { id: "1" });
      const { status } = await parseResponse(response);

      expect(status).toBe(401);
    });

    it("should return 400 for invalid status", async () => {
      const request = createAuthenticatedRequest(
        "PATCH",
        "http://localhost/api/borrowing/1/status",
        adminToken,
        {
          body: { status: "invalid-status" },
        },
      );

      const response = await borrowingRoutes.updateStatus(request, { id: "1" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("Invalid status");
    });

    it("should return 404 when request not found", async () => {
      mockDb.mockResolvedValueOnce([]); // Request not found

      const request = createAuthenticatedRequest(
        "PATCH",
        "http://localhost/api/borrowing/999/status",
        adminToken,
        {
          body: { status: "approved" },
        },
      );

      const response = await borrowingRoutes.updateStatus(request, {
        id: "999",
      });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(404);
      expect(data.error).toBe("Request not found");
    });

    it("should return 403 when non-admin tries to approve", async () => {
      mockDb.mockResolvedValueOnce([
        { id: 1, status: "pending", equipment_id: 1 },
      ]);

      const request = createAuthenticatedRequest(
        "PATCH",
        "http://localhost/api/borrowing/1/status",
        userToken,
        {
          body: { status: "approved" },
        },
      );

      const response = await borrowingRoutes.updateStatus(request, { id: "1" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });

    it("should return 400 for invalid state transition (pending -> active)", async () => {
      mockDb.mockResolvedValueOnce([
        { id: 1, status: "pending", equipment_id: 1 },
      ]);

      const request = createAuthenticatedRequest(
        "PATCH",
        "http://localhost/api/borrowing/1/status",
        adminToken,
        {
          body: { status: "active" },
        },
      );

      const response = await borrowingRoutes.updateStatus(request, { id: "1" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("Cannot transition from pending to active");
    });

    it("should return 400 for invalid state transition (returned -> pending)", async () => {
      mockDb.mockResolvedValueOnce([
        { id: 1, status: "returned", equipment_id: 1 },
      ]);

      const request = createAuthenticatedRequest(
        "PATCH",
        "http://localhost/api/borrowing/1/status",
        adminToken,
        {
          body: { status: "pending" },
        },
      );

      const response = await borrowingRoutes.updateStatus(request, { id: "1" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("Cannot transition from returned to pending");
    });

    it("should approve pending request (pending -> approved)", async () => {
      const mockRequest = {
        id: 1,
        status: "pending",
        equipment_id: 1,
        approved_by: null,
      };
      mockDb.mockResolvedValueOnce([mockRequest]);
      mockTx.mockResolvedValue(undefined);
      mockDb.mockResolvedValueOnce([
        { ...mockRequest, status: "approved", approved_by: 1 },
      ]);

      const request = createAuthenticatedRequest(
        "PATCH",
        "http://localhost/api/borrowing/1/status",
        adminToken,
        {
          body: { status: "approved" },
        },
      );

      const response = await borrowingRoutes.updateStatus(request, { id: "1" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("Status updated");
    });

    it("should reject pending request (pending -> rejected)", async () => {
      const mockRequest = {
        id: 1,
        status: "pending",
        equipment_id: 1,
        approved_by: null,
      };
      mockDb.mockResolvedValueOnce([mockRequest]);
      // Transaction mocks
      mockTx.mockResolvedValueOnce(undefined); // Update status
      mockTx.mockResolvedValueOnce([{ count: 0 }]); // Check other active requests
      mockTx.mockResolvedValueOnce(undefined); // Update equipment status
      mockDb.mockResolvedValueOnce([
        { ...mockRequest, status: "rejected", approved_by: 1 },
      ]);

      const request = createAuthenticatedRequest(
        "PATCH",
        "http://localhost/api/borrowing/1/status",
        adminToken,
        {
          body: { status: "rejected" },
        },
      );

      const response = await borrowingRoutes.updateStatus(request, { id: "1" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should activate approved request (approved -> active)", async () => {
      const mockRequest = {
        id: 1,
        status: "approved",
        equipment_id: 1,
        approved_by: 1,
      };
      mockDb.mockResolvedValueOnce([mockRequest]);
      mockTx.mockResolvedValue(undefined);
      mockDb.mockResolvedValueOnce([{ ...mockRequest, status: "active" }]);

      const request = createAuthenticatedRequest(
        "PATCH",
        "http://localhost/api/borrowing/1/status",
        adminToken,
        {
          body: { status: "active" },
        },
      );

      const response = await borrowingRoutes.updateStatus(request, { id: "1" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should return active request (active -> returned)", async () => {
      const mockRequest = {
        id: 1,
        status: "active",
        equipment_id: 1,
        approved_by: 1,
      };
      mockDb.mockResolvedValueOnce([mockRequest]);
      mockTx.mockResolvedValueOnce(undefined); // Update status
      mockTx.mockResolvedValueOnce([{ count: 0 }]); // No other active requests
      mockTx.mockResolvedValueOnce(undefined); // Update equipment status
      mockDb.mockResolvedValueOnce([{ ...mockRequest, status: "returned" }]);

      const request = createAuthenticatedRequest(
        "PATCH",
        "http://localhost/api/borrowing/1/status",
        adminToken,
        {
          body: { status: "returned" },
        },
      );

      const response = await borrowingRoutes.updateStatus(request, { id: "1" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe("GET /api/borrowing/user/:userId", () => {
    it("should return 401 when not authenticated", async () => {
      const request = createMockRequest(
        "GET",
        "http://localhost/api/borrowing/user/1",
      );

      const response = await borrowingRoutes.getByUser(request, {
        userId: "1",
      });
      const { status } = await parseResponse(response);

      expect(status).toBe(401);
    });

    it("should return 400 for invalid userId", async () => {
      const request = createAuthenticatedRequest(
        "GET",
        "http://localhost/api/borrowing/user/abc",
        userToken,
      );

      const response = await borrowingRoutes.getByUser(request, {
        userId: "abc",
      });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("Invalid user ID");
    });

    it("should return 403 when non-admin tries to view other user requests", async () => {
      const request = createAuthenticatedRequest(
        "GET",
        "http://localhost/api/borrowing/user/999",
        userToken,
      );

      const response = await borrowingRoutes.getByUser(request, {
        userId: "999",
      });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });

    it("should allow user to view own requests", async () => {
      mockDb.mockResolvedValueOnce([{ id: 1, user_id: 2, status: "pending" }]);

      const request = createAuthenticatedRequest(
        "GET",
        "http://localhost/api/borrowing/user/2",
        userToken,
      );

      const response = await borrowingRoutes.getByUser(request, {
        userId: "2",
      });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should allow admin to view any user requests", async () => {
      mockDb.mockResolvedValueOnce([
        { id: 1, user_id: 999, status: "pending" },
      ]);

      const request = createAuthenticatedRequest(
        "GET",
        "http://localhost/api/borrowing/user/999",
        adminToken,
      );

      const response = await borrowingRoutes.getByUser(request, {
        userId: "999",
      });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe("GET /api/borrowing/status/:status", () => {
    it("should return 401 when not authenticated", async () => {
      const request = createMockRequest(
        "GET",
        "http://localhost/api/borrowing/status/pending",
      );

      const response = await borrowingRoutes.getByStatus(request, {
        status: "pending",
      });
      const { status } = await parseResponse(response);

      expect(status).toBe(401);
    });

    it("should return 400 for invalid status", async () => {
      const request = createAuthenticatedRequest(
        "GET",
        "http://localhost/api/borrowing/status/invalid",
        userToken,
      );

      const response = await borrowingRoutes.getByStatus(request, {
        status: "invalid",
      });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("Invalid status");
    });

    it("should return requests by status", async () => {
      mockDb.unsafe.mockResolvedValueOnce([{ id: 1, status: "pending" }]);

      const request = createAuthenticatedRequest(
        "GET",
        "http://localhost/api/borrowing/status/pending",
        userToken,
      );

      const response = await borrowingRoutes.getByStatus(request, {
        status: "pending",
      });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
