import { useMemo, useEffect, useRef } from "react";
import { parseISO, differenceInDays, startOfDay } from "date-fns";
import type { BorrowRequestWithDetails, DeviceWithDepartment, UserPublic } from "@/types/api";
import { useBorrowRequests, useDevices, useUsers } from "@/hooks/use-api-queries";
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

  const deviceMap = useMemo(() => new Map(devices.map((d) => [d.id, d])), [devices]);
  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const overdueItems = useMemo(() => {
    const today = startOfDay(new Date());
    return bookingRequests
      .filter((r) => r.status === "active" && parseISO(r.end_date as unknown as string) < today)
      .map((request) => ({
        booking: request,
        device: deviceMap.get(request.device_id),
        user: userMap.get(request.user_id),
        daysOverdue: differenceInDays(today, parseISO(request.end_date as unknown as string)),
      }))
      .filter((item) => item.device && item.user)
      .sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [bookingRequests, deviceMap, userMap]);

  useEffect(() => {
    const existingOverdueNotifications = notifications
      .filter((n) => n.type === "overdue")
      .map((n) => n.message);

    overdueItems.forEach((item) => {
      const key = `${item.booking.id}-${item.daysOverdue}`;
      if (!notifiedRef.current.has(key) && !existingOverdueNotifications.some((msg) => msg.includes(item.device.name))) {
        addNotification({
          type: "overdue",
          title: "notifications.overdueTitle",
          message: `notifications.overdueMessage|deviceName:${item.device?.name}|count:${item.daysOverdue}|userName:${item.user?.name}`,
          link: "/admin/requests?tab=borrow",
        });
        notifiedRef.current.add(key);
      }
    });
  }, [overdueItems, addNotification, notifications]);

  const totalOverdue = overdueItems.length;

  return useMemo(() => ({
    overdueItems,
    totalOverdue,
    criticalOverdue: overdueItems.filter((item) => item.daysOverdue >= 7),
    warningOverdue: overdueItems.filter((item) => item.daysOverdue >= 3 && item.daysOverdue < 7),
    recentOverdue: overdueItems.filter((item) => item.daysOverdue < 3),
    hasOverdue: totalOverdue > 0,
  }), [overdueItems, totalOverdue]);
};
