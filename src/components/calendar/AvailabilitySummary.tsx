import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Calendar, TrendingUp } from "lucide-react";
import { devices, bookingRequests, getDeviceById } from "@/lib/mockData";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  isWithinInterval,
  addDays,
  parseISO,
  isAfter,
  isBefore,
  startOfDay,
} from "date-fns";

export const AvailabilitySummary: React.FC = () => {
  const { t } = useLanguage();
  const today = startOfDay(new Date());
  const weekFromNow = addDays(today, 7);

  // Get active and approved bookings
  const activeBookings = bookingRequests.filter(
    (r) => r.status === "active" || r.status === "approved",
  );

  // Calculate devices available today
  const devicesAvailableToday = devices.filter((device) => {
    if (device.status === "maintenance") return false;

    const hasActiveBooking = activeBookings.some((booking) => {
      if (booking.deviceId !== device.id) return false;
      const start = parseISO(booking.startDate);
      const end = parseISO(booking.endDate);
      return (
        isWithinInterval(today, { start, end }) ||
        (isBefore(start, today) && isAfter(end, today))
      );
    });

    return !hasActiveBooking;
  });

  // Calculate devices becoming available this week
  const devicesBecomingAvailable = activeBookings
    .filter((booking) => {
      const endDate = parseISO(booking.endDate);
      return isWithinInterval(endDate, { start: today, end: weekFromNow });
    })
    .map((booking) => ({
      device: getDeviceById(booking.deviceId),
      availableDate: parseISO(booking.endDate),
    }))
    .filter((item) => item.device);

  // Pending requests count
  const pendingRequestsCount = bookingRequests.filter(
    (r) => r.status === "pending",
  ).length;

  // Devices with no scheduled bookings
  const devicesWithNoBookings = devices.filter((device) => {
    if (device.status === "maintenance") return false;
    return !bookingRequests.some(
      (r) =>
        r.deviceId === device.id &&
        (r.status === "pending" ||
          r.status === "approved" ||
          r.status === "active"),
    );
  });

  const stats = [
    {
      icon: CheckCircle,
      label: t("calendar.availableToday"),
      value: devicesAvailableToday.length,
      color: "text-green-600",
      bgColor: "bg-green-500/10",
    },
    {
      icon: Clock,
      label: t("calendar.availableThisWeek"),
      value: devicesBecomingAvailable.length,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: Calendar,
      label: t("calendar.pendingBookings"),
      value: pendingRequestsCount,
      color: "text-yellow-600",
      bgColor: "bg-yellow-500/10",
    },
    {
      icon: TrendingUp,
      label: t("calendar.noBookings"),
      value: devicesWithNoBookings.length,
      color: "text-purple-600",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <Card>
      <CardContent className="py-3 px-4">
        <div className="grid grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className={`p-1.5 rounded-md ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-semibold">{stat.value}</span>
                <span className="text-xs text-muted-foreground">
                  {stat.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        {devicesBecomingAvailable.length > 0 && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              {t("calendar.upcomingAvailability")}:
            </span>
            <div className="flex gap-1 flex-wrap">
              {devicesBecomingAvailable.slice(0, 5).map((item, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0"
                >
                  {item.device?.name}
                </Badge>
              ))}
              {devicesBecomingAvailable.length > 5 && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  +{devicesBecomingAvailable.length - 5}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
