import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  setAuthToken,
  getAuthToken,
  authAPI,
  usersAPI,
  departmentsAPI,
  equipmentAPI,
  borrowingAPI,
  returnsAPI,
  getDevices,
  getDeviceById,
  getUsers,
  getUserById,
  getBookingRequests,
} from "@/lib/api";
import { server } from "../mocks/server";
import { http, HttpResponse } from "msw";
import {
  mockUser,
  mockEquipment,
  mockBorrowingRequest,
} from "../mocks/handlers";

const API_BASE = "http://localhost:3001/api";

describe("API Client", () => {
  beforeEach(() => {
    setAuthToken(null);
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    vi.mocked(localStorage.setItem).mockClear();
    vi.mocked(localStorage.removeItem).mockClear();
  });

  describe("Token Management", () => {
    it("should set and get auth token", () => {
      setAuthToken("test-token");
      expect(getAuthToken()).toBe("test-token");
    });

    it("should clear token when set to null", () => {
      setAuthToken("test-token");
      setAuthToken(null);
      expect(getAuthToken()).toBeNull();
    });

    it("should persist token to localStorage", () => {
      setAuthToken("test-token");
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "auth-token",
        "test-token",
      );
    });

    it("should remove token from localStorage when cleared", () => {
      setAuthToken("test-token");
      setAuthToken(null);
      expect(localStorage.removeItem).toHaveBeenCalledWith("auth-token");
    });
  });

  describe("Auth API", () => {
    describe("login", () => {
      it("should login successfully with valid credentials", async () => {
        const result = await authAPI.login({
          email: "test@example.com",
          password: "password123",
        });

        expect(result.success).toBe(true);
        expect(result.token).toBe("mock-jwt-token");
        expect(result.user).toBeDefined();
        expect(result.user?.email).toBe("test@example.com");
      });

      it("should fail login with invalid credentials", async () => {
        const result = await authAPI.login({
          email: "wrong@example.com",
          password: "wrongpassword",
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe("Invalid email or password");
      });

      it("should set auth token on successful login", async () => {
        await authAPI.login({
          email: "test@example.com",
          password: "password123",
        });

        expect(getAuthToken()).toBe("mock-jwt-token");
      });
    });

    describe("signup", () => {
      it("should signup successfully", async () => {
        const result = await authAPI.signup({
          name: "New User",
          email: "new@example.com",
          password: "password123",
          department_id: 1,
        });

        expect(result.success).toBe(true);
        expect(result.token).toBe("mock-new-user-token");
        expect(result.user).toBeDefined();
      });

      it("should fail signup with existing email", async () => {
        const result = await authAPI.signup({
          name: "New User",
          email: "existing@example.com",
          password: "password123",
          department_id: 1,
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("already exists");
      });

      it("should fail signup with short password", async () => {
        const result = await authAPI.signup({
          name: "New User",
          email: "new@example.com",
          password: "123",
          department_id: 1,
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("6 characters");
      });
    });

    describe("me", () => {
      it("should return user data when authenticated", async () => {
        setAuthToken("mock-jwt-token");

        const result = await authAPI.me();

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data?.email).toBe("test@example.com");
      });

      it("should fail when not authenticated", async () => {
        const result = await authAPI.me();

        expect(result.success).toBe(false);
        expect(result.error).toBe("Unauthorized");
      });
    });

    describe("logout", () => {
      it("should clear auth token", () => {
        setAuthToken("test-token");
        authAPI.logout();
        expect(getAuthToken()).toBeNull();
      });
    });
  });

  describe("Users API", () => {
    beforeEach(() => {
      setAuthToken("mock-jwt-token");
    });

    it("should get all users", async () => {
      const result = await usersAPI.getAll();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it("should get user by ID", async () => {
      const result = await usersAPI.getById(1);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(1);
    });

    it("should return 404 for non-existent user", async () => {
      const result = await usersAPI.getById(999);

      expect(result.success).toBe(false);
      expect(result.error).toBe("User not found");
    });

    it("should update user", async () => {
      const result = await usersAPI.update(1, { name: "Updated Name" });

      expect(result.success).toBe(true);
    });

    it("should delete user", async () => {
      const result = await usersAPI.delete(1);

      expect(result.success).toBe(true);
    });
  });

  describe("Departments API", () => {
    it("should get all departments", async () => {
      const result = await departmentsAPI.getAll();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it("should get department by ID", async () => {
      const result = await departmentsAPI.getById(1);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(1);
    });

    it("should create department", async () => {
      setAuthToken("mock-admin-jwt-token");

      const result = await departmentsAPI.create({
        name: "New Department",
        code: "NEW",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Equipment API", () => {
    it("should get all equipment", async () => {
      const result = await equipmentAPI.getAll();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it("should filter equipment by category", async () => {
      const result = await equipmentAPI.getAll({ category: "laptop" });

      expect(result.success).toBe(true);
    });

    it("should filter equipment by status", async () => {
      const result = await equipmentAPI.getAll({ status: "available" });

      expect(result.success).toBe(true);
    });

    it("should get equipment by ID", async () => {
      const result = await equipmentAPI.getById(1);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(1);
    });

    it("should return 404 for non-existent equipment", async () => {
      const result = await equipmentAPI.getById(999);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Equipment not found");
    });

    it("should create equipment", async () => {
      setAuthToken("mock-admin-jwt-token");

      const result = await equipmentAPI.create({
        name: "New Device",
        asset_tag: "NEW-001",
        category: "laptop",
        brand: "Dell",
        model: "XPS 15",
        department_id: 1,
        purchase_price: 1999.99,
        purchase_date: "2024-01-15",
        specs_json: "{}",
        image_url: "https://example.com/device.jpg",
      });

      expect(result.success).toBe(true);
    });

    it("should fail to create equipment with duplicate asset tag", async () => {
      setAuthToken("mock-admin-jwt-token");

      const result = await equipmentAPI.create({
        name: "New Device",
        asset_tag: "DUPLICATE",
        category: "laptop",
        brand: "Dell",
        model: "XPS 15",
        department_id: 1,
        purchase_price: 1999.99,
        purchase_date: "2024-01-15",
        specs_json: "{}",
        image_url: "",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("already exists");
    });

    it("should get equipment by category", async () => {
      const result = await equipmentAPI.getByCategory("laptop");

      expect(result.success).toBe(true);
    });

    it("should get equipment by status", async () => {
      const result = await equipmentAPI.getByStatus("available");

      expect(result.success).toBe(true);
    });
  });

  describe("Borrowing API", () => {
    beforeEach(() => {
      setAuthToken("mock-jwt-token");
    });

    it("should get all borrowing requests", async () => {
      const result = await borrowingAPI.getAll();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it("should get borrowing request by ID", async () => {
      const result = await borrowingAPI.getById(1);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(1);
    });

    it("should create borrowing request", async () => {
      const result = await borrowingAPI.create({
        equipment_id: 1,
        start_date: "2024-03-01",
        end_date: "2024-03-15",
        reason: "Project work",
      });

      expect(result.success).toBe(true);
    });

    it("should fail to create borrowing for unavailable equipment", async () => {
      const result = await borrowingAPI.create({
        equipment_id: 999,
        start_date: "2024-03-01",
        end_date: "2024-03-15",
        reason: "Project work",
      });

      expect(result.success).toBe(false);
    });

    it("should update borrowing status", async () => {
      const result = await borrowingAPI.updateStatus(1, "approved");

      expect(result.success).toBe(true);
    });

    it("should get borrowing by user", async () => {
      const result = await borrowingAPI.getByUser(1);

      expect(result.success).toBe(true);
    });

    it("should get borrowing by status", async () => {
      const result = await borrowingAPI.getByStatus("pending");

      expect(result.success).toBe(true);
    });
  });

  describe("Returns API", () => {
    beforeEach(() => {
      setAuthToken("mock-jwt-token");
    });

    it("should get all return requests", async () => {
      const result = await returnsAPI.getAll();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it("should get return request by ID", async () => {
      const result = await returnsAPI.getById(1);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(1);
    });

    it("should create return request", async () => {
      const result = await returnsAPI.create({
        borrowing_request_id: 1,
        condition: "good",
        notes: "Device in good condition",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Helper Functions", () => {
    it("should get devices with conversion", async () => {
      const devices = await getDevices();

      expect(Array.isArray(devices)).toBe(true);
      if (devices.length > 0) {
        expect(devices[0]).toHaveProperty("image");
        expect(devices[0]).toHaveProperty("assetTag");
      }
    });

    it("should get device by ID with conversion", async () => {
      const device = await getDeviceById(1);

      expect(device).not.toBeNull();
      expect(device?.id).toBe(1);
      expect(device).toHaveProperty("image");
      expect(device).toHaveProperty("assetTag");
    });

    it("should return null for non-existent device", async () => {
      const device = await getDeviceById(999);

      expect(device).toBeNull();
    });

    it("should get users", async () => {
      setAuthToken("mock-jwt-token");
      const users = await getUsers();

      expect(Array.isArray(users)).toBe(true);
    });

    it("should get user by ID", async () => {
      setAuthToken("mock-jwt-token");
      const user = await getUserById(1);

      expect(user).not.toBeNull();
      expect(user?.id).toBe(1);
    });

    it("should get booking requests with conversion", async () => {
      setAuthToken("mock-jwt-token");
      const requests = await getBookingRequests();

      expect(Array.isArray(requests)).toBe(true);
      if (requests.length > 0) {
        expect(typeof requests[0].id).toBe("string");
        expect(typeof requests[0].deviceId).toBe("string");
        expect(typeof requests[0].userId).toBe("string");
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors", async () => {
      server.use(
        http.get(`${API_BASE}/equipment`, () => {
          return HttpResponse.error();
        }),
      );

      const result = await equipmentAPI.getAll();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should handle server errors", async () => {
      server.use(
        http.get(`${API_BASE}/equipment`, () => {
          return HttpResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 },
          );
        }),
      );

      const result = await equipmentAPI.getAll();

      expect(result.success).toBe(false);
    });
  });
});
