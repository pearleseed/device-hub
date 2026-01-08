import { describe, it, expect } from "vitest";
import {
  equipmentToDevice,
  borrowingToBookingRequest,
  getCategoryIcon,
  getStatusColor,
  type Equipment,
  type BorrowingRequest,
  type DeviceCategory,
  type DeviceStatus,
} from "@/lib/types";

describe("types helpers", () => {
  describe("equipmentToDevice", () => {
    const mockEquipment: Equipment = {
      id: 1,
      name: 'MacBook Pro 16"',
      asset_tag: "LAP-001",
      category: "laptop",
      brand: "Apple",
      model: 'MacBook Pro 16" M3 Max',
      status: "available",
      department_id: 1,
      department_name: "Engineering",
      purchase_price: 3499.99,
      purchase_date: "2024-01-15",
      specs: { processor: "M3 Max", ram: "36GB", storage: "1TB SSD" },
      image_url: "https://example.com/macbook.jpg",
      created_at: "2024-01-15T00:00:00.000Z",
      assigned_to_id: 5,
      assigned_to_name: "John Doe",
    };

    it("should convert equipment to device format", () => {
      const device = equipmentToDevice(mockEquipment);

      expect(device.id).toBe(mockEquipment.id);
      expect(device.name).toBe(mockEquipment.name);
      expect(device.image).toBe(mockEquipment.image_url);
      expect(device.assetTag).toBe(mockEquipment.asset_tag);
      expect(device.assignedTo).toBe(mockEquipment.assigned_to_id);
      expect(device.addedDate).toBe(mockEquipment.created_at);
    });

    it("should preserve all original equipment properties", () => {
      const device = equipmentToDevice(mockEquipment);

      expect(device.category).toBe(mockEquipment.category);
      expect(device.brand).toBe(mockEquipment.brand);
      expect(device.model).toBe(mockEquipment.model);
      expect(device.status).toBe(mockEquipment.status);
      expect(device.specs).toEqual(mockEquipment.specs);
    });

    it("should handle null assigned_to_id", () => {
      const equipmentWithoutAssignee: Equipment = {
        ...mockEquipment,
        assigned_to_id: undefined,
      };

      const device = equipmentToDevice(equipmentWithoutAssignee);

      expect(device.assignedTo).toBeNull();
    });

    it("should handle missing assigned_to_id", () => {
      const { assigned_to_id, ...equipmentWithoutId } = mockEquipment;
      const equipment = equipmentWithoutId as Equipment;

      const device = equipmentToDevice(equipment);

      expect(device.assignedTo).toBeNull();
    });
  });

  describe("borrowingToBookingRequest", () => {
    const mockBorrowingRequest: BorrowingRequest = {
      id: 1,
      equipment_id: 2,
      user_id: 3,
      approved_by: 1,
      start_date: "2024-02-01",
      end_date: "2024-02-15",
      reason: "Project development",
      status: "pending",
      created_at: "2024-01-20T00:00:00.000Z",
      updated_at: "2024-01-20T00:00:00.000Z",
      equipment_name: "MacBook Pro",
      user_name: "Test User",
    };

    it("should convert borrowing request to booking request format", () => {
      const booking = borrowingToBookingRequest(mockBorrowingRequest);

      expect(booking.id).toBe(String(mockBorrowingRequest.id));
      expect(booking.deviceId).toBe(String(mockBorrowingRequest.equipment_id));
      expect(booking.userId).toBe(String(mockBorrowingRequest.user_id));
      expect(booking.startDate).toBe(mockBorrowingRequest.start_date);
      expect(booking.endDate).toBe(mockBorrowingRequest.end_date);
      expect(booking.reason).toBe(mockBorrowingRequest.reason);
      expect(booking.status).toBe(mockBorrowingRequest.status);
      expect(booking.createdAt).toBe(mockBorrowingRequest.created_at);
    });

    it("should convert numeric IDs to strings", () => {
      const booking = borrowingToBookingRequest(mockBorrowingRequest);

      expect(typeof booking.id).toBe("string");
      expect(typeof booking.deviceId).toBe("string");
      expect(typeof booking.userId).toBe("string");
    });

    it("should handle all status types", () => {
      const statuses: BorrowingRequest["status"][] = [
        "pending",
        "approved",
        "active",
        "returned",
        "rejected",
      ];

      for (const status of statuses) {
        const request = { ...mockBorrowingRequest, status };
        const booking = borrowingToBookingRequest(request);
        expect(booking.status).toBe(status);
      }
    });
  });

  describe("getCategoryIcon", () => {
    it("should return correct icon for laptop", () => {
      expect(getCategoryIcon("laptop")).toBe("💻");
    });

    it("should return correct icon for mobile", () => {
      expect(getCategoryIcon("mobile")).toBe("📱");
    });

    it("should return correct icon for tablet", () => {
      expect(getCategoryIcon("tablet")).toBe("📲");
    });

    it("should return correct icon for monitor", () => {
      expect(getCategoryIcon("monitor")).toBe("🖥️");
    });

    it("should return correct icon for accessories", () => {
      expect(getCategoryIcon("accessories")).toBe("🎧");
    });

    it("should return icons for all valid categories", () => {
      const categories: DeviceCategory[] = [
        "laptop",
        "mobile",
        "tablet",
        "monitor",
        "accessories",
      ];

      for (const category of categories) {
        const icon = getCategoryIcon(category);
        expect(icon).toBeDefined();
        expect(typeof icon).toBe("string");
        expect(icon.length).toBeGreaterThan(0);
      }
    });
  });

  describe("getStatusColor", () => {
    it("should return correct color for available status", () => {
      const color = getStatusColor("available");
      expect(color).toContain("status-available");
    });

    it("should return correct color for borrowed status", () => {
      const color = getStatusColor("borrowed");
      expect(color).toContain("status-borrowed");
    });

    it("should return correct color for maintenance status", () => {
      const color = getStatusColor("maintenance");
      expect(color).toContain("status-maintenance");
    });

    it("should return colors for all valid statuses", () => {
      const statuses: DeviceStatus[] = ["available", "borrowed", "maintenance"];

      for (const status of statuses) {
        const color = getStatusColor(status);
        expect(color).toBeDefined();
        expect(typeof color).toBe("string");
        expect(color.length).toBeGreaterThan(0);
      }
    });

    it("should include both background and text color classes", () => {
      const statuses: DeviceStatus[] = ["available", "borrowed", "maintenance"];

      for (const status of statuses) {
        const color = getStatusColor(status);
        expect(color).toContain("bg-");
        expect(color).toContain("text-");
      }
    });
  });
});
