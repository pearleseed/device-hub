import { describe, it, expect, beforeEach, mock } from "bun:test";
import { returnsRoutes } from "../../routes/returns";
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

describe("Returns Routes", () => {
  let userToken: string;
  let adminToken: string;

  beforeEach(async () => {
    mockDb.mockReset();
    mockDb.unsafe.mockReset();
    mockTx.mockReset();
    userToken = await generateToken(2, "user@example.com", "user");
    adminToken = await generateToken(1, "admin@example.com", "admin");
  });

  describe("GET /api/returns", () => {
    it("should return 401 when not authenticated", async () => {
      const request = createMockRequest("GET", "http://localhost/api/returns");

      const response = await returnsRoutes.getAll(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return all returns for admin", async () => {
      const mockReturns = [
        {
          id: 1,
          borrowing_request_id: 1,
          device_condition: "good",
          user_id: 2,
        },
        {
          id: 2,
          borrowing_request_id: 2,
          device_condition: "excellent",
          user_id: 3,
        },
      ];
      mockDb.unsafe.mockResolvedValueOnce(mockReturns);

      const request = createAuthenticatedRequest(
        "GET",
        "http://localhost/api/returns",
        adminToken,
      );

      const response = await returnsRoutes.getAll(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
    });

    it("should return only user own returns for non-admin", async () => {
      const mockReturns = [
        {
          id: 1,
          borrowing_request_id: 1,
          device_condition: "good",
          user_id: 2,
        },
      ];
      mockDb.unsafe.mockResolvedValueOnce(mockReturns);

      const request = createAuthenticatedRequest(
        "GET",
        "http://localhost/api/returns",
        userToken,
      );

      const response = await returnsRoutes.getAll(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should filter by condition", async () => {
      mockDb.unsafe.mockResolvedValueOnce([]);

      const request = createAuthenticatedRequest(
        "GET",
        "http://localhost/api/returns?condition=excellent",
        adminToken,
      );

      const response = await returnsRoutes.getAll(request);
      const { status } = await parseResponse(response);

      expect(status).toBe(200);
    });
  });

  describe("GET /api/returns/:id", () => {
    it("should return 401 when not authenticated", async () => {
      const request = createMockRequest(
        "GET",
        "http://localhost/api/returns/1",
      );

      const response = await returnsRoutes.getById(request, { id: "1" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(401);
      expect(data.success).toBe(false);
    });

    it("should return 400 for invalid ID", async () => {
      const request = createAuthenticatedRequest(
        "GET",
        "http://localhost/api/returns/abc",
        userToken,
      );

      const response = await returnsRoutes.getById(request, { id: "abc" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("Invalid return request ID");
    });

    it("should return 404 when return request not found", async () => {
      mockDb.mockResolvedValueOnce([]);

      const request = createAuthenticatedRequest(
        "GET",
        "http://localhost/api/returns/999",
        userToken,
      );

      const response = await returnsRoutes.getById(request, { id: "999" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(404);
      expect(data.error).toBe("Return request not found");
    });

    it("should return 403 when non-admin tries to view other user return", async () => {
      const mockReturn = {
        id: 1,
        borrowing_request_id: 1,
        device_condition: "good",
        user_id: 999,
      };
      mockDb.mockResolvedValueOnce([mockReturn]);

      const request = createAuthenticatedRequest(
        "GET",
        "http://localhost/api/returns/1",
        userToken,
      );

      const response = await returnsRoutes.getById(request, { id: "1" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });

    it("should return return request for owner", async () => {
      const mockReturn = {
        id: 1,
        borrowing_request_id: 1,
        device_condition: "good",
        user_id: 2,
      };
      mockDb.mockResolvedValueOnce([mockReturn]);

      const request = createAuthenticatedRequest(
        "GET",
        "http://localhost/api/returns/1",
        userToken,
      );

      const response = await returnsRoutes.getById(request, { id: "1" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(1);
    });

    it("should return return request for admin viewing any return", async () => {
      const mockReturn = {
        id: 1,
        borrowing_request_id: 1,
        device_condition: "good",
        user_id: 999,
      };
      mockDb.mockResolvedValueOnce([mockReturn]);

      const request = createAuthenticatedRequest(
        "GET",
        "http://localhost/api/returns/1",
        adminToken,
      );

      const response = await returnsRoutes.getById(request, { id: "1" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe("POST /api/returns", () => {
    it("should return 401 when not authenticated", async () => {
      const request = createMockRequest(
        "POST",
        "http://localhost/api/returns",
        {
          body: { borrowing_request_id: 1, condition: "good" },
        },
      );

      const response = await returnsRoutes.create(request);
      const { status } = await parseResponse(response);

      expect(status).toBe(401);
    });

    it("should return 400 when borrowing_request_id is missing", async () => {
      const request = createAuthenticatedRequest(
        "POST",
        "http://localhost/api/returns",
        userToken,
        {
          body: { condition: "good" },
        },
      );

      const response = await returnsRoutes.create(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("Borrowing request ID is required");
    });

    it("should return 400 when condition is missing", async () => {
      const request = createAuthenticatedRequest(
        "POST",
        "http://localhost/api/returns",
        userToken,
        {
          body: { borrowing_request_id: 1 },
        },
      );

      const response = await returnsRoutes.create(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("Valid condition is required");
    });

    it("should return 400 when condition is invalid", async () => {
      const request = createAuthenticatedRequest(
        "POST",
        "http://localhost/api/returns",
        userToken,
        {
          body: { borrowing_request_id: 1, condition: "invalid-condition" },
        },
      );

      const response = await returnsRoutes.create(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("Valid condition is required");
    });

    it("should accept all valid conditions", async () => {
      const validConditions = ["excellent", "good", "fair", "damaged"];

      for (const condition of validConditions) {
        mockDb
          .mockResolvedValueOnce([
            { id: 1, user_id: 2, status: "active", equipment_id: 1 },
          ]) // Borrowing request
          .mockResolvedValueOnce([]); // No existing return
        mockTx.mockResolvedValue(undefined);
        mockDb.mockResolvedValueOnce([{ id: 1, device_condition: condition }]); // Created return

        const request = createAuthenticatedRequest(
          "POST",
          "http://localhost/api/returns",
          userToken,
          {
            body: { borrowing_request_id: 1, condition },
          },
        );

        const response = await returnsRoutes.create(request);
        const { status } = await parseResponse(response);

        expect(status).toBe(201);
        mockDb.mockReset();
        mockTx.mockReset();
      }
    });

    it("should return 404 when borrowing request not found", async () => {
      mockDb.mockResolvedValueOnce([]); // Borrowing request not found

      const request = createAuthenticatedRequest(
        "POST",
        "http://localhost/api/returns",
        userToken,
        {
          body: { borrowing_request_id: 999, condition: "good" },
        },
      );

      const response = await returnsRoutes.create(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(404);
      expect(data.error).toBe("Borrowing request not found");
    });

    it("should return 403 when non-admin/non-owner tries to create return", async () => {
      const mockBorrowing = {
        id: 1,
        user_id: 999,
        status: "active",
        equipment_id: 1,
      };
      mockDb.mockResolvedValueOnce([mockBorrowing]);

      const request = createAuthenticatedRequest(
        "POST",
        "http://localhost/api/returns",
        userToken,
        {
          body: { borrowing_request_id: 1, condition: "good" },
        },
      );

      const response = await returnsRoutes.create(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });

    it("should return 400 when borrowing request is not active", async () => {
      const mockBorrowing = {
        id: 1,
        user_id: 2,
        status: "pending",
        equipment_id: 1,
      };
      mockDb.mockResolvedValueOnce([mockBorrowing]);

      const request = createAuthenticatedRequest(
        "POST",
        "http://localhost/api/returns",
        userToken,
        {
          body: { borrowing_request_id: 1, condition: "good" },
        },
      );

      const response = await returnsRoutes.create(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe(
        "Can only create return request for active borrowings",
      );
    });

    it("should return 400 when return request already exists", async () => {
      const mockBorrowing = {
        id: 1,
        user_id: 2,
        status: "active",
        equipment_id: 1,
      };
      mockDb
        .mockResolvedValueOnce([mockBorrowing]) // Borrowing request
        .mockResolvedValueOnce([{ id: 1 }]); // Existing return

      const request = createAuthenticatedRequest(
        "POST",
        "http://localhost/api/returns",
        userToken,
        {
          body: { borrowing_request_id: 1, condition: "good" },
        },
      );

      const response = await returnsRoutes.create(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("Return request already exists");
    });

    it("should create return request successfully", async () => {
      const mockBorrowing = {
        id: 1,
        user_id: 2,
        status: "active",
        equipment_id: 1,
      };
      const mockReturn = {
        id: 1,
        borrowing_request_id: 1,
        device_condition: "good",
        notes: "Device in good condition",
      };

      mockDb
        .mockResolvedValueOnce([mockBorrowing]) // Borrowing request
        .mockResolvedValueOnce([]); // No existing return
      mockTx.mockResolvedValue(undefined);
      mockDb.mockResolvedValueOnce([mockReturn]); // Created return

      const request = createAuthenticatedRequest(
        "POST",
        "http://localhost/api/returns",
        userToken,
        {
          body: {
            borrowing_request_id: 1,
            condition: "good",
            notes: "Device in good condition",
          },
        },
      );

      const response = await returnsRoutes.create(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message).toBe("Return request created");
    });

    it("should allow admin to create return for any borrowing", async () => {
      const mockBorrowing = {
        id: 1,
        user_id: 999,
        status: "active",
        equipment_id: 1,
      };
      const mockReturn = {
        id: 1,
        borrowing_request_id: 1,
        device_condition: "excellent",
      };

      mockDb
        .mockResolvedValueOnce([mockBorrowing]) // Borrowing request
        .mockResolvedValueOnce([]); // No existing return
      mockTx.mockResolvedValue(undefined);
      mockDb.mockResolvedValueOnce([mockReturn]); // Created return

      const request = createAuthenticatedRequest(
        "POST",
        "http://localhost/api/returns",
        adminToken,
        {
          body: { borrowing_request_id: 1, condition: "excellent" },
        },
      );

      const response = await returnsRoutes.create(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(201);
      expect(data.success).toBe(true);
    });

    it("should create return without notes", async () => {
      const mockBorrowing = {
        id: 1,
        user_id: 2,
        status: "active",
        equipment_id: 1,
      };
      const mockReturn = {
        id: 1,
        borrowing_request_id: 1,
        device_condition: "fair",
        notes: null,
      };

      mockDb.mockResolvedValueOnce([mockBorrowing]).mockResolvedValueOnce([]);
      mockTx.mockResolvedValue(undefined);
      mockDb.mockResolvedValueOnce([mockReturn]);

      const request = createAuthenticatedRequest(
        "POST",
        "http://localhost/api/returns",
        userToken,
        {
          body: { borrowing_request_id: 1, condition: "fair" },
        },
      );

      const response = await returnsRoutes.create(request);
      const { status } = await parseResponse(response);

      expect(status).toBe(201);
    });

    it("should handle damaged condition (sets equipment to maintenance)", async () => {
      const mockBorrowing = {
        id: 1,
        user_id: 2,
        status: "active",
        equipment_id: 1,
      };
      const mockReturn = {
        id: 1,
        borrowing_request_id: 1,
        device_condition: "damaged",
      };

      mockDb.mockResolvedValueOnce([mockBorrowing]).mockResolvedValueOnce([]);
      mockTx.mockResolvedValue(undefined);
      mockDb.mockResolvedValueOnce([mockReturn]);

      const request = createAuthenticatedRequest(
        "POST",
        "http://localhost/api/returns",
        userToken,
        {
          body: {
            borrowing_request_id: 1,
            condition: "damaged",
            notes: "Screen cracked",
          },
        },
      );

      const response = await returnsRoutes.create(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(201);
      expect(data.success).toBe(true);
    });
  });
});
