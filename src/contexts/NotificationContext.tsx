import React, { createContext, useContext, useState, useCallback } from "react";

export type NotificationType =
  | "request_approved"
  | "request_rejected"
  | "new_request"
  | "overdue"
  | "device_returned"
  | "info";

// Target audience for each notification type
export type NotificationAudience = "admin" | "user" | "all";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  link?: string;
  audience: NotificationAudience;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp" | "read">,
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  getNotificationsForRole: (isAdmin: boolean) => Notification[];
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

// Helper to get the correct link based on notification type and user role
// eslint-disable-next-line react-refresh/only-export-components
export const getNotificationLink = (type: NotificationType, isAdmin: boolean): string => {
  switch (type) {
    case "new_request":
      return "/admin/requests?tab=borrow"; // Admin sees borrow requests tab
    case "request_approved":
      return "/loans?tab=active"; // User sees their active loans
    case "request_rejected":
      return "/loans?tab=history"; // User sees history (rejected requests)
    case "overdue":
      return isAdmin ? "/admin/requests?tab=borrow" : "/loans?tab=active"; // Admin sees borrow tab, user sees active loans
    case "device_returned":
      return "/admin/inventory"; // Admin inventory (no tabs)
    case "info":
    default:
      return isAdmin ? "/admin" : "/dashboard";
  }
};

// Initial mock notifications with audience
const initialNotifications: Notification[] = [
  {
    id: "1",
    type: "new_request",
    title: "New Device Request",
    message: 'Sarah Chen requested MacBook Pro 16"',
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
    read: false,
    link: "/admin/requests?tab=borrow",
    audience: "admin",
  },
  {
    id: "2",
    type: "new_request",
    title: "New Device Request",
    message: 'Michael Park requested iPad Pro 12.9"',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    read: false,
    link: "/admin/requests?tab=borrow",
    audience: "admin",
  },
  {
    id: "3",
    type: "overdue",
    title: "Overdue Return",
    message: "ThinkPad X1 Carbon was due for return 2 days ago",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    read: false,
    link: "/admin/requests?tab=borrow",
    audience: "admin",
  },
  {
    id: "4",
    type: "request_approved",
    title: "Request Approved",
    message: 'Your request for Dell UltraSharp 27" has been approved',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    read: true,
    link: "/loans?tab=active",
    audience: "user",
  },
  {
    id: "5",
    type: "device_returned",
    title: "Device Returned",
    message: "Dell XPS 15 has been returned by Sarah Chen",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    read: true,
    link: "/admin/inventory",
    audience: "admin",
  },
];

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
      const newNotification: Notification = {
        ...notification,
        id: String(Date.now()),
        timestamp: new Date(),
        read: false,
      };
      setNotifications((prev) => [newNotification, ...prev]);
    },
    [],
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Filter notifications based on user role
  const getNotificationsForRole = useCallback((isAdmin: boolean) => {
    return notifications.filter((n) => {
      if (n.audience === "all") return true;
      return isAdmin ? n.audience === "admin" : n.audience === "user";
    });
  }, [notifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotification,
        getNotificationsForRole,
      }}
    >
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
