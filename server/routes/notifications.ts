/**
 * Notification Routes
 * API endpoints for Mattermost notifications
 */

import { authenticateRequest, requireAdmin } from "../middleware/auth";
import {
  NotificationAction,
  DeviceInfo,
  sendBorrowApprovalNotification,
  sendReturnConfirmationNotification,
  sendRenewalApprovalNotification,
  getServiceStatus,
  getAllUserStates,
  getAllIdempotencyRecords,
  initializeNotificationService,
} from "../mattermost";

// ============================================================================
// Response Helpers
// ============================================================================

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ============================================================================
// Request Types
// ============================================================================

interface SendNotificationRequest {
  action: NotificationAction;
  userId: number;
  mattermostUsername: string;
  device: DeviceInfo;
  requestId: number;
  // For BORROW
  startDate?: string;
  endDate?: string;
  // For RETURN
  returnDate?: string;
  // For EXTEND
  previousEndDate?: string;
  newEndDate?: string;
}

// ============================================================================
// Routes
// ============================================================================

export const notificationsRoutes = {
  /**
   * POST /api/notifications/send
   * Sends a notification for a device action
   * Requires admin authentication
   */
  async send(request: Request): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      // Only admins can trigger notifications
      if (!requireAdmin(payload)) {
        return jsonResponse({ success: false, error: "Forbidden" }, 403);
      }

      const body: SendNotificationRequest = await request.json();
      const {
        action,
        userId,
        mattermostUsername,
        device,
        requestId,
        startDate,
        endDate,
        returnDate,
        previousEndDate,
        newEndDate,
      } = body;

      // Validate required fields
      if (!action || !Object.values(NotificationAction).includes(action)) {
        return jsonResponse(
          { success: false, error: "Invalid or missing action" },
          400,
        );
      }
      if (!userId) {
        return jsonResponse(
          { success: false, error: "User ID is required" },
          400,
        );
      }
      if (!mattermostUsername) {
        return jsonResponse(
          { success: false, error: "Mattermost username is required" },
          400,
        );
      }
      if (!device || !device.id || !device.name) {
        return jsonResponse(
          { success: false, error: "Device information is required" },
          400,
        );
      }
      if (!requestId) {
        return jsonResponse(
          { success: false, error: "Request ID is required" },
          400,
        );
      }

      // Send notification based on action type
      let result;

      switch (action) {
        case NotificationAction.BORROW:
          if (!startDate || !endDate) {
            return jsonResponse(
              {
                success: false,
                error: "Start date and end date are required for BORROW",
              },
              400,
            );
          }
          result = await sendBorrowApprovalNotification({
            userId,
            mattermostUsername,
            device,
            requestId,
            startDate,
            endDate,
          });
          break;

        case NotificationAction.RETURN:
          if (!returnDate) {
            return jsonResponse(
              { success: false, error: "Return date is required for RETURN" },
              400,
            );
          }
          result = await sendReturnConfirmationNotification({
            userId,
            mattermostUsername,
            device,
            requestId,
            returnDate,
          });
          break;

        case NotificationAction.RENEWAL:
          if (!previousEndDate || !newEndDate) {
            return jsonResponse(
              {
                success: false,
                error: "Previous and new end dates are required for RENEWAL",
              },
              400,
            );
          }
          result = await sendRenewalApprovalNotification({
            userId,
            mattermostUsername,
            device,
            requestId,
            previousEndDate,
            newEndDate,
          });
          break;

        default:
          return jsonResponse(
            { success: false, error: "Unknown action type" },
            400,
          );
      }

      if (result.success) {
        return jsonResponse({
          success: true,
          data: {
            notificationId: result.notificationId,
            channel: result.channel,
          },
          message: `Notification sent via ${result.channel}`,
        });
      } else {
        return jsonResponse(
          {
            success: false,
            error: result.error || "Failed to send notification",
          },
          500,
        );
      }
    } catch (error) {
      console.error("Send notification error:", error);
      return jsonResponse(
        { success: false, error: "Failed to send notification" },
        500,
      );
    }
  },

  /**
   * GET /api/notifications/status
   * Gets the notification service status
   * Requires admin authentication
   */
  async status(request: Request): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      if (!requireAdmin(payload)) {
        return jsonResponse({ success: false, error: "Forbidden" }, 403);
      }

      const status = getServiceStatus();

      return jsonResponse({
        success: true,
        data: status,
      });
    } catch (error) {
      console.error("Get notification status error:", error);
      return jsonResponse(
        { success: false, error: "Failed to get status" },
        500,
      );
    }
  },

  /**
   * GET /api/notifications/users
   * Gets all user notification states
   * Requires admin authentication (for debugging)
   */
  async users(request: Request): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      if (!requireAdmin(payload)) {
        return jsonResponse({ success: false, error: "Forbidden" }, 403);
      }

      const userStates = getAllUserStates();

      return jsonResponse({
        success: true,
        data: userStates,
      });
    } catch (error) {
      console.error("Get user states error:", error);
      return jsonResponse(
        { success: false, error: "Failed to get user states" },
        500,
      );
    }
  },

  /**
   * GET /api/notifications/idempotency
   * Gets all idempotency records
   * Requires admin authentication (for debugging)
   */
  async idempotency(request: Request): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      if (!requireAdmin(payload)) {
        return jsonResponse({ success: false, error: "Forbidden" }, 403);
      }

      const records = getAllIdempotencyRecords();

      return jsonResponse({
        success: true,
        data: records,
      });
    } catch (error) {
      console.error("Get idempotency records error:", error);
      return jsonResponse(
        { success: false, error: "Failed to get idempotency records" },
        500,
      );
    }
  },

  /**
   * POST /api/notifications/initialize
   * Manually initializes the notification service
   * Requires admin authentication
   */
  async initialize(request: Request): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      if (!requireAdmin(payload)) {
        return jsonResponse({ success: false, error: "Forbidden" }, 403);
      }

      const success = await initializeNotificationService();

      if (success) {
        return jsonResponse({
          success: true,
          message: "Notification service initialized",
        });
      } else {
        return jsonResponse(
          {
            success: false,
            error:
              "Failed to initialize notification service. Check configuration.",
          },
          500,
        );
      }
    } catch (error) {
      console.error("Initialize notification service error:", error);
      return jsonResponse(
        { success: false, error: "Failed to initialize notification service" },
        500,
      );
    }
  },
};
