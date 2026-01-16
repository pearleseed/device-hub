/**
 * Device API Tests
 *
 * Tests for device endpoints including listing, filtering, retrieval,
 * and CRUD operations.
 *
 * Requirements: 2.1-2.13
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fc from "fast-check";
import { testApiClient as api } from "../utils/api-client";
import { TestApiClient } from "../utils/api-client";
import { createDevice } from "../utils/factories";
import {
  validCategoryArb,
  invalidCategoryArb,
  validIdArb,
} from "../utils/generators";
import { DEVICE_CATEGORIES } from "../test-config";
import type {
  DeviceWithDepartment,
  CreateDeviceRequest,
} from "../../src/types/api";
import {
  setupTestContext,
  type TestContext,
  cleanupResources,
  createdDeviceIds,
} from "../utils/helpers";

// ============================================================================
// Test Setup
// ============================================================================

// Use the singleton API client
let ctx: TestContext;

beforeAll(async () => {
  ctx = await setupTestContext();
});

afterAll(async () => {
  await cleanupResources(ctx.adminToken, ctx.superuserToken);
});

// ============================================================================
// Device Listing Tests (Requirements 2.1, 2.2, 2.3, 2.4, 2.5)
// ============================================================================

describe("Device API - Listing", () => {
  describe("GET /api/devices", () => {
    it("should return all devices with department information (Req 2.1)", async () => {
      const response = await api.get<DeviceWithDepartment[]>("/api/devices", ctx.adminToken);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
      expect(Array.isArray(response.data.data)).toBe(true);

      // Verify devices have department information
      if (response.data.data && response.data.data.length > 0) {
        const device = response.data.data[0];
        expect(device).toHaveProperty("id");
        expect(device).toHaveProperty("name");
        expect(device).toHaveProperty("asset_tag");
        expect(device).toHaveProperty("category");
        expect(device).toHaveProperty("department_id");
      }
    });

    it("should filter devices by category (Req 2.2)", async () => {
      const category = "laptop";
      const response = await api.get<DeviceWithDepartment[]>(
        "/api/devices",
        ctx.adminToken,
        { category },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();

      // All returned devices should match the category
      if (response.data.data && response.data.data.length > 0) {
        response.data.data.forEach((device) => {
          expect(device.category).toBe(category);
        });
      }
    });

    it("should filter devices by status (Req 2.3)", async () => {
      const status = "available";
      const response = await api.get<DeviceWithDepartment[]>(
        "/api/devices",
        ctx.adminToken,
        { status },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();

      // All returned devices should match the status
      if (response.data.data && response.data.data.length > 0) {
        response.data.data.forEach((device) => {
          expect(device.status).toBe(status);
        });
      }
    });

    it("should filter devices by search parameter (Req 2.4)", async () => {
      const allDevicesResponse =
        await api.get<DeviceWithDepartment[]>("/api/devices", ctx.adminToken);

      if (
        allDevicesResponse.data.data &&
        allDevicesResponse.data.data.length > 0
      ) {
        const searchTerm = allDevicesResponse.data.data[0].name.substring(0, 3);

        const response = await api.get<DeviceWithDepartment[]>(
          "/api/devices",
          ctx.adminToken,
          { search: searchTerm },
        );

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.data).toBeDefined();

        // All returned devices should match the search term in name, asset_tag, brand, or model
        if (response.data.data && response.data.data.length > 0) {
          response.data.data.forEach((device) => {
            const matchesSearch =
              device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              device.asset_tag
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
              device.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
              device.model.toLowerCase().includes(searchTerm.toLowerCase());
            expect(matchesSearch).toBe(true);
          });
        }
      }
    });

    it("should filter devices by price range (Req 2.5)", async () => {
      const minPrice = "500";
      const maxPrice = "2000";

      const response = await api.get<DeviceWithDepartment[]>(
        "/api/devices",
        ctx.adminToken,
        { min_price: minPrice, max_price: maxPrice },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();

      // All returned devices should be within the price range
      if (response.data.data && response.data.data.length > 0) {
        response.data.data.forEach((device) => {
          const price = Number(device.purchase_price);
          expect(price).toBeGreaterThanOrEqual(parseFloat(minPrice));
          expect(price).toBeLessThan(parseFloat(maxPrice));
        });
      }
    });

    it("should filter devices by minimum price only", async () => {
      const minPrice = "1000";

      const response = await api.get<DeviceWithDepartment[]>(
        "/api/devices",
        ctx.adminToken,
        { min_price: minPrice },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      if (response.data.data && response.data.data.length > 0) {
        response.data.data.forEach((device) => {
          const price = Number(device.purchase_price);
          expect(price).toBeGreaterThanOrEqual(parseFloat(minPrice));
        });
      }
    });

    it("should filter devices by maximum price only", async () => {
      const maxPrice = "1500";

      const response = await api.get<DeviceWithDepartment[]>(
        "/api/devices",
        ctx.adminToken,
        { max_price: maxPrice },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      if (response.data.data && response.data.data.length > 0) {
        response.data.data.forEach((device) => {
          const price = Number(device.purchase_price);
          expect(price).toBeLessThan(parseFloat(maxPrice));
        });
      }
    });

    it("should combine multiple filters", async () => {
      const response = await api.get<DeviceWithDepartment[]>(
        "/api/devices",
        ctx.adminToken,
        { category: "laptop", status: "available" },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      if (response.data.data && response.data.data.length > 0) {
        response.data.data.forEach((device) => {
          expect(device.category).toBe("laptop");
          expect(device.status).toBe("available");
        });
      }
    });
  });
});

// ============================================================================
// Device Retrieval Tests (Requirements 2.6, 2.7)
// ============================================================================

describe("Device API - Retrieval", () => {
  describe("GET /api/devices/:id", () => {
    it("should return device with parsed specs for valid ID (Req 2.6)", async () => {
      const allDevicesResponse =
        await api.get<DeviceWithDepartment[]>("/api/devices", ctx.adminToken);

      if (
        allDevicesResponse.data.data &&
        allDevicesResponse.data.data.length > 0
      ) {
        const deviceId = allDevicesResponse.data.data[0].id;

        const response = await api.get<DeviceWithDepartment>(
          `/api/devices/${deviceId}`,
          ctx.adminToken,
        );

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.data).toBeDefined();
        expect(response.data.data?.id).toBe(deviceId);
        expect(response.data.data).toHaveProperty("name");
        expect(response.data.data).toHaveProperty("asset_tag");
        expect(response.data.data).toHaveProperty("category");
        // API returns specs_json field, not specs
        expect(response.data.data).toHaveProperty("specs_json");
      }
    });

    it("should return 404 for non-existent device ID (Req 2.7)", async () => {
      const nonExistentId = 999999;

      const response = await api.get<DeviceWithDepartment>(
        `/api/devices/${nonExistentId}`,
        ctx.adminToken,
      );

      expect(response.status).toBe(404);
      expect(response.data.success).toBe(false);
      expect(response.data.error).toBeDefined();
    });

    it("should return 400 for invalid device ID format", async () => {
      const response = await api.get<DeviceWithDepartment>(
        "/api/devices/invalid",
        ctx.adminToken,
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.error).toBeDefined();
    });
  });
});

// ============================================================================
// Device CRUD Tests (Requirements 2.8, 2.9, 2.10, 2.11, 2.12, 2.13)
// ============================================================================

describe("Device API - CRUD Operations", () => {
  describe("POST /api/devices", () => {
    it("should allow admin to create a device (Req 2.8)", async () => {
      const deviceData = createDevice();

      const response = await api.post<DeviceWithDepartment>(
        "/api/devices",
        deviceData,
        ctx.adminToken,
      );

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
      expect(response.data.data?.name).toBe(deviceData.name);
      expect(response.data.data?.asset_tag).toBe(
        deviceData.asset_tag.toUpperCase(),
      );
      expect(response.data.data?.category).toBe(deviceData.category);

      // Track for cleanup
      if (response.data.data?.id) {
        createdDeviceIds.push(response.data.data.id);
      }
    });

    it("should return 403 for non-admin creating device (Req 2.9)", async () => {
      const deviceData = createDevice();

      const response = await api.post<DeviceWithDepartment>(
        "/api/devices",
        deviceData,
        ctx.userToken,
      );

      expect(response.status).toBe(403);
      expect(response.data.success).toBe(false);
      expect(response.data.error).toBeDefined();
    });

    it("should return 401 for unauthenticated user creating device", async () => {
      const deviceData = createDevice();
      const freshApi = api;
      freshApi.clearAuth();

      const response = await freshApi.post<DeviceWithDepartment>(
        "/api/devices",
        deviceData,
      );

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });

    it("should return 400 for duplicate asset_tag (Req 2.10)", async () => {
      // First create a device
      const deviceData = createDevice();
      const createResponse = await api.post<DeviceWithDepartment>(
        "/api/devices",
        deviceData,
        ctx.adminToken,
      );

      if (createResponse.data.data?.id) {
        createdDeviceIds.push(createResponse.data.data.id);
      }

      // Try to create another device with the same asset_tag
      const duplicateDevice = createDevice({ asset_tag: deviceData.asset_tag });
      const response = await api.post<DeviceWithDepartment>(
        "/api/devices",
        duplicateDevice,
        ctx.adminToken,
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.error).toContain("Asset tag");
    });

    it("should return 400 for missing required fields", async () => {
      const incompleteDevice = {
        name: "Test Device",
        // Missing other required fields
      };

      const response = await api.post<DeviceWithDepartment>(
        "/api/devices",
        incompleteDevice,
        ctx.adminToken,
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });
  });

  describe("PUT /api/devices/:id", () => {
    it("should allow admin to update a device (Req 2.11)", async () => {
      // First create a device
      const deviceData = createDevice();
      const createResponse = await api.post<DeviceWithDepartment>(
        "/api/devices",
        deviceData,
        ctx.adminToken,
      );

      const deviceId = createResponse.data.data?.id;
      if (deviceId) {
        createdDeviceIds.push(deviceId);

        const updatedName = "Updated Device Name";
        const response = await api.put<DeviceWithDepartment>(
          `/api/devices/${deviceId}`,
          { name: updatedName },
          ctx.adminToken,
        );

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.data?.name).toBe(updatedName);
      }
    });

    it("should return 403 for non-admin updating device", async () => {
      const allDevicesResponse =
        await api.get<DeviceWithDepartment[]>("/api/devices", ctx.adminToken);

      if (
        allDevicesResponse.data.data &&
        allDevicesResponse.data.data.length > 0
      ) {
        const deviceId = allDevicesResponse.data.data[0].id;

        const response = await api.put<DeviceWithDepartment>(
          `/api/devices/${deviceId}`,
          { name: "Unauthorized Update" },
          ctx.userToken,
        );

        expect(response.status).toBe(403);
        expect(response.data.success).toBe(false);
      }
    });

    it("should return 400 for duplicate asset_tag on update", async () => {
      // Create two devices
      const device1Data = createDevice();
      const device2Data = createDevice();

      const create1Response = await api.post<DeviceWithDepartment>(
        "/api/devices",
        device1Data,
        ctx.adminToken,
      );
      const create2Response = await api.post<DeviceWithDepartment>(
        "/api/devices",
        device2Data,
        ctx.adminToken,
      );

      if (create1Response.data.data?.id) {
        createdDeviceIds.push(create1Response.data.data.id);
      }
      if (create2Response.data.data?.id) {
        createdDeviceIds.push(create2Response.data.data.id);
      }

      // Try to update device2 with device1's asset_tag
      if (create2Response.data.data?.id) {
        const response = await api.put<DeviceWithDepartment>(
          `/api/devices/${create2Response.data.data.id}`,
          { asset_tag: device1Data.asset_tag },
          ctx.adminToken,
        );

        expect(response.status).toBe(400);
        expect(response.data.success).toBe(false);
        expect(response.data.error).toContain("Asset tag");
      }
    });
  });

  describe("DELETE /api/devices/:id", () => {
    it("should allow admin to delete device without active requests (Req 2.12)", async () => {
      // Create a device specifically for deletion
      const deviceData = createDevice();
      const createResponse = await api.post<DeviceWithDepartment>(
        "/api/devices",
        deviceData,
        ctx.adminToken,
      );

      const deviceId = createResponse.data.data?.id;
      if (deviceId) {
        const response = await api.delete<{ message: string }>(
          `/api/devices/${deviceId}`,
          ctx.adminToken,
        );

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);

        // Verify device is deleted
        const getResponse = await api.get<DeviceWithDepartment>(
          `/api/devices/${deviceId}`,
          ctx.adminToken,
        );
        expect(getResponse.status).toBe(404);
      }
    });

    it("should return 403 for non-admin deleting device", async () => {
      // Create a device
      const deviceData = createDevice();
      const createResponse = await api.post<DeviceWithDepartment>(
        "/api/devices",
        deviceData,
        ctx.adminToken,
      );

      const deviceId = createResponse.data.data?.id;
      if (deviceId) {
        createdDeviceIds.push(deviceId);

        const response = await api.delete<{ message: string }>(
          `/api/devices/${deviceId}`,
          ctx.userToken,
        );

        expect(response.status).toBe(403);
        expect(response.data.success).toBe(false);
      }
    });

    it("should return 400 for invalid device ID format on delete", async () => {
      const response = await api.delete<{ message: string }>(
        "/api/devices/invalid",
        ctx.adminToken,
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });
  });
});

// ============================================================================
// Property Tests
// ============================================================================

describe("Device API - Property Tests", () => {
  /**
   * Property 4: Device Filtering Consistency
   */
  describe("Property 4: Device Filtering Consistency", () => {
    it("for any valid category filter, all returned devices should match that category", async () => {
      await fc.assert(
        fc.asyncProperty(validCategoryArb, async (category) => {
          const response = await api.get<DeviceWithDepartment[]>(
            "/api/devices",
            ctx.adminToken,
            { category },
          );

          expect(response.status).toBe(200);
          expect(response.data.success).toBe(true);

          if (response.data.data && response.data.data.length > 0) {
            response.data.data.forEach((device) => {
              expect(device.category).toBe(category);
            });
          }

          return true;
        }),
        { numRuns: 100 },
      );
    });

    it("for any valid status filter, all returned devices should match that status", async () => {
      const validStatuses = [
        "available",
        "inuse",
        "maintenance",
        "updating",
        "storage",
        "discard",
        "transferred",
      ] as const;

      await fc.assert(
        fc.asyncProperty(fc.constantFrom(...validStatuses), async (status) => {
          const response = await api.get<DeviceWithDepartment[]>(
            "/api/devices",
            ctx.adminToken,
            { status },
          );

          expect(response.status).toBe(200);
          expect(response.data.success).toBe(true);

          if (response.data.data && response.data.data.length > 0) {
            response.data.data.forEach((device) => {
              expect(device.status).toBe(status);
            });
          }

          return true;
        }),
        { numRuns: 100 },
      );
    });

    it("for any price range filter, all returned devices should be within that range", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 5000 }),
          fc.integer({ min: 1, max: 10000 }),
          async (minBase, rangeSize) => {
            const minPrice = minBase;
            const maxPrice = minBase + rangeSize;

            const response = await api.get<DeviceWithDepartment[]>(
              "/api/devices",
              ctx.adminToken,
              {
                min_price: minPrice.toString(),
                max_price: maxPrice.toString(),
              },
            );

            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);

            if (response.data.data && response.data.data.length > 0) {
              response.data.data.forEach((device) => {
                const price = Number(device.purchase_price);
                expect(price).toBeGreaterThanOrEqual(minPrice);
                expect(price).toBeLessThan(maxPrice);
              });
            }

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 5: Device Retrieval by ID
   */
  describe("Property 5: Device Retrieval by ID", () => {
    it("for any existing device ID, retrieval should return that device", async () => {
      const allDevicesResponse =
        await api.get<DeviceWithDepartment[]>("/api/devices", ctx.adminToken);

      if (
        !allDevicesResponse.data.data ||
        allDevicesResponse.data.data.length === 0
      ) {
        return;
      }

      const existingIds = allDevicesResponse.data.data.map((d) => d.id);

      await fc.assert(
        fc.asyncProperty(fc.constantFrom(...existingIds), async (deviceId) => {
          const response = await api.get<DeviceWithDepartment>(
            `/api/devices/${deviceId}`,
            ctx.adminToken,
          );

          expect(response.status).toBe(200);
          expect(response.data.success).toBe(true);
          expect(response.data.data).toBeDefined();
          expect(response.data.data?.id).toBe(deviceId);
          expect(response.data.data).toHaveProperty("specs_json");

          return true;
        }),
        { numRuns: 100 },
      );
    });

    it("for any non-existent device ID, retrieval should return 404", async () => {
      const allDevicesResponse =
        await api.get<DeviceWithDepartment[]>("/api/devices", ctx.adminToken);
      const existingIds = new Set(
        allDevicesResponse.data.data?.map((d) => d.id) || [],
      );

      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 100000, max: 999999 }),
          async (randomId) => {
            if (existingIds.has(randomId)) {
              return true;
            }

            const response = await api.get<DeviceWithDepartment>(
              `/api/devices/${randomId}`,
              ctx.adminToken,
            );

            expect(response.status).toBe(404);
            expect(response.data.success).toBe(false);
            expect(response.data.error).toBeDefined();

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
