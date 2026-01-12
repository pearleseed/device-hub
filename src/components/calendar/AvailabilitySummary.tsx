import React, { useMemo } from "react";
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
import { useDevices, useBorrowRequests } from "@/hooks/use-api-queries";
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
  const { data: devices = [] } = useDevices();
  const { data: bookingRequests = [] } = useBorrowRequests();

  const today = startOfDay(new Date());
  const weekFromNow = addDays(today, 7);

  const deviceMap = useMemo(
    () => new Map(devices.map((d) => [d.id, d])),
    [devices],
  );

  // Get active and approved bookings
  const activeBookings = useMemo(
    () =>
      bookingRequests.filter(
        (r) => r.status === "active" || r.status === "approved",
      ),
    [bookingRequests],
  );

  // Calculate devices available today
  const devicesAvailableToday = useMemo(
    () =>
      devices.filter((device) => {
        if (device.status === "maintenance") return false;

        const hasActiveBooking = activeBookings.some((booking) => {
          if (booking.device_id !== device.id) return false;
          const start = parseISO(booking.start_date as unknown as string);
          const end = parseISO(booking.end_date as unknown as string);
          return (
            isWithinInterval(today, { start, end }) ||
            (isBefore(start, today) && isAfter(end, today))
          );
        });

        return !hasActiveBooking;
      }),
    [devices, activeBookings, today],
  );

  // Calculate devices becoming available this week
  const devicesBecomingAvailable = useMemo(
    () =>
      activeBookings
        .filter((booking) => {
          const endDate = parseISO(booking.end_date as unknown as string);
          return isWithinInterval(endDate, { start: today, end: weekFromNow });
        })
        .map((booking) => ({
          device: deviceMap.get(booking.device_id),
          availableDate: parseISO(booking.end_date as unknown as string),
        }))
        .filter((item) => item.device),
    [activeBookings, today, weekFromNow, deviceMap],
  );

  // Pending requests count
  const pendingRequestsCount = useMemo(
    () => bookingRequests.filter((r) => r.status === "pending").length,
    [bookingRequests],
  );

  // Devices with no scheduled bookings
  const devicesWithNoBookings = useMemo(
    () =>
      devices.filter((device) => {
        if (device.status === "maintenance") return false;
        return !bookingRequests.some(
          (r) =>
            r.device_id === device.id &&
            (r.status === "pending" ||
              r.status === "approved" ||
              r.status === "active"),
        );
      }),
    [devices, bookingRequests],
  );

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
      <Card className="border-0 shadow-md shadow-black/5 bg-gradient-to-br from-card via-card to-muted/20 overflow-hidden">
        <CardContent className="py-3 px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map((stat, index) => (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "group relative p-2.5 rounded-xl transition-all duration-300",
                      "hover:shadow-md hover:-translate-y-0.5 cursor-default",
                      "bg-gradient-to-br from-background to-muted/30",
                      "border border-border/50 hover:border-border",
                    )}
                  >
                    {/* Background decoration */}
                    <div
                      className={cn(
                        "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                        stat.bgColor,
                      )}
                      style={{ opacity: 0.03 }}
                    />

                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          "p-1.5 rounded-lg transition-transform duration-300 group-hover:scale-110",
                          stat.bgColor,
                          "ring-1",
                          stat.ringColor,
                        )}
                      >
                        <stat.icon className={cn("h-3.5 w-3.5", stat.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xl font-bold tracking-tight">
                            {stat.value}
                          </span>
                          {stat.trendUp !== null && stat.trendUp && (
                            <ArrowUpRight className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-medium truncate">
                          {stat.label}
                        </p>
                      </div>
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
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/30">
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="p-1 rounded-md bg-blue-500/10">
                  <Sparkles className="h-2.5 w-2.5 text-blue-500" />
                </div>
                <span className="text-[10px] font-semibold text-muted-foreground">
                  {t("calendar.upcomingAvailability")}
                </span>
              </div>
              <div className="flex gap-1.5 flex-wrap flex-1">
                {devicesBecomingAvailable.slice(0, 5).map((item, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-[9px] px-2 py-0.5 font-medium bg-muted/60 hover:bg-muted transition-colors"
                  >
                    <span className="truncate max-w-[100px]">
                      {item.device?.name}
                    </span>
                    <span className="ml-1 text-muted-foreground">
                      {format(item.availableDate, "MMM d")}
                    </span>
                  </Badge>
                ))}
                {devicesBecomingAvailable.length > 5 && (
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1.5 py-0.5 font-medium"
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
