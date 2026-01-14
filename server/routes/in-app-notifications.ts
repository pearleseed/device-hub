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
      const url = new URL(request.url);
      const { unread, limit, offset } = Object.fromEntries(url.searchParams);
      let sql = "SELECT * FROM v_notification_details WHERE user_id = ?";
      const params: unknown[] = [payload.userId];
      if (unread === "true") sql += " AND is_read = FALSE";
      sql += " ORDER BY created_at DESC";
      if (limit) { sql += " LIMIT ?"; params.push(+limit); }
      if (offset) { sql += " OFFSET ?"; params.push(+offset); }
      const notifications = await db.unsafe<NotificationWithDetails[]>(sql, params);
      const [unreadResult] = await db<{ count: number }[]>`SELECT COUNT(*) as count FROM notifications WHERE user_id = ${payload.userId} AND is_read = FALSE`;
      
      const mapped = notifications.map(n => ({ ...n, is_read: !!n.is_read }));
      return json({ 
        success: true, 
        data: mapped, 
        unreadCount: unreadResult.count 
      });
    });
  },

  async getUnreadCount(request: Request): Promise<Response> {
    return withAuth(request, async (payload) => {
      const [result] = await db<{ count: number }[]>`SELECT COUNT(*) as count FROM notifications WHERE user_id = ${payload.userId} AND is_read = FALSE`;
      return ok({ unreadCount: result.count });
    });
  },

  async markAsRead(request: Request, params: Record<string, string>): Promise<Response> {
    return withAuth(request, async (payload) => {
      const id = parseId(params.id);
      if (!id) return err("Invalid notification ID");
      const [notif] = await db<Notification[]>`SELECT * FROM notifications WHERE id = ${id}`;
      if (!notif) return notFound("Notification");
      if (notif.user_id !== payload.userId) return notFound("Notification");
      await db`UPDATE notifications SET is_read = TRUE WHERE id = ${id}`;
      return ok(null, "Notification marked as read");
    });
  },

  async markAllAsRead(request: Request): Promise<Response> {
    return withAuth(request, async (payload) => {
      await db`UPDATE notifications SET is_read = TRUE WHERE user_id = ${payload.userId}`;
      return ok(null, "All notifications marked as read");
    });
  },

  async delete(request: Request, params: Record<string, string>): Promise<Response> {
    return withAuth(request, async (payload) => {
      const id = parseId(params.id);
      if (!id) return err("Invalid notification ID");
      const [notif] = await db<Notification[]>`SELECT * FROM notifications WHERE id = ${id}`;
      if (!notif) return notFound("Notification");
      if (notif.user_id !== payload.userId) return notFound("Notification");
      await db`DELETE FROM notifications WHERE id = ${id}`;
      return ok(null, "Notification deleted");
    });
  },

  async clearAll(request: Request): Promise<Response> {
    return withAuth(request, async (payload) => {
      await db`DELETE FROM notifications WHERE user_id = ${payload.userId}`;
      return ok(null, "All notifications cleared");
    });
  },

  async create(request: Request): Promise<Response> {
    return withAdmin(request, async (payload) => {
      const body = await request.json();
      const { user_id, type, title, message, link, related_request_id, related_device_id } = body;
      if (!user_id || !type || !title || !message) return err("Required fields missing");
      const notification = await createNotification({ user_id, type, title, message, link, related_request_id, related_device_id });
      if (!notification) return err("Failed to create notification", 500);
      return created(notification, "Notification created");
    });
  },
};
