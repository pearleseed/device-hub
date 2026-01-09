import React, { createContext, useContext, useState, useCallback } from "react";

export type NotificationType =
  | "request_approved"
  | "request_rejected"
  | "new_request"
  | "overdue"
  | "device_returned"
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
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp" | "read">,
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

// Initial mock notifications
const initialNotifications: Notification[] = [
  {
    id: "1",
    type: "new_request",
    title: "New Device Request",
    message: 'Sarah Chen requested MacBook Pro 16"',
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
    read: false,
    link: "/admin/requests",
  },
  {
    id: "2",
    type: "new_request",
    title: "New Device Request",
    message: 'Michael Park requested iPad Pro 12.9"',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    read: false,
    link: "/admin/requests",
  },
  {
    id: "3",
    type: "overdue",
    title: "Overdue Return",
    message: "ThinkPad X1 Carbon was due for return 2 days ago",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    read: false,
    link: "/admin/requests",
  },
  {
    id: "4",
    type: "request_approved",
    title: "Request Approved",
    message: 'Your request for Dell UltraSharp 27" has been approved',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    read: true,
    link: "/dashboard",
  },
  {
    id: "5",
    type: "device_returned",
    title: "Device Returned",
    message: "Dell XPS 15 has been returned by Sarah Chen",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    read: true,
    link: "/admin/inventory",
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

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
};
