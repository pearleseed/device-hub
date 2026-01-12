/**
 * In-App Notification Routes
 * API endpoints for managing user notifications
 */

import { db } from "../db/connection";
import { authenticateRequest, requireAdmin } from "../middleware/auth";

// ============================================================================
// Types
// ============================================================================

export type NotificationType =
  | "request_approved"
  | "request_rejected"
  | "new_request"
  | "overdue"
  | "device_returned"
  | "renewal_approved"
  | "renewal_rejected"
  | "info";

export interface Notification {
  id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  related_request_id: number | null;
  related_device_id: number | null;
  created_at: Date;
}

export interface NotificationWithDetails extends Notification {
  user_name?: string;
  user_email?: string;
  device_name?: string;
  device_asset_tag?: string;
}

export interface CreateNotificationRequest {
  user_id: number;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  related_request_id?: number;
  related_device_id?: number;
}

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
// Notification Service Functions (for internal use)
// ============================================================================

/**
 * Create a notification for a user
 */
export async function createNotification(
  data: CreateNotificationRequest
): Promise<Notification | null> {
  try {
    await db`
      INSERT INTO notifications (user_id, type, title, message, link, related_request_id, related_device_id)
      VALUES (${data.user_id}, ${data.type}, ${data.title}, ${data.message}, ${data.link || null}, ${data.related_request_id || null}, ${data.related_device_id || null})
    `;
    
    // Get the last inserted notification for this user
    const notifications = await db<Notification[]>`
      SELECT * FROM notifications 
      WHERE user_id = ${data.user_id} 
      ORDER BY id DESC 
      LIMIT 1
    `;
    
    return notifications[0] || null;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}

/**
 * Create notifications for all admins
 */
export async function notifyAdmins(
  type: NotificationType,
  title: string,
  message: string,
  link?: string,
  relatedRequestId?: number,
  relatedDeviceId?: number
): Promise<void> {
  try {
    const admins = await db<{ id: number }[]>`
      SELECT id FROM users WHERE role IN ('admin', 'superuser') AND is_active = TRUE
    `;
    
    for (const admin of admins) {
      await createNotification({
        user_id: admin.id,
        type,
        title,
        message,
        link,
        related_request_id: relatedRequestId,
        related_device_id: relatedDeviceId,
      });
    }
  } catch (error) {
    console.error("Error notifying admins:", error);
  }
}

// ============================================================================
// Routes
// ============================================================================

export const inAppNotificationsRoutes = {
  /**
   * GET /api/in-app-notifications
   * Get notifications for the authenticated user
   */
  async getAll(request: Request): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      const url = new URL(request.url);
      const unreadOnly = url.searchParams.get("unread") === "true";
      const limit = parseInt(url.searchParams.get("limit") || "50");
      const offset = parseInt(url.searchParams.get("offset") || "0");

      let notifications: NotificationWithDetails[];
      
      if (unreadOnly) {
        notifications = await db<NotificationWithDetails[]>`
          SELECT * FROM v_notification_details 
          WHERE user_id = ${payload.userId} AND is_read = FALSE
          ORDER BY created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
      } else {
        notifications = await db<NotificationWithDetails[]>`
          SELECT * FROM v_notification_details 
          WHERE user_id = ${payload.userId}
          ORDER BY created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
      }

      // Get unread count
      const countResult = await db<{ count: number }[]>`
        SELECT COUNT(*) as count FROM notifications 
        WHERE user_id = ${payload.userId} AND is_read = FALSE
      `;
      const unreadCount = countResult[0]?.count || 0;

      return jsonResponse({
        success: true,
        data: notifications,
        unreadCount,
      });
    } catch (error) {
      console.error("Get notifications error:", error);
      return jsonResponse(
        { success: false, error: "Failed to get notifications" },
        500
      );
    }
  },

  /**
   * GET /api/in-app-notifications/unread-count
   * Get unread notification count for the authenticated user
   */
  async getUnreadCount(request: Request): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      const countResult = await db<{ count: number }[]>`
        SELECT COUNT(*) as count FROM notifications 
        WHERE user_id = ${payload.userId} AND is_read = FALSE
      `;
      const unreadCount = countResult[0]?.count || 0;

      return jsonResponse({
        success: true,
        data: { unreadCount },
      });
    } catch (error) {
      console.error("Get unread count error:", error);
      return jsonResponse(
        { success: false, error: "Failed to get unread count" },
        500
      );
    }
  },

  /**
   * PATCH /api/in-app-notifications/:id/read
   * Mark a notification as read
   */
  async markAsRead(
    request: Request,
    params: Record<string, string>
  ): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      const notificationId = parseInt(params.id);
      if (isNaN(notificationId)) {
        return jsonResponse(
          { success: false, error: "Invalid notification ID" },
          400
        );
      }

      // Verify notification belongs to user
      const existing = await db<Notification[]>`
        SELECT * FROM notifications WHERE id = ${notificationId} AND user_id = ${payload.userId}
      `;

      if (existing.length === 0) {
        return jsonResponse(
          { success: false, error: "Notification not found" },
          404
        );
      }

      await db`
        UPDATE notifications SET is_read = TRUE WHERE id = ${notificationId}
      `;

      return jsonResponse({
        success: true,
        message: "Notification marked as read",
      });
    } catch (error) {
      console.error("Mark as read error:", error);
      return jsonResponse(
        { success: false, error: "Failed to mark notification as read" },
        500
      );
    }
  },

  /**
   * PATCH /api/in-app-notifications/read-all
   * Mark all notifications as read for the authenticated user
   */
  async markAllAsRead(request: Request): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      await db`
        UPDATE notifications SET is_read = TRUE WHERE user_id = ${payload.userId}
      `;

      return jsonResponse({
        success: true,
        message: "All notifications marked as read",
      });
    } catch (error) {
      console.error("Mark all as read error:", error);
      return jsonResponse(
        { success: false, error: "Failed to mark all notifications as read" },
        500
      );
    }
  },

  /**
   * DELETE /api/in-app-notifications/:id
   * Delete a notification
   */
  async delete(
    request: Request,
    params: Record<string, string>
  ): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      const notificationId = parseInt(params.id);
      if (isNaN(notificationId)) {
        return jsonResponse(
          { success: false, error: "Invalid notification ID" },
          400
        );
      }

      // Verify notification belongs to user
      const existing = await db<Notification[]>`
        SELECT * FROM notifications WHERE id = ${notificationId} AND user_id = ${payload.userId}
      `;

      if (existing.length === 0) {
        return jsonResponse(
          { success: false, error: "Notification not found" },
          404
        );
      }

      await db`DELETE FROM notifications WHERE id = ${notificationId}`;

      return jsonResponse({
        success: true,
        message: "Notification deleted",
      });
    } catch (error) {
      console.error("Delete notification error:", error);
      return jsonResponse(
        { success: false, error: "Failed to delete notification" },
        500
      );
    }
  },

  /**
   * DELETE /api/in-app-notifications/clear
   * Clear all notifications for the authenticated user
   */
  async clearAll(request: Request): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      await db`DELETE FROM notifications WHERE user_id = ${payload.userId}`;

      return jsonResponse({
        success: true,
        message: "All notifications cleared",
      });
    } catch (error) {
      console.error("Clear all notifications error:", error);
      return jsonResponse(
        { success: false, error: "Failed to clear notifications" },
        500
      );
    }
  },

  /**
   * POST /api/in-app-notifications
   * Create a notification (admin only)
   */
  async create(request: Request): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      if (!requireAdmin(payload)) {
        return jsonResponse({ success: false, error: "Forbidden" }, 403);
      }

      const body: CreateNotificationRequest = await request.json();
      const { user_id, type, title, message, link, related_request_id, related_device_id } = body;

      if (!user_id || !type || !title || !message) {
        return jsonResponse(
          { success: false, error: "user_id, type, title, and message are required" },
          400
        );
      }

      const notification = await createNotification({
        user_id,
        type,
        title,
        message,
        link,
        related_request_id,
        related_device_id,
      });

      if (!notification) {
        return jsonResponse(
          { success: false, error: "Failed to create notification" },
          500
        );
      }

      return jsonResponse({
        success: true,
        data: notification,
      }, 201);
    } catch (error) {
      console.error("Create notification error:", error);
      return jsonResponse(
        { success: false, error: "Failed to create notification" },
        500
      );
    }
  },
};
