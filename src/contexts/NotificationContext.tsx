import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useAuth } from "./AuthContext";

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
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  link?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);
const API_BASE = import.meta.env.PROD ? (import.meta.env.VITE_API_URL || "") : "";

// Helper to get the correct link based on notification type and user role
// eslint-disable-next-line react-refresh/only-export-components
export const getNotificationLink = (
  type: NotificationType,
  isAdmin: boolean,
): string => {
  switch (type) {
    case "new_request":
      return "/admin/requests?tab=borrow";
    case "request_approved":
      return "/loans?tab=active";
    case "request_rejected":
      return "/loans?tab=history";
    case "overdue":
      return isAdmin ? "/admin/requests?tab=borrow" : "/loans?tab=active";
    case "device_returned":
      return isAdmin ? "/admin/inventory" : "/loans?tab=history";
    case "renewal_approved":
    case "renewal_rejected":
      return "/loans?tab=active";
    case "info":
    default:
      return isAdmin ? "/admin" : "/dashboard";
  }
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, user, isAdmin } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("auth-token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await fetch(`${API_BASE}/api/in-app-notifications?limit=50`, {
        headers: getAuthHeaders(),
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const mappedNotifications: Notification[] = data.data.map((n: {
            id: number;
            type: NotificationType;
            title: string;
            message: string;
            link: string | null;
            is_read: boolean;
            created_at: string;
          }) => ({
            id: String(n.id),
            type: n.type,
            title: n.title,
            message: n.message,
            link: n.link || undefined,
            read: n.is_read,
            timestamp: new Date(n.created_at),
          }));
          setNotifications(mappedNotifications);
          setUnreadCount(data.unreadCount || 0);
        }
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, [isAuthenticated, getAuthHeaders]);

  const refreshNotifications = useCallback(async () => {
    setIsLoading(true);
    await fetchNotifications();
    setIsLoading(false);
  }, [fetchNotifications]);

  // Initial fetch and polling
  useEffect(() => {
    if (isAuthenticated && user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchNotifications();

      // Poll every 30 seconds for new notifications
      pollingIntervalRef.current = setInterval(fetchNotifications, 30000);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, user, fetchNotifications]);

  const addNotification = useCallback(
    async (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
      // Only admins can create notifications via API
      if (!isAdmin || !user) {
        console.warn("Only admins can create notifications");
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/in-app-notifications`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            user_id: user.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            link: notification.link,
          }),
          credentials: "include",
        });

        if (response.ok) {
          // Refresh notifications to get the new one from backend
          await fetchNotifications();
        } else {
          console.error("Failed to create notification via API");
        }
      } catch (error) {
        console.error("Failed to create notification:", error);
      }
    },
    [isAdmin, user, getAuthHeaders, fetchNotifications],
  );

  const markAsRead = useCallback(async (id: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/in-app-notifications/${id}/read`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        credentials: "include",
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  }, [getAuthHeaders]);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/in-app-notifications/read-all`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        credentials: "include",
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  }, [getAuthHeaders]);

  const clearNotification = useCallback(async (id: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/in-app-notifications/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });

      if (response.ok) {
        setNotifications((prev) => {
          const notification = prev.find((n) => n.id === id);
          if (notification && !notification.read) {
            setUnreadCount((count) => Math.max(0, count - 1));
          }
          return prev.filter((n) => n.id !== id);
        });
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  }, [getAuthHeaders]);

  const clearAllNotifications = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/in-app-notifications/clear`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });

      if (response.ok) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Failed to clear all notifications:", error);
    }
  }, [getAuthHeaders]);

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    isLoading,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    refreshNotifications,
  }), [notifications, unreadCount, isLoading, addNotification, markAsRead, markAllAsRead, clearNotification, clearAllNotifications, refreshNotifications]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
};
