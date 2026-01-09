import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CheckCircle,
  Clock,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { devices, bookingRequests, getDeviceById } from "@/lib/mockData";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  isWithinInterval,
  addDays,
  parseISO,
  isAfter,
  isBefore,
  startOfDay,
  format,
} from "date-fns";
import { cn } from "@/lib/utils";

export const AvailabilitySummary: React.FC = () => {
  const { t } = useLanguage();
  const today = startOfDay(new Date());
  const weekFromNow = addDays(today, 7);

  // Get active and approved bookings
  const activeBookings = bookingRequests.filter(
    (r) => r.status === "active" || r.status === "approved"
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
    (r) => r.status === "pending"
  ).length;

  // Devices with no scheduled bookings
  const devicesWithNoBookings = devices.filter((device) => {
    if (device.status === "maintenance") return false;
    return !bookingRequests.some(
      (r) =>
        r.deviceId === device.id &&
        (r.status === "pending" ||
          r.status === "approved" ||
          r.status === "active")
    );
  });

  const stats = [
    {
      icon: CheckCircle,
      label: t("calendar.availableToday"),
      value: devicesAvailableToday.length,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10",
      ringColor: "ring-emerald-500/20",
      trend: "+2 from yesterday",
      trendUp: true,
    },
    {
      icon: Clock,
      label: t("calendar.availableThisWeek"),
      value: devicesBecomingAvailable.length,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10",
      ringColor: "ring-blue-500/20",
      trend: "Next: Tomorrow",
      trendUp: null,
    },
    {
      icon: Calendar,
      label: t("calendar.pendingBookings"),
      value: pendingRequestsCount,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-500/10",
      ringColor: "ring-amber-500/20",
      trend: pendingRequestsCount > 0 ? "Needs attention" : "All clear",
      trendUp: pendingRequestsCount === 0,
    },
    {
      icon: TrendingUp,
      label: t("calendar.noBookings"),
      value: devicesWithNoBookings.length,
      color: "text-violet-600 dark:text-violet-400",
      bgColor: "bg-violet-500/10",
      ringColor: "ring-violet-500/20",
      trend: "Fully available",
      trendUp: null,
    },
  ];

  return (
    <TooltipProvider>
      <Card className="border-0 shadow-lg shadow-black/5 bg-gradient-to-br from-card via-card to-muted/20 overflow-hidden">
        <CardContent className="py-5 px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "group relative p-4 rounded-2xl transition-all duration-300",
                      "hover:shadow-lg hover:-translate-y-0.5 cursor-default",
                      "bg-gradient-to-br from-background to-muted/30",
                      "border border-border/50 hover:border-border"
                    )}
                  >
                    {/* Background decoration */}
                    <div
                      className={cn(
                        "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                        stat.bgColor
                      )}
                      style={{ opacity: 0.03 }}
                    />

                    <div className="flex items-start justify-between mb-3">
                      <div
                        className={cn(
                          "p-2.5 rounded-xl transition-transform duration-300 group-hover:scale-110",
                          stat.bgColor,
                          "ring-1",
                          stat.ringColor
                        )}
                      >
                        <stat.icon className={cn("h-4 w-4", stat.color)} />
                      </div>
                      {stat.trendUp !== null && (
                        <div
                          className={cn(
                            "flex items-center gap-0.5 text-[10px] font-medium",
                            stat.trendUp
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-amber-600 dark:text-amber-400"
                          )}
                        >
                          {stat.trendUp && <ArrowUpRight className="h-3 w-3" />}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold tracking-tight">
                          {stat.value}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {stat.trend}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          {devicesBecomingAvailable.length > 0 && (
            <div className="flex items-center gap-4 mt-5 pt-5 border-t border-border/30">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10">
                  <Sparkles className="h-3 w-3 text-blue-500" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground">
                  {t("calendar.upcomingAvailability")}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap flex-1">
                {devicesBecomingAvailable.slice(0, 5).map((item, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-[10px] px-2.5 py-1 font-medium bg-muted/60 hover:bg-muted transition-colors"
                  >
                    <span className="truncate max-w-[120px]">
                      {item.device?.name}
                    </span>
                    <span className="ml-1.5 text-muted-foreground">
                      {format(item.availableDate, "MMM d")}
                    </span>
                  </Badge>
                ))}
                {devicesBecomingAvailable.length > 5 && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-2 py-1 font-medium"
                  >
                    +{devicesBecomingAvailable.length - 5} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
