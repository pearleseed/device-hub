import { db } from "../db/connection";
import { json, ok, created, err, notFound, parseId, withAuth, withAdmin } from "./_helpers";

export type NotificationType = "request_approved" | "request_rejected" | "new_request" | "overdue" | "device_returned" | "renewal_approved" | "renewal_rejected" | "info";

export interface Notification {
  id: number; user_id: number; type: NotificationType; title: string; message: string;
  link: string | null; is_read: boolean; related_request_id: number | null; related_device_id: number | null; created_at: Date;
}

export interface NotificationWithDetails extends Notification {
  user_name?: string; user_email?: string; device_name?: string; device_asset_tag?: string;
}

export interface CreateNotificationRequest {
  user_id: number; type: NotificationType; title: string; message: string;
  link?: string; related_request_id?: number; related_device_id?: number;
}

export async function createNotification(data: CreateNotificationRequest): Promise<Notification | null> {
  try {
    await db`INSERT INTO notifications (user_id, type, title, message, link, related_request_id, related_device_id) VALUES (${data.user_id}, ${data.type}, ${data.title}, ${data.message}, ${data.link || null}, ${data.related_request_id || null}, ${data.related_device_id || null})`;
    const [n] = await db<Notification[]>`SELECT * FROM notifications WHERE user_id = ${data.user_id} ORDER BY id DESC LIMIT 1`;
    return n || null;
  } catch (e) { console.error("Error creating notification:", e); return null; }
}

export async function notifyAdmins(type: NotificationType, title: string, message: string, link?: string, relatedRequestId?: number, relatedDeviceId?: number): Promise<void> {
  try {
    const admins = await db<{ id: number }[]>`SELECT id FROM users WHERE role IN ('admin', 'superuser') AND is_active = TRUE`;
    await Promise.all(admins.map(a => createNotification({ user_id: a.id, type, title, message, link, related_request_id: relatedRequestId, related_device_id: relatedDeviceId })));
  } catch (e) { console.error("Error notifying admins:", e); }
}

export const inAppNotificationsRoutes = {
  async getAll(request: Request): Promise<Response> {
    return withAuth(request, async (payload) => {
      try {
        const url = new URL(request.url);
        const unreadOnly = url.searchParams.get("unread") === "true";
        const limit = +(url.searchParams.get("limit") || 50);
        const offset = +(url.searchParams.get("offset") || 0);

        const notifications = unreadOnly
          ? await db<NotificationWithDetails[]>`SELECT * FROM v_notification_details WHERE user_id = ${payload.userId} AND is_read = FALSE ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`
          : await db<NotificationWithDetails[]>`SELECT * FROM v_notification_details WHERE user_id = ${payload.userId} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

        const [countRes] = await db<{ count: number }[]>`SELECT COUNT(*) as count FROM notifications WHERE user_id = ${payload.userId} AND is_read = FALSE`;
        return json({ success: true, data: notifications.map(n => ({ ...n, is_read: Boolean(n.is_read) })), unreadCount: Number(countRes?.count || 0) });
      } catch (e) { console.error("Get notifications error:", e); return err("Failed to get notifications", 500); }
    });
  },

  async getUnreadCount(request: Request): Promise<Response> {
    return withAuth(request, async (payload) => {
      try {
        const [res] = await db<{ count: number }[]>`SELECT COUNT(*) as count FROM notifications WHERE user_id = ${payload.userId} AND is_read = FALSE`;
        return ok({ unreadCount: Number(res?.count || 0) });
      } catch (e) { console.error("Get unread count error:", e); return err("Failed to get unread count", 500); }
    });
  },

  async markAsRead(request: Request, params: Record<string, string>): Promise<Response> {
    return withAuth(request, async (payload) => {
      try {
        const id = parseId(params.id);
        if (!id) return err("Invalid notification ID");
        const [existing] = await db<Notification[]>`SELECT * FROM notifications WHERE id = ${id} AND user_id = ${payload.userId}`;
        if (!existing) return notFound("Notification");
        await db`UPDATE notifications SET is_read = TRUE WHERE id = ${id}`;
        return ok(null, "Notification marked as read");
      } catch (e) { console.error("Mark as read error:", e); return err("Failed to mark notification as read", 500); }
    });
  },

  async markAllAsRead(request: Request): Promise<Response> {
    return withAuth(request, async (payload) => {
      try {
        await db`UPDATE notifications SET is_read = TRUE WHERE user_id = ${payload.userId} AND is_read = FALSE`;
        return ok(null, "All notifications marked as read");
      } catch (e) { console.error("Mark all as read error:", e); return err("Failed to mark all notifications as read", 500); }
    });
  },

  async delete(request: Request, params: Record<string, string>): Promise<Response> {
    return withAuth(request, async (payload) => {
      try {
        const id = parseId(params.id);
        if (!id) return err("Invalid notification ID");
        const [existing] = await db<Notification[]>`SELECT * FROM notifications WHERE id = ${id} AND user_id = ${payload.userId}`;
        if (!existing) return notFound("Notification");
        await db`DELETE FROM notifications WHERE id = ${id}`;
        return ok(null, "Notification deleted");
      } catch (e) { console.error("Delete notification error:", e); return err("Failed to delete notification", 500); }
    });
  },

  async clearAll(request: Request): Promise<Response> {
    return withAuth(request, async (payload) => {
      try {
        await db`DELETE FROM notifications WHERE user_id = ${payload.userId}`;
        return ok(null, "All notifications cleared");
      } catch (e) { console.error("Clear all notifications error:", e); return err("Failed to clear notifications", 500); }
    });
  },

  async create(request: Request): Promise<Response> {
    return withAdmin(request, async () => {
      try {
        const body: CreateNotificationRequest = await request.json();
        if (!body.user_id || !body.type || !body.title || !body.message) return err("user_id, type, title, and message are required");
        const notification = await createNotification(body);
        if (!notification) return err("Failed to create notification", 500);
        return created({ ...notification, is_read: Boolean(notification.is_read) });
      } catch (e) { console.error("Create notification error:", e); return err("Failed to create notification", 500); }
    });
  },
};
