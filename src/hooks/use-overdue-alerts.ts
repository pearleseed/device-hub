import { useMemo, useEffect, useRef } from "react";
import { parseISO, differenceInDays, startOfDay } from "date-fns";
import type {
  BorrowRequestWithDetails,
  DeviceWithDepartment,
  UserPublic,
} from "@/types/api";
import {
  useBorrowRequests,
  useDevices,
  useUsers,
} from "@/hooks/use-api-queries";
import { useNotifications } from "@/contexts/NotificationContext";

export interface OverdueItem {
  booking: BorrowRequestWithDetails;
  device: DeviceWithDepartment | undefined;
  user: UserPublic | undefined;
  daysOverdue: number;
}

export const useOverdueAlerts = () => {
  const { addNotification, notifications } = useNotifications();
  const notifiedRef = useRef<Set<string>>(new Set());

  const { data: bookingRequests = [] } = useBorrowRequests();
  const { data: devices = [] } = useDevices();
  const { data: users = [] } = useUsers();

  const deviceMap = useMemo(
    () => new Map(devices.map((d) => [d.id, d])),
    [devices],
  );
  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const overdueItems = useMemo(() => {
    const today = startOfDay(new Date());

    return bookingRequests
      .filter((request) => {
        if (request.status !== "active") return false;
        const endDate = parseISO(request.end_date as unknown as string);
        return endDate < today;
      })
      .map((request) => {
        const device = deviceMap.get(request.device_id);
        const user = userMap.get(request.user_id);
        const endDate = parseISO(request.end_date as unknown as string);
        const daysOverdue = differenceInDays(today, endDate);

        return {
          booking: request,
          device,
          user,
          daysOverdue,
        };
      })
      .filter((item) => item.device && item.user)
      .sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [bookingRequests, deviceMap, userMap]);

  // Generate notifications for overdue items that haven't been notified
  useEffect(() => {
    // Check existing overdue notifications to avoid duplicates
    const existingOverdueNotifications = notifications
      .filter((n) => n.type === "overdue")
      .map((n) => n.message);

    overdueItems.forEach((item) => {
      const key = `${item.booking.id}-${item.daysOverdue}`;

      // Only notify if we haven't already notified for this exact overdue state
      if (!notifiedRef.current.has(key)) {
        // Check if a similar notification already exists
        const alreadyExists = existingOverdueNotifications.some((msg) =>
          msg.includes(item.device.name),
        );

        if (!alreadyExists) {
          addNotification({
            type: "overdue",
            title: "Overdue Return Alert",
            message: `${item.device?.name} is ${item.daysOverdue} day${item.daysOverdue > 1 ? "s" : ""} overdue (assigned to ${item.user?.name})`,
            link: "/admin/requests?tab=borrow",
            audience: "admin",
          });
        }

        notifiedRef.current.add(key);
      }
    });
  }, [overdueItems, addNotification, notifications]);

  const totalOverdue = overdueItems.length;

  const criticalOverdue = overdueItems.filter((item) => item.daysOverdue >= 7);
  const warningOverdue = overdueItems.filter(
    (item) => item.daysOverdue >= 3 && item.daysOverdue < 7,
  );
  const recentOverdue = overdueItems.filter((item) => item.daysOverdue < 3);

  return {
    overdueItems,
    totalOverdue,
    criticalOverdue,
    warningOverdue,
    recentOverdue,
    hasOverdue: totalOverdue > 0,
  };
};
