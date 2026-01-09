import React, { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  format,
  parseISO,
  isWithinInterval,
  isSameDay,
  startOfDay,
} from "date-fns";
import {
  CalendarDays,
  Clock,
  Check,
  X,
  Smartphone,
  ChevronRight,
  CalendarX2,
} from "lucide-react";
import type { BookingRequest } from "@/lib/mockData";
import { getDeviceById, getUserById } from "@/lib/mockData";
import { useLanguage } from "@/contexts/LanguageContext";
import { BookingDetailsPopover } from "./BookingDetailsPopover";
import { cn } from "@/lib/utils";

interface DeviceCalendarViewProps {
  bookings: BookingRequest[];
  selectedDevices: string[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

const statusConfig = {
  pending: {
    color: "bg-amber-500",
    border: "border-amber-500",
    text: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/30",
  },
  approved: {
    color: "bg-blue-500",
    border: "border-blue-500",
    text: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/30",
  },
  active: {
    color: "bg-emerald-500",
    border: "border-emerald-500",
    text: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  returned: {
    color: "bg-slate-400",
    border: "border-slate-400",
    text: "text-slate-500",
    bg: "bg-slate-50 dark:bg-slate-950/30",
  },
  rejected: {
    color: "bg-red-400",
    border: "border-red-400",
    text: "text-red-500",
    bg: "bg-red-50 dark:bg-red-950/30",
  },
};

export const DeviceCalendarView: React.FC<DeviceCalendarViewProps> = ({
  bookings,
  selectedDevices,
  onApprove,
  onReject,
}) => {
  const { t } = useLanguage();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  );

  // Filter bookings by selected devices
  const filteredBookings =
    selectedDevices.length > 0
      ? bookings.filter((b) => selectedDevices.includes(b.deviceId))
      : bookings;

  // Get bookings for a specific date
  const getBookingsForDate = (date: Date) => {
    return filteredBookings.filter((booking) => {
      const start = startOfDay(parseISO(booking.startDate));
      const end = startOfDay(parseISO(booking.endDate));
      const checkDate = startOfDay(date);

      return (
        isWithinInterval(checkDate, { start, end }) ||
        isSameDay(checkDate, start) ||
        isSameDay(checkDate, end)
      );
    });
  };

  // Get bookings for selected date
  const bookingsForSelectedDate = selectedDate
    ? getBookingsForDate(selectedDate)
    : [];

  // Group bookings by status for better organization
  const pendingBookings = bookingsForSelectedDate.filter(
    (b) => b.status === "pending",
  );
  const otherBookings = bookingsForSelectedDate.filter(
    (b) => b.status !== "pending",
  );

  // Render a single booking card
  const renderBookingCard = (booking: BookingRequest) => {
    const device = getDeviceById(booking.deviceId);
    const user = getUserById(booking.userId);
    const config =
      statusConfig[booking.status as keyof typeof statusConfig] ||
      statusConfig.rejected;

    return (
      <Popover key={booking.id}>
        <PopoverTrigger asChild>
          <div
            className={cn(
              "group relative rounded-xl border bg-card p-4 cursor-pointer transition-all duration-200",
              "hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5",
              "border-l-[3px]",
              config.border,
            )}
          >
            {/* Status indicator dot */}
            <div
              className={cn(
                "absolute top-4 right-4 w-2 h-2 rounded-full",
                config.color,
              )}
            />

            {/* Device info */}
            <div className="flex items-start gap-3 mb-3">
              <div className={cn("p-2 rounded-lg", config.bg)}>
                <Smartphone className={cn("h-4 w-4", config.text)} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate pr-4">
                  {device?.name}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {device?.brand} {device?.model}
                </p>
              </div>
            </div>

            {/* User info */}
            <div className="flex items-center gap-2 mb-3">
              <Avatar className="h-6 w-6">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="text-[10px]">
                  {user?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{user?.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {user?.department}
                </p>
              </div>
            </div>

            {/* Date range */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
              <Clock className="h-3 w-3" />
              <span>
                {format(parseISO(booking.startDate), "MMM d")} -{" "}
                {format(parseISO(booking.endDate), "MMM d, yyyy")}
              </span>
            </div>

            {/* Quick actions for pending */}
            {booking.status === "pending" && (onApprove || onReject) && (
              <div className="flex gap-2 pt-3 border-t border-border/50">
                {onApprove && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8 text-xs bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      onApprove(booking.id);
                    }}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    {t("requests.approve")}
                  </Button>
                )}
                {onReject && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8 text-xs bg-red-50 border-red-200 text-red-700 hover:bg-red-100 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReject(booking.id);
                    }}
                  >
                    <X className="h-3 w-3 mr-1" />
                    {t("requests.reject")}
                  </Button>
                )}
              </div>
            )}

            {/* View details hint */}
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-auto" align="start">
          <BookingDetailsPopover
            booking={booking}
            onApprove={onApprove}
            onReject={onReject}
          />
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <TooltipProvider>
      <Card className="overflow-hidden border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row min-h-[500px]">
            {/* Calendar Section */}
            <div className="lg:w-[360px] xl:w-[400px] p-5 border-b lg:border-b-0 lg:border-r border-border/50 bg-linear-to-b from-muted/30 to-transparent shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <CalendarDays className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-semibold">
                    {t("calendar.monthlyView")}
                  </span>
                </div>
              </div>

              <div className="calendar-with-indicators">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-xl border bg-card shadow-sm w-full"
                  fullWidth
                  modifiers={{
                    hasPending: (date) =>
                      getBookingsForDate(date).some(
                        (b) => b.status === "pending",
                      ),
                    hasApproved: (date) =>
                      getBookingsForDate(date).some(
                        (b) => b.status === "approved",
                      ),
                    hasActive: (date) =>
                      getBookingsForDate(date).some(
                        (b) => b.status === "active",
                      ),
                    hasReturned: (date) =>
                      getBookingsForDate(date).some(
                        (b) => b.status === "returned",
                      ),
                  }}
                  modifiersClassNames={{
                    hasPending: "has-pending-booking",
                    hasApproved: "has-approved-booking",
                    hasActive: "has-active-booking",
                    hasReturned: "has-returned-booking",
                  }}
                />
                <style>{`
                  .calendar-with-indicators .has-pending-booking,
                  .calendar-with-indicators .has-approved-booking,
                  .calendar-with-indicators .has-active-booking,
                  .calendar-with-indicators .has-returned-booking {
                    position: relative;
                  }
                  .calendar-with-indicators .has-pending-booking::after,
                  .calendar-with-indicators .has-approved-booking::after,
                  .calendar-with-indicators .has-active-booking::after,
                  .calendar-with-indicators .has-returned-booking::after {
                    content: '';
                    position: absolute;
                    bottom: 2px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 5px;
                    height: 5px;
                    border-radius: 50%;
                    pointer-events: none;
                  }
                  .calendar-with-indicators .has-pending-booking::after {
                    background-color: #f59e0b;
                    box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2);
                  }
                  .calendar-with-indicators .has-approved-booking::after {
                    background-color: #3b82f6;
                    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
                  }
                  .calendar-with-indicators .has-active-booking::after {
                    background-color: #10b981;
                    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
                  }
                  .calendar-with-indicators .has-returned-booking::after {
                    background-color: #94a3b8;
                    box-shadow: 0 0 0 2px rgba(148, 163, 184, 0.2);
                  }
                `}</style>
              </div>

              {/* Legend */}
              <div className="mt-4 p-3 rounded-lg bg-muted/50">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Status Legend
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 cursor-help">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-500/20" />
                        <span className="text-xs text-muted-foreground">
                          {t("requests.pending")}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Awaiting approval</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 cursor-help">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-500/20" />
                        <span className="text-xs text-muted-foreground">
                          {t("requests.approved")}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Ready for pickup</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 cursor-help">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                        <span className="text-xs text-muted-foreground">
                          {t("requests.active")}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Currently in use</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 cursor-help">
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-400 ring-2 ring-slate-400/20" />
                        <span className="text-xs text-muted-foreground">
                          {t("requests.returned")}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Device returned</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>

            {/* Bookings Panel */}
            <div className="flex-1 p-5 bg-muted/10">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-semibold text-lg">
                    {selectedDate
                      ? format(selectedDate, "EEEE, MMMM d")
                      : t("calendar.selectDate")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {bookingsForSelectedDate.length === 0
                      ? "No bookings scheduled"
                      : `${bookingsForSelectedDate.length} booking${bookingsForSelectedDate.length !== 1 ? "s" : ""} scheduled`}
                  </p>
                </div>
                {pendingBookings.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                  >
                    {pendingBookings.length} pending
                  </Badge>
                )}
              </div>

              {bookingsForSelectedDate.length === 0 ? (
                /* Empty State */
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-4 rounded-full bg-muted/50 mb-4">
                    <CalendarX2 className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                  <h4 className="font-medium text-muted-foreground mb-1">
                    {t("calendar.noBookingsForDate")}
                  </h4>
                  <p className="text-sm text-muted-foreground/70 max-w-[280px]">
                    Select a date with colored indicators to view booking
                    details
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[420px] pr-1">
                  <div className="space-y-5">
                    {/* Pending bookings section */}
                    {pendingBookings.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Needs Attention ({pendingBookings.length})
                          </span>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 pt-2 pb-1">
                          {pendingBookings.map((booking) =>
                            renderBookingCard(booking),
                          )}
                        </div>
                      </div>
                    )}

                    {/* Other bookings section */}
                    {otherBookings.length > 0 && (
                      <div>
                        {pendingBookings.length > 0 && (
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Other Bookings ({otherBookings.length})
                            </span>
                          </div>
                        )}
                        <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 pt-2 pb-1">
                          {otherBookings.map((booking) =>
                            renderBookingCard(booking),
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
