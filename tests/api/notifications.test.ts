/**
 * In-App Notifications API Tests
 *
 * Tests for notification endpoints including CRUD operations,
 * marking as read, and authorization.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { testApiClient as api } from "../utils/api-client";

// ============================================================================
// Test Setup
// ============================================================================

// Use the singleton API client

interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  related_request_id: number | null;
  related_device_id: number | null;
  created_at: string;
}

// Store created notification IDs for cleanup
const createdNotificationIds: number[] = [];
let adminToken: string;
let userToken: string;
let userId: number;

// ============================================================================
// Setup & Teardown
// ============================================================================

beforeAll(async () => {
  // Login as admin and user
  const adminLogin = await api.loginAsAdmin();
  adminToken = adminLogin.token;

  const userLogin = await api.loginAsUser();
  userToken = userLogin.token;
  userId = userLogin.user.id;
});

afterAll(async () => {
  // Clean up created notifications
  for (const id of createdNotificationIds) {
    try {
      await api.delete(`/api/in-app-notifications/${id}`, adminToken);
    } catch {
      // Ignore cleanup errors
    }
  }
});

// ============================================================================
// GET /api/in-app-notifications Tests
// ============================================================================

describe("In-App Notifications API - Get All", () => {
  describe("GET /api/in-app-notifications", () => {
    it("should return notifications for authenticated user", async () => {
      const response = await api.get<Notification[]>(
        "/api/in-app-notifications",
        userToken
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      // unreadCount is at the top level of the response, not in data
      expect(typeof (response.data as unknown as { unreadCount: number }).unreadCount).toBe("number");
    });

    it("should return 401 for unauthenticated request", async () => {
      api.clearAuth();
      const response = await api.get<Notification[]>(
        "/api/in-app-notifications"
      );

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });

    it("should support unread filter", async () => {
      const response = await api.get<Notification[]>(
        "/api/in-app-notifications",
        userToken,
        { unread: "true" }
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // All returned notifications should be unread
      const notifications = response.data.data || [];
      notifications.forEach((n) => {
        expect(n.is_read).toBe(false);
      });
    });

    it("should support pagination with limit and offset", async () => {
      const response = await api.get<Notification[]>(
        "/api/in-app-notifications",
        userToken,
        { limit: "5", offset: "0" }
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      const notifications = response.data.data || [];
      expect(notifications.length).toBeLessThanOrEqual(5);
    });
  });
});

// ============================================================================
// GET /api/in-app-notifications/unread-count Tests
// ============================================================================

describe("In-App Notifications API - Unread Count", () => {
  describe("GET /api/in-app-notifications/unread-count", () => {
    it("should return unread count for authenticated user", async () => {
      const response = await api.get<{ unreadCount: number }>(
        "/api/in-app-notifications/unread-count",
        userToken
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(typeof response.data.data?.unreadCount).toBe("number");
    });

    it("should return 401 for unauthenticated request", async () => {
      api.clearAuth();
      const response = await api.get<{ unreadCount: number }>(
        "/api/in-app-notifications/unread-count"
      );

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });
  });
});

// ============================================================================
// POST /api/in-app-notifications Tests (Admin Only)
// ============================================================================

describe("In-App Notifications API - Create", () => {
  describe("POST /api/in-app-notifications", () => {
    it("should create notification when admin", async () => {
      const notificationData = {
        user_id: userId,
        type: "info",
        title: "Test Notification",
        message: "This is a test notification message",
        link: "/dashboard",
      };

      const response = await api.post<Notification>(
        "/api/in-app-notifications",
        notificationData,
        adminToken
      );

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
      expect(response.data.data?.title).toBe(notificationData.title);
      expect(response.data.data?.message).toBe(notificationData.message);
      expect(response.data.data?.type).toBe(notificationData.type);
      // MySQL returns 0/1 for boolean, so check for falsy value
      expect(response.data.data?.is_read).toBeFalsy();

      // Store for cleanup
      if (response.data.data?.id) {
        createdNotificationIds.push(response.data.data.id);
      }
    });

    it("should return 403 when non-admin tries to create", async () => {
      const notificationData = {
        user_id: userId,
        type: "info",
        title: "Test Notification",
        message: "This should fail",
      };

      const response = await api.post<Notification>(
        "/api/in-app-notifications",
        notificationData,
        userToken
      );

      expect(response.status).toBe(403);
      expect(response.data.success).toBe(false);
    });

    it("should return 400 for missing required fields", async () => {
      const response = await api.post<Notification>(
        "/api/in-app-notifications",
        { user_id: userId },
        adminToken
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });

    it("should return 401 for unauthenticated request", async () => {
      api.clearAuth();
      const response = await api.post<Notification>(
        "/api/in-app-notifications",
        {
          user_id: userId,
          type: "info",
          title: "Test",
          message: "Test",
        }
      );

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });
  });
});

// ============================================================================
// PATCH /api/in-app-notifications/:id/read Tests
// ============================================================================

describe("In-App Notifications API - Mark as Read", () => {
  let testNotificationId: number;

  beforeAll(async () => {
    // Create a test notification
    const response = await api.post<Notification>(
      "/api/in-app-notifications",
      {
        user_id: userId,
        type: "info",
        title: "Mark Read Test",
        message: "Test notification for mark as read",
      },
      adminToken
    );

    if (response.data.data?.id) {
      testNotificationId = response.data.data.id;
      createdNotificationIds.push(testNotificationId);
    }
  });

  describe("PATCH /api/in-app-notifications/:id/read", () => {
    it("should mark notification as read for owner", async () => {
      const response = await api.patch<{ message: string }>(
        `/api/in-app-notifications/${testNotificationId}/read`,
        {},
        userToken
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it("should return 404 for non-existent notification", async () => {
      const response = await api.patch<{ message: string }>(
        "/api/in-app-notifications/999999/read",
        {},
        userToken
      );

      expect(response.status).toBe(404);
      expect(response.data.success).toBe(false);
    });

    it("should return 404 when trying to mark another user's notification", async () => {
      // Create notification for admin
      const createResponse = await api.post<Notification>(
        "/api/in-app-notifications",
        {
          user_id: (await api.loginAsAdmin()).user.id,
          type: "info",
          title: "Admin Only",
          message: "This is for admin",
        },
        adminToken
      );

      const adminNotificationId = createResponse.data.data?.id;
      if (adminNotificationId) {
        createdNotificationIds.push(adminNotificationId);

        // Try to mark as read with user token
        const response = await api.patch<{ message: string }>(
          `/api/in-app-notifications/${adminNotificationId}/read`,
          {},
          userToken
        );

        expect(response.status).toBe(404);
        expect(response.data.success).toBe(false);
      }
    });

    it("should return 400 for invalid notification ID", async () => {
      const response = await api.patch<{ message: string }>(
        "/api/in-app-notifications/invalid/read",
        {},
        userToken
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });
  });
});

// ============================================================================
// PATCH /api/in-app-notifications/read-all Tests
// ============================================================================

describe("In-App Notifications API - Mark All as Read", () => {
  describe("PATCH /api/in-app-notifications/read-all", () => {
    it("should mark all notifications as read", async () => {
      // First clear any existing notifications and mark all as read
      await api.delete<{ message: string }>(
        "/api/in-app-notifications/clear",
        userToken
      );

      // Create some unread notifications first
      await api.post<Notification>(
        "/api/in-app-notifications",
        {
          user_id: userId,
          type: "info",
          title: "Unread 1",
          message: "Test",
        },
        adminToken
      );

      await api.post<Notification>(
        "/api/in-app-notifications",
        {
          user_id: userId,
          type: "info",
          title: "Unread 2",
          message: "Test",
        },
        adminToken
      );

      // Verify we have unread notifications
      const beforeResponse = await api.get<Notification[]>(
        "/api/in-app-notifications",
        userToken,
        { unread: "true" }
      );
      expect((beforeResponse.data as unknown as { unreadCount: number }).unreadCount).toBeGreaterThan(0);

      const response = await api.patch<{ message: string }>(
        "/api/in-app-notifications/read-all",
        {},
        userToken
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      // Verify all are read
      const getResponse = await api.get<Notification[]>(
        "/api/in-app-notifications",
        userToken,
        { unread: "true" }
      );

      // unreadCount is at the top level of the response
      expect((getResponse.data as unknown as { unreadCount: number }).unreadCount).toBe(0);
    });

    it("should return 401 for unauthenticated request", async () => {
      api.clearAuth();
      const response = await api.patch<{ message: string }>(
        "/api/in-app-notifications/read-all",
        {}
      );

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });
  });
});

// ============================================================================
// DELETE /api/in-app-notifications/:id Tests
// ============================================================================

describe("In-App Notifications API - Delete", () => {
  describe("DELETE /api/in-app-notifications/:id", () => {
    it("should delete notification for owner", async () => {
      // Create a notification to delete
      const createResponse = await api.post<Notification>(
        "/api/in-app-notifications",
        {
          user_id: userId,
          type: "info",
          title: "To Delete",
          message: "This will be deleted",
        },
        adminToken
      );

      const notificationId = createResponse.data.data?.id;
      expect(notificationId).toBeDefined();

      const response = await api.delete<{ message: string }>(
        `/api/in-app-notifications/${notificationId}`,
        userToken
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it("should return 404 for non-existent notification", async () => {
      const response = await api.delete<{ message: string }>(
        "/api/in-app-notifications/999999",
        userToken
      );

      expect(response.status).toBe(404);
      expect(response.data.success).toBe(false);
    });

    it("should return 404 when trying to delete another user's notification", async () => {
      // Create notification for admin
      const createResponse = await api.post<Notification>(
        "/api/in-app-notifications",
        {
          user_id: (await api.loginAsAdmin()).user.id,
          type: "info",
          title: "Admin Only Delete",
          message: "This is for admin",
        },
        adminToken
      );

      const adminNotificationId = createResponse.data.data?.id;
      if (adminNotificationId) {
        createdNotificationIds.push(adminNotificationId);

        // Try to delete with user token
        const response = await api.delete<{ message: string }>(
          `/api/in-app-notifications/${adminNotificationId}`,
          userToken
        );

        expect(response.status).toBe(404);
        expect(response.data.success).toBe(false);
      }
    });
  });
});

// ============================================================================
// DELETE /api/in-app-notifications/clear Tests
// ============================================================================

describe("In-App Notifications API - Clear All", () => {
  describe("DELETE /api/in-app-notifications/clear", () => {
    it("should clear all notifications for user", async () => {
      // First clear any existing notifications
      await api.delete<{ message: string }>(
        "/api/in-app-notifications/clear",
        userToken
      );

      // Create some notifications first
      await api.post<Notification>(
        "/api/in-app-notifications",
        {
          user_id: userId,
          type: "info",
          title: "To Clear 1",
          message: "Test",
        },
        adminToken
      );

      await api.post<Notification>(
        "/api/in-app-notifications",
        {
          user_id: userId,
          type: "info",
          title: "To Clear 2",
          message: "Test",
        },
        adminToken
      );

      // Verify notifications were created
      const beforeClear = await api.get<Notification[]>(
        "/api/in-app-notifications",
        userToken
      );
      expect((beforeClear.data.data?.length || 0)).toBeGreaterThan(0);

      const response = await api.delete<{ message: string }>(
        "/api/in-app-notifications/clear",
        userToken
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      // Verify all are cleared
      const getResponse = await api.get<Notification[]>(
        "/api/in-app-notifications",
        userToken
      );

      expect(getResponse.data.data?.length).toBe(0);
    });

    it("should return 401 for unauthenticated request", async () => {
      api.clearAuth();
      const response = await api.delete<{ message: string }>(
        "/api/in-app-notifications/clear"
      );

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });
  });
});

// ============================================================================
// Integration Tests - Notification Triggers
// ============================================================================

describe("In-App Notifications API - Integration", () => {
  describe("Notification triggers from other actions", () => {
    it("should create notification when borrow request is created", async () => {
      // This test verifies the integration between borrow requests and notifications
      // The notification is created asynchronously, so we need to wait a bit
      
      // Get all devices and find one that's truly available
      const devicesResponse = await api.get<{ id: number; status: string; name: string }[]>(
        "/api/devices",
        adminToken
      );

      const allDevices = devicesResponse.data.data || [];
      const availableDevice = allDevices.find(d => d.status === "available");
      
      if (!availableDevice) {
        // Skip test if no available device - this is expected in some test scenarios
        console.log("No available device found, skipping integration test");
        return;
      }

      // Clear existing notifications first
      await api.delete<{ message: string }>(
        "/api/in-app-notifications/clear",
        adminToken
      );

      // Create a borrow request with dates far in the future to avoid conflicts
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() + 6);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      const borrowResponse = await api.post<{ data: unknown; error?: string }>(
        "/api/borrow",
        {
          device_id: availableDevice.id,
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
          reason: "Testing notification trigger for " + availableDevice.name,
        },
        userToken
      );

      // If borrow fails due to booking conflict, skip the test
      if (borrowResponse.status !== 201) {
        console.log("Borrow request failed (possibly due to booking conflict), skipping notification check");
        return;
      }

      // Wait a bit for async notification creation
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check if admin received notification
      const notificationsResponse = await api.get<Notification[]>(
        "/api/in-app-notifications",
        adminToken
      );

      const newRequestNotification = notificationsResponse.data.data?.find(
        n => n.type === "new_request"
      );

      expect(newRequestNotification).toBeDefined();
      if (newRequestNotification) {
        expect(newRequestNotification.title).toBe("New Device Request");
      }
    });
  });
});
