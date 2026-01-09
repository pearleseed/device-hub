import { describe, it, expect, beforeEach, mock } from "bun:test";
import { devicesRoutes } from "../../routes/devices";
import {
  createMockRequest,
  createAuthenticatedRequest,
  parseResponse,
  mockDevices,
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

describe("Devices Routes", () => {
  let userToken: string;
  let adminToken: string;

  beforeEach(async () => {
    mockDb.mockReset();
    mockDb.unsafe.mockReset();
    userToken = await generateToken(2, "user@example.com", "user");
    adminToken = await generateToken(1, "admin@example.com", "admin");
  });

  describe("GET /api/devices", () => {
    it("should return all devices", async () => {
      const devices = mockDevices.map((d) => ({ ...d, specs_json: "{}" }));
      mockDb.unsafe.mockResolvedValueOnce(devices);

      const request = createMockRequest("GET", "http://localhost/api/devices");

      const response = await devicesRoutes.getAll(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
    });

    it("should filter by category", async () => {
      const laptops = [{ ...mockDevices[0], specs_json: "{}" }];
      mockDb.unsafe.mockResolvedValueOnce(laptops);

      const request = createMockRequest(
        "GET",
        "http://localhost/api/devices?category=laptop",
      );

      const response = await devicesRoutes.getAll(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.data).toHaveLength(1);
    });

    it("should filter by status", async () => {
      const available = [{ ...mockDevices[0], specs_json: "{}" }];
      mockDb.unsafe.mockResolvedValueOnce(available);

      const request = createMockRequest(
        "GET",
        "http://localhost/api/devices?status=available",
      );

      const response = await devicesRoutes.getAll(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should filter by department_id", async () => {
      mockDb.unsafe.mockResolvedValueOnce([]);

      const request = createMockRequest(
        "GET",
        "http://localhost/api/devices?department_id=1",
      );

      const response = await devicesRoutes.getAll(request);
      const { status } = await parseResponse(response);

      expect(status).toBe(200);
    });

    it("should search by name, asset_tag, brand, or model", async () => {
      mockDb.unsafe.mockResolvedValueOnce([]);

      const request = createMockRequest(
        "GET",
        "http://localhost/api/devices?search=MacBook",
      );

      const response = await devicesRoutes.getAll(request);
      const { status } = await parseResponse(response);

      expect(status).toBe(200);
    });

    it("should parse JSON specs", async () => {
      const devices = [
        { ...mockDevices[0], specs_json: '{"processor":"M3 Max"}' },
      ];
      mockDb.unsafe.mockResolvedValueOnce(devices);

      const request = createMockRequest("GET", "http://localhost/api/devices");

      const response = await devicesRoutes.getAll(request);
      const { data } = await parseResponse(response);

      expect(data.data[0].specs).toEqual({ processor: "M3 Max" });
    });
  });

  describe("GET /api/devices/:id", () => {
    it("should return device by ID", async () => {
      const device = {
        ...mockDevices[0],
        specs_json: '{"processor":"M3 Max"}',
      };
      mockDb.mockResolvedValueOnce([device]);

      const request = createMockRequest(
        "GET",
        "http://localhost/api/devices/1",
      );

      const response = await devicesRoutes.getById(request, { id: "1" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(1);
      expect(data.data.specs).toEqual({ processor: "M3 Max" });
    });

    it("should return 400 for invalid ID", async () => {
      const request = createMockRequest(
        "GET",
        "http://localhost/api/devices/abc",
      );

      const response = await devicesRoutes.getById(request, { id: "abc" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("Invalid device ID");
    });

    it("should return 404 when not found", async () => {
      mockDb.mockResolvedValueOnce([]);

      const request = createMockRequest(
        "GET",
        "http://localhost/api/devices/999",
      );

      const response = await devicesRoutes.getById(request, { id: "999" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(404);
      expect(data.error).toBe("Device not found");
    });
  });

  describe("POST /api/devices", () => {
    const validDeviceData = {
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
        "http://localhost/api/devices",
        {
          body: validDeviceData,
        },
      );

      const response = await devicesRoutes.create(request);
      const { status } = await parseResponse(response);

      expect(status).toBe(401);
    });

    it("should return 401 when non-admin tries to create", async () => {
      const request = createAuthenticatedRequest(
        "POST",
        "http://localhost/api/devices",
        userToken,
        {
          body: validDeviceData,
        },
      );

      const response = await devicesRoutes.create(request);
      const { status } = await parseResponse(response);

      expect(status).toBe(401);
    });

    it("should return 400 when name is missing", async () => {
      const request = createAuthenticatedRequest(
        "POST",
        "http://localhost/api/devices",
        adminToken,
        {
          body: { ...validDeviceData, name: "" },
        },
      );

      const response = await devicesRoutes.create(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("Name is required");
    });

    it("should create device successfully", async () => {
      const newDevice = { id: 10, ...validDeviceData };
      mockDb
        .mockResolvedValueOnce([]) // No existing asset tag
        .mockResolvedValueOnce(undefined) // INSERT
        .mockResolvedValueOnce([newDevice]); // Get created device

      const request = createAuthenticatedRequest(
        "POST",
        "http://localhost/api/devices",
        adminToken,
        {
          body: validDeviceData,
        },
      );

      const response = await devicesRoutes.create(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message).toBe("Device created");
    });
  });

  describe("DELETE /api/devices/:id", () => {
    it("should delete device successfully", async () => {
      mockDb
        .mockResolvedValueOnce([{ count: 0 }]) // No active requests
        .mockResolvedValueOnce(undefined); // DELETE

      const request = createAuthenticatedRequest(
        "DELETE",
        "http://localhost/api/devices/1",
        adminToken,
      );

      const response = await devicesRoutes.delete(request, { id: "1" });
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("Device deleted");
    });
  });
});
