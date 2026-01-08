import { describe, it, expect, beforeEach, mock } from "bun:test";
import { equipmentRoutes } from "../../routes/equipment";
import {
  createMockRequest,
  createAuthenticatedRequest,
  parseResponse,
  mockEquipment,
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

describe("Equipment Routes", () => {
  let userToken: string;
  let adminToken: string;

  beforeEach(async () => {
    mockDb.mockReset();
    mockDb.unsafe.mockReset();
    userToken = await generateToken(2, "user@example.com", "user");
    adminToken = await generateToken(1, "admin@example.com", "admin");
  });

  describe("GET /api/equipment", () => {
    it("should return all equipment", async () => {
      const equipment = mockEquipment.map((e) => ({ ...e, specs_json: "{}" }));
      mockDb.unsafe.mockResolvedValueOnce(equipment);

      const request = createMockRequest(
        "GET",
        "http://localhost/api/equipment",
      );

      const response = await equipmentRoutes.getAll(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
    });

    it("should filter by category", async () => {
      const laptops = [{ ...mockEquipment[0], specs_json: "{}" }];
      mockDb.unsafe.mockResolvedValueOnce(laptops);

      const request = createMockRequest(
        "GET",
        "http://localhost/api/equipment?category=laptop",
      );

      const response = await equipmentRoutes.getAll(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.data).toHaveLength(1);
    });

    it("should filter by status", async () => {
      const available = [{ ...mockEquipment[0], specs_json: "{}" }];
      mockDb.unsafe.mockResolvedValueOnce(available);

      const request = createMockRequest(
        "GET",
        "http://localhost/api/equipment?status=available",
      );

      const response = await equipmentRoutes.getAll(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should filter by department_id", async () => {
      mockDb.unsafe.mockResolvedValueOnce([]);

      const request = createMockRequest(
        "GET",
        "http://localhost/api/equipment?department_id=1",
      );

      const response = await equipmentRoutes.getAll(request);
      const { status } = await parseResponse(response);

      expect(status).toBe(200);
    });

    it("should search by name, asset_tag, brand, or model", async () => {
      mockDb.unsafe.mockResolvedValueOnce([]);

      const request = createMockRequest(
        "GET",
        "http://localhost/api/equipment?search=MacBook",
      );

      const response = await equipmentRoutes.getAll(request);
      const { status } = await parseResponse(response);

      expect(status).toBe(200);
    });

    it("should parse JSON specs", async () => {
      const equipment = [
        { ...mockEquipment[0], specs_json: '{"processor":"M3 Max"}' },
      ];
      mockDb.unsafe.mockResolvedValueOnce(equipment);

      const request = createMockRequest(
        "GET",
        "http://localhost/api/equipment",
      );

      const response = await equipmentRoutes.getAll(request);
      const { data } = await parseResponse(response);

      expect(data.data[0].specs).toEqual({ processor: "M3 Max" });
    });
  });

  describe("GET /api/equipment/:id", () => {
    it("should return equipment by ID", async () => {
      const equipment = {
        ...mockEquipment[0],
        specs_json: '{"processor":"M3 Max"}',
      };
      mockDb.mockResolvedValueOnce([equipment]);

      const request = createMockRequest(
        "GET",
        "http://localhost/api/equipment/1",
      );

      const response = await equipmentRoutes.getById(request, { id: "1" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(1);
      expect(data.data.specs).toEqual({ processor: "M3 Max" });
    });

    it("should return 400 for invalid ID", async () => {
      const request = createMockRequest(
        "GET",
        "http://localhost/api/equipment/abc",
      );

      const response = await equipmentRoutes.getById(request, { id: "abc" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("Invalid equipment ID");
    });

    it("should return 404 when not found", async () => {
      mockDb.mockResolvedValueOnce([]);

      const request = createMockRequest(
        "GET",
        "http://localhost/api/equipment/999",
      );

      const response = await equipmentRoutes.getById(request, { id: "999" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(404);
      expect(data.error).toBe("Equipment not found");
    });
  });

  describe("POST /api/equipment", () => {
    const validEquipmentData = {
      name: "New Device",
      asset_tag: "DEV-001",
      category: "laptop",
      brand: "Dell",
      model: "XPS 15",
      department_id: 1,
      purchase_price: 1999.99,
      purchase_date: "2024-01-15",
      specs_json: "{}",
      image_url: "https://example.com/device.jpg",
    };

    it("should return 401 when not authenticated", async () => {
      const request = createMockRequest(
        "POST",
        "http://localhost/api/equipment",
        {
          body: validEquipmentData,
        },
      );

      const response = await equipmentRoutes.create(request);
      const { status } = await parseResponse(response);

      expect(status).toBe(401);
    });

    it("should return 401 when non-admin tries to create", async () => {
      const request = createAuthenticatedRequest(
        "POST",
        "http://localhost/api/equipment",
        userToken,
        {
          body: validEquipmentData,
        },
      );

      const response = await equipmentRoutes.create(request);
      const { status } = await parseResponse(response);

      expect(status).toBe(401);
    });

    it("should return 400 when name is missing", async () => {
      const request = createAuthenticatedRequest(
        "POST",
        "http://localhost/api/equipment",
        adminToken,
        {
          body: { ...validEquipmentData, name: "" },
        },
      );

      const response = await equipmentRoutes.create(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("Name is required");
    });

    it("should return 400 when asset_tag is missing", async () => {
      const request = createAuthenticatedRequest(
        "POST",
        "http://localhost/api/equipment",
        adminToken,
        {
          body: { ...validEquipmentData, asset_tag: "" },
        },
      );

      const response = await equipmentRoutes.create(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("Asset tag is required");
    });

    it("should return 400 when category is missing", async () => {
      const request = createAuthenticatedRequest(
        "POST",
        "http://localhost/api/equipment",
        adminToken,
        {
          body: { ...validEquipmentData, category: null },
        },
      );

      const response = await equipmentRoutes.create(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("Category is required");
    });

    it("should return 400 when brand is missing", async () => {
      const request = createAuthenticatedRequest(
        "POST",
        "http://localhost/api/equipment",
        adminToken,
        {
          body: { ...validEquipmentData, brand: "" },
        },
      );

      const response = await equipmentRoutes.create(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("Brand is required");
    });

    it("should return 400 when model is missing", async () => {
      const request = createAuthenticatedRequest(
        "POST",
        "http://localhost/api/equipment",
        adminToken,
        {
          body: { ...validEquipmentData, model: "" },
        },
      );

      const response = await equipmentRoutes.create(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("Model is required");
    });

    it("should return 400 when department_id is missing", async () => {
      const request = createAuthenticatedRequest(
        "POST",
        "http://localhost/api/equipment",
        adminToken,
        {
          body: { ...validEquipmentData, department_id: null },
        },
      );

      const response = await equipmentRoutes.create(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("Department is required");
    });

    it("should return 400 when purchase_price is invalid", async () => {
      const request = createAuthenticatedRequest(
        "POST",
        "http://localhost/api/equipment",
        adminToken,
        {
          body: { ...validEquipmentData, purchase_price: -100 },
        },
      );

      const response = await equipmentRoutes.create(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("Valid purchase price is required");
    });

    it("should return 400 when purchase_date is missing", async () => {
      const request = createAuthenticatedRequest(
        "POST",
        "http://localhost/api/equipment",
        adminToken,
        {
          body: { ...validEquipmentData, purchase_date: "" },
        },
      );

      const response = await equipmentRoutes.create(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("Purchase date is required");
    });

    it("should return 400 when asset_tag already exists", async () => {
      mockDb.mockResolvedValueOnce([{ id: 1 }]); // Existing asset tag

      const request = createAuthenticatedRequest(
        "POST",
        "http://localhost/api/equipment",
        adminToken,
        {
          body: validEquipmentData,
        },
      );

      const response = await equipmentRoutes.create(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("Asset tag already exists");
    });

    it("should create equipment successfully", async () => {
      const newEquipment = { id: 10, ...validEquipmentData };
      mockDb
        .mockResolvedValueOnce([]) // No existing asset tag
        .mockResolvedValueOnce(undefined) // INSERT
        .mockResolvedValueOnce([newEquipment]); // Get created equipment

      const request = createAuthenticatedRequest(
        "POST",
        "http://localhost/api/equipment",
        adminToken,
        {
          body: validEquipmentData,
        },
      );

      const response = await equipmentRoutes.create(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message).toBe("Equipment created");
    });

    it("should uppercase asset_tag", async () => {
      const newEquipment = {
        id: 10,
        ...validEquipmentData,
        asset_tag: "DEV-001",
      };
      mockDb
        .mockResolvedValueOnce([]) // No existing asset tag
        .mockResolvedValueOnce(undefined) // INSERT
        .mockResolvedValueOnce([newEquipment]); // Get created equipment

      const request = createAuthenticatedRequest(
        "POST",
        "http://localhost/api/equipment",
        adminToken,
        {
          body: { ...validEquipmentData, asset_tag: "dev-001" },
        },
      );

      const response = await equipmentRoutes.create(request);
      const { status } = await parseResponse(response);

      expect(status).toBe(201);
    });
  });

  describe("PUT /api/equipment/:id", () => {
    it("should return 401 when not authenticated", async () => {
      const request = createMockRequest(
        "PUT",
        "http://localhost/api/equipment/1",
        {
          body: { name: "Updated Name" },
        },
      );

      const response = await equipmentRoutes.update(request, { id: "1" });
      const { status } = await parseResponse(response);

      expect(status).toBe(401);
    });

    it("should return 401 when non-admin tries to update", async () => {
      const request = createAuthenticatedRequest(
        "PUT",
        "http://localhost/api/equipment/1",
        userToken,
        {
          body: { name: "Updated Name" },
        },
      );

      const response = await equipmentRoutes.update(request, { id: "1" });
      const { status } = await parseResponse(response);

      expect(status).toBe(401);
    });

    it("should return 400 for invalid ID", async () => {
      const request = createAuthenticatedRequest(
        "PUT",
        "http://localhost/api/equipment/abc",
        adminToken,
        {
          body: { name: "Updated Name" },
        },
      );

      const response = await equipmentRoutes.update(request, { id: "abc" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("Invalid equipment ID");
    });

    it("should return 400 when no fields to update", async () => {
      const request = createAuthenticatedRequest(
        "PUT",
        "http://localhost/api/equipment/1",
        adminToken,
        {
          body: {},
        },
      );

      const response = await equipmentRoutes.update(request, { id: "1" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("No fields to update");
    });

    it("should return 400 when duplicate asset_tag", async () => {
      mockDb.mockResolvedValueOnce([{ id: 2 }]); // Asset tag exists for different equipment

      const request = createAuthenticatedRequest(
        "PUT",
        "http://localhost/api/equipment/1",
        adminToken,
        {
          body: { asset_tag: "EXISTING-TAG" },
        },
      );

      const response = await equipmentRoutes.update(request, { id: "1" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("Asset tag already exists");
    });

    it("should update equipment successfully", async () => {
      const updatedEquipment = {
        ...mockEquipment[0],
        name: "Updated Name",
        specs_json: "{}",
      };
      mockDb.unsafe.mockResolvedValueOnce(undefined); // UPDATE
      mockDb.mockResolvedValueOnce([updatedEquipment]); // Get updated equipment

      const request = createAuthenticatedRequest(
        "PUT",
        "http://localhost/api/equipment/1",
        adminToken,
        {
          body: { name: "Updated Name" },
        },
      );

      const response = await equipmentRoutes.update(request, { id: "1" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("Equipment updated");
    });

    it("should update multiple fields", async () => {
      const updatedEquipment = {
        ...mockEquipment[0],
        name: "New Name",
        status: "maintenance",
        specs_json: "{}",
      };
      mockDb.unsafe.mockResolvedValueOnce(undefined); // UPDATE
      mockDb.mockResolvedValueOnce([updatedEquipment]); // Get updated equipment

      const request = createAuthenticatedRequest(
        "PUT",
        "http://localhost/api/equipment/1",
        adminToken,
        {
          body: { name: "New Name", status: "maintenance", brand: "New Brand" },
        },
      );

      const response = await equipmentRoutes.update(request, { id: "1" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe("DELETE /api/equipment/:id", () => {
    it("should return 401 when not authenticated", async () => {
      const request = createMockRequest(
        "DELETE",
        "http://localhost/api/equipment/1",
      );

      const response = await equipmentRoutes.delete(request, { id: "1" });
      const { status } = await parseResponse(response);

      expect(status).toBe(401);
    });

    it("should return 401 when non-admin tries to delete", async () => {
      const request = createAuthenticatedRequest(
        "DELETE",
        "http://localhost/api/equipment/1",
        userToken,
      );

      const response = await equipmentRoutes.delete(request, { id: "1" });
      const { status } = await parseResponse(response);

      expect(status).toBe(401);
    });

    it("should return 400 for invalid ID", async () => {
      const request = createAuthenticatedRequest(
        "DELETE",
        "http://localhost/api/equipment/abc",
        adminToken,
      );

      const response = await equipmentRoutes.delete(request, { id: "abc" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("Invalid equipment ID");
    });

    it("should return 400 when equipment has active borrowing requests", async () => {
      mockDb.mockResolvedValueOnce([{ count: 1 }]); // Has active requests

      const request = createAuthenticatedRequest(
        "DELETE",
        "http://localhost/api/equipment/1",
        adminToken,
      );

      const response = await equipmentRoutes.delete(request, { id: "1" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe(
        "Cannot delete equipment with active borrowing requests",
      );
    });

    it("should delete equipment successfully", async () => {
      mockDb
        .mockResolvedValueOnce([{ count: 0 }]) // No active requests
        .mockResolvedValueOnce(undefined); // DELETE

      const request = createAuthenticatedRequest(
        "DELETE",
        "http://localhost/api/equipment/1",
        adminToken,
      );

      const response = await equipmentRoutes.delete(request, { id: "1" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("Equipment deleted");
    });
  });

  describe("GET /api/equipment/category/:category", () => {
    it("should return 400 for invalid category", async () => {
      const request = createMockRequest(
        "GET",
        "http://localhost/api/equipment/category/invalid",
      );

      const response = await equipmentRoutes.getByCategory(request, {
        category: "invalid",
      });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("Invalid category");
    });

    it("should return equipment by category", async () => {
      const laptops = [{ ...mockEquipment[0], specs_json: "{}" }];
      mockDb.mockResolvedValueOnce(laptops);

      const request = createMockRequest(
        "GET",
        "http://localhost/api/equipment/category/laptop",
      );

      const response = await equipmentRoutes.getByCategory(request, {
        category: "laptop",
      });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should accept all valid categories", async () => {
      const validCategories = [
        "laptop",
        "mobile",
        "tablet",
        "monitor",
        "accessories",
      ];

      for (const category of validCategories) {
        mockDb.mockResolvedValueOnce([]);
        const request = createMockRequest(
          "GET",
          `http://localhost/api/equipment/category/${category}`,
        );
        const response = await equipmentRoutes.getByCategory(request, {
          category,
        });
        const { status } = await parseResponse(response);
        expect(status).toBe(200);
      }
    });
  });

  describe("GET /api/equipment/status/:status", () => {
    it("should return 400 for invalid status", async () => {
      const request = createMockRequest(
        "GET",
        "http://localhost/api/equipment/status/invalid",
      );

      const response = await equipmentRoutes.getByStatus(request, {
        status: "invalid",
      });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("Invalid status");
    });

    it("should return equipment by status", async () => {
      const available = [{ ...mockEquipment[0], specs_json: "{}" }];
      mockDb.mockResolvedValueOnce(available);

      const request = createMockRequest(
        "GET",
        "http://localhost/api/equipment/status/available",
      );

      const response = await equipmentRoutes.getByStatus(request, {
        status: "available",
      });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should accept all valid statuses", async () => {
      const validStatuses = ["available", "borrowed", "maintenance"];

      for (const statusValue of validStatuses) {
        mockDb.mockResolvedValueOnce([]);
        const request = createMockRequest(
          "GET",
          `http://localhost/api/equipment/status/${statusValue}`,
        );
        const response = await equipmentRoutes.getByStatus(request, {
          status: statusValue,
        });
        const { status } = await parseResponse(response);
        expect(status).toBe(200);
      }
    });
  });
});
