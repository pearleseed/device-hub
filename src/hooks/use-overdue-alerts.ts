import { useState, useEffect, useMemo } from "react";
import { borrowingAPI, equipmentAPI, usersAPI } from "@/lib/api";
import type { BorrowingRequest, Equipment, User } from "@/lib/types";
import { isAfter, parseISO, format } from "date-fns";

export interface OverdueAlert {
  request: BorrowingRequest;
  device: Equipment | undefined;
  user: User | undefined;
  daysOverdue: number;
}

// Type expected by OverdueAlertsBanner component
export interface OverdueItem {
  booking: {
    id: number;
    endDate: string;
  };
  device: {
    name: string;
    assetTag: string;
  };
  user: {
    name: string;
    department: string;
  };
  daysOverdue: number;
}

export function useOverdueAlerts() {
  const [requests, setRequests] = useState<BorrowingRequest[]>([]);
  const [devices, setDevices] = useState<Equipment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [requestsRes, devicesRes, usersRes] = await Promise.all([
          borrowingAPI.getAll(),
          equipmentAPI.getAll(),
          usersAPI.getAll(),
        ]);

        if (requestsRes.success && requestsRes.data) {
          setRequests(requestsRes.data);
        }
        if (devicesRes.success && devicesRes.data) {
          setDevices(devicesRes.data);
        }
        if (usersRes.success && usersRes.data) {
          setUsers(usersRes.data);
        }
      } catch (error) {
        console.error("Error fetching overdue data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const overdueAlerts: OverdueAlert[] = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return requests
      .filter((request) => {
        if (request.status !== "active") return false;
        const endDate = parseISO(request.end_date);
        return isAfter(today, endDate);
      })
      .map((request) => {
        const endDate = parseISO(request.end_date);
        const diffTime = today.getTime() - endDate.getTime();
        const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
          request,
          device: devices.find((d) => d.id === request.equipment_id),
          user: users.find((u) => u.id === request.user_id),
          daysOverdue,
        };
      })
      .sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [requests, devices, users]);

  // Transform to OverdueItem format for the banner component
  const overdueItems: OverdueItem[] = useMemo(() => {
    return overdueAlerts
      .filter((alert) => alert.device && alert.user)
      .map((alert) => ({
        booking: {
          id: alert.request.id,
          endDate: format(parseISO(alert.request.end_date), "MMM d, yyyy"),
        },
        device: {
          name: alert.device!.name,
          assetTag: alert.device!.asset_tag,
        },
        user: {
          name: alert.user!.name,
          department: alert.user!.department_name || "Unknown",
        },
        daysOverdue: alert.daysOverdue,
      }));
  }, [overdueAlerts]);

  // Critical items are those overdue by 7+ days
  const criticalOverdue = useMemo(() => {
    return overdueItems.filter((item) => item.daysOverdue >= 7);
  }, [overdueItems]);

  return {
    overdueAlerts,
    overdueItems,
    totalOverdue: overdueItems.length,
    criticalOverdue,
    isLoading,
  };
}
