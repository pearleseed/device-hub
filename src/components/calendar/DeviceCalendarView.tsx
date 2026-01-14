import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  format,
  parseISO,
  isWithinInterval,
  isSameDay,
  startOfDay,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameMonth,
  isToday,
} from "date-fns";
import { enUS, vi, ja } from "date-fns/locale";
import {
  CalendarDays,
  Clock,
  Check,
  X,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  CalendarX2,
  Circle,
  Zap,
} from "lucide-react";
import type { BorrowRequestWithDetails } from "@/types/api";
import { useDevices, useUsers } from "@/hooks/use-api-queries";
import { useLanguage } from "@/contexts/LanguageContext";
import { BookingDetailsPopover } from "./BookingDetailsPopover";
import { cn } from "@/lib/utils";

interface DeviceCalendarViewProps {
  bookings: BorrowRequestWithDetails[];
  selectedDevices: string[];
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
}

const statusConfig = {
  pending: {
    color: "bg-amber-500",
    border: "border-l-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    ring: "ring-amber-500/30",
    gradient: "from-amber-500/20 to-amber-500/5",
  },
  approved: {
    color: "bg-blue-500",
    border: "border-l-blue-500",
    text: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    ring: "ring-blue-500/30",
    gradient: "from-blue-500/20 to-blue-500/5",
  },
  active: {
    color: "bg-emerald-500",
    border: "border-l-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    ring: "ring-emerald-500/30",
    gradient: "from-emerald-500/20 to-emerald-500/5",
  },
  returned: {
    color: "bg-slate-400",
    border: "border-l-slate-400",
    text: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-50 dark:bg-slate-800/40",
    ring: "ring-slate-400/30",
    gradient: "from-slate-400/20 to-slate-400/5",
  },
  rejected: {
    color: "bg-red-400",
    border: "border-l-red-400",
    text: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/40",
    ring: "ring-red-400/30",
    gradient: "from-red-400/20 to-red-400/5",
  },
};

const weekDays = ["weekdays.sun", "weekdays.mon", "weekdays.tue", "weekdays.wed", "weekdays.thu", "weekdays.fri", "weekdays.sat"];

export const DeviceCalendarView: React.FC<DeviceCalendarViewProps> = ({
  bookings,
  selectedDevices,
  onApprove,
  onReject,
}) => {
  const { t, language } = useLanguage();
  const locales = { en: enUS, vi: vi, ja: ja };
  const currentLocale = locales[language as keyof typeof locales] || enUS;

  const { data: devices = [] } = useDevices();
  const { data: users = [] } = useUsers();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const deviceMap = useMemo(
    () => new Map(devices.map((d) => [d.id, d])),
    [devices],
  );
  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  // Filter bookings by selected devices
  const filteredBookings = useMemo(() => {
    return selectedDevices.length > 0
      ? bookings.filter((b) => selectedDevices.includes(String(b.device_id)))
      : bookings;
  }, [bookings, selectedDevices]);

  // Get bookings for a specific date - show all bookings that overlap with this date
  const getBookingsForDate = (date: Date) => {
    const checkDate = startOfDay(date);
    return filteredBookings.filter((booking) => {
      const start = startOfDay(
        parseISO(booking.start_date as unknown as string),
      );
      const end = startOfDay(parseISO(booking.end_date as unknown as string));

      // Show all bookings that overlap with this date (consistent with calendar indicators)
      return (
        isWithinInterval(checkDate, { start, end }) ||
        isSameDay(checkDate, start) ||
        isSameDay(checkDate, end)
      );
    });
  };

  // Get bookings that overlap with a date (for calendar indicators)
  const getBookingsOverlappingDate = (date: Date) => {
    return filteredBookings.filter((booking) => {
      const start = startOfDay(
        parseISO(booking.start_date as unknown as string),
      );
      const end = startOfDay(parseISO(booking.end_date as unknown as string));
      const checkDate = startOfDay(date);

      return (
        isWithinInterval(checkDate, { start, end }) ||
        isSameDay(checkDate, start) ||
        isSameDay(checkDate, end)
      );
    });
  };

  // Get calendar days for current month
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Add padding days for the first week
    const startPadding = getDay(monthStart);
    const paddingDays: (Date | null)[] = Array(startPadding).fill(null);

    return [...paddingDays, ...days];
  }, [currentMonth]);

  // Get bookings for selected date
  const bookingsForSelectedDate = getBookingsForDate(selectedDate);

  // Group bookings by status for better organization
  const pendingBookings = bookingsForSelectedDate.filter(
    (b) => b.status === "pending",
  );
  const otherBookings = bookingsForSelectedDate.filter(
    (b) => b.status !== "pending",
  );

  // Get booking indicators for a date (shows all overlapping bookings)
  const getDateIndicators = (date: Date) => {
    const dayBookings = getBookingsOverlappingDate(date);
    const hasPending = dayBookings.some((b) => b.status === "pending");
    const hasApproved = dayBookings.some((b) => b.status === "approved");
    const hasActive = dayBookings.some((b) => b.status === "active");
    const hasReturned = dayBookings.some((b) => b.status === "returned");
    return {
      hasPending,
      hasApproved,
      hasActive,
      hasReturned,
      count: dayBookings.length,
    };
  };

  // Navigate months
  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  // Render a single booking card
  const renderBookingCard = (booking: BorrowRequestWithDetails) => {
    const device = deviceMap.get(booking.device_id);
    const user = userMap.get(booking.user_id);
    const config =
      statusConfig[booking.status as keyof typeof statusConfig] ||
      statusConfig.rejected;

    return (
      <Popover key={booking.id}>
        <PopoverTrigger asChild>
          <div className="p-1">
            <div
              className={cn(
                "group relative rounded-xl border-l-3 bg-card p-3 cursor-pointer transition-all duration-300",
                "hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5",
                "border border-border/50",
                config.border,
              )}
            >
              {/* Header: Status + Device */}
              <div className="flex items-center gap-2 mb-2">
                <div className={cn("p-1.5 rounded-lg shrink-0", config.bg)}>
                  <Smartphone className={cn("h-4 w-4", config.text)} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm truncate">
                    {device?.name}
                  </h4>
                  <p className="text-xs text-muted-foreground truncate">
                    {device?.brand} • {device?.model}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 shrink-0",
                    config.bg,
                    config.text,
                  )}
                >
                  {booking.status}
                </Badge>
              </div>

              {/* User + Date row */}
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6 ring-1 ring-background shrink-0">
                  <AvatarImage src={user?.avatar_url || undefined} />
                  <AvatarFallback className="text-[9px] font-medium">
                    {user?.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium truncate flex-1">
                  {user?.name}
                </span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <Clock className="h-3 w-3" />
                  <span>
                    {format(
                      parseISO(booking.start_date as unknown as string),
                      "MMM d",
                    )}{" "}
                    –{" "}
                    {format(
                      parseISO(booking.end_date as unknown as string),
                      "MMM d",
                    )}
                  </span>
                </div>
              </div>

              {/* Quick actions for pending */}
              {booking.status === "pending" && (onApprove || onReject) && (
                <div className="flex gap-1.5 pt-2 mt-2 border-t border-border/50">
                  {onApprove && (
                    <Button
                      size="sm"
                      className="flex-1 h-8 text-xs font-medium bg-emerald-500 hover:bg-emerald-600 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        onApprove(booking.id);
                      }}
                    >
                      <Check className="h-3.5 w-3.5 mr-1" />
                      {t("calendar.approve")}
                    </Button>
                  )}
                  {onReject && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-8 text-xs font-medium border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        onReject(booking.id);
                      }}
                    >
                      <X className="h-3.5 w-3.5 mr-1" />
                      {t("calendar.reject")}
                    </Button>
                  )}
                </div>
              )}
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
      <Card className="overflow-hidden border-0 shadow-xl shadow-black/5 bg-linear-to-br from-card via-card to-muted/20 h-[calc(100vh-280px)] min-h-[500px]">
        <CardContent className="p-0 h-full">
          <div className="flex flex-col lg:flex-row h-full">
            {/* Calendar Section */}
            <div className="lg:w-[380px] xl:w-[420px] p-4 border-b lg:border-b-0 lg:border-r border-border/30 bg-linear-to-b from-muted/20 to-transparent shrink-0 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 ring-1 ring-primary/20">
                    <CalendarDays className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">
                      {format(currentMonth, "MMMM yyyy")}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {filteredBookings.length} booking
                      {filteredBookings.length !== 1 ? "s" : ""} total
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    onClick={handlePrevMonth}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 text-xs font-medium rounded-lg"
                    onClick={handleToday}
                  >
                    {t("calendar.today")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    onClick={handleNextMonth}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Custom Calendar Grid */}
              <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden flex-1 flex flex-col">
                {/* Week days header */}
                <div className="grid grid-cols-7 border-b border-border/30 bg-muted/30">
                  {weekDays.map((dayKey) => (
                    <div
                      key={dayKey}
                      className="py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                    >
                      {t(dayKey)}
                    </div>
                  ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7 flex-1">
                  {calendarDays.map((day, index) => {
                    if (!day) {
                      return (
                        <div
                          key={`empty-${index}`}
                          className="border-b border-r border-border/20 last:border-r-0"
                        />
                      );
                    }

                    const {
                      hasPending,
                      hasApproved,
                      hasActive,
                      hasReturned,
                      count,
                    } = getDateIndicators(day);
                    const isSelected = isSameDay(day, selectedDate);
                    const isTodayDate = isToday(day);
                    const isCurrentMonth = isSameMonth(day, currentMonth);

                    return (
                      <Tooltip key={day.toISOString()}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setSelectedDate(day)}
                            className={cn(
                              "p-1 border-b border-r border-border/20 last:border-r-0",
                              "flex flex-col items-center justify-center gap-0.5",
                              "transition-all duration-200 hover:bg-muted/50 relative",
                              "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-inset",
                              isSelected &&
                                "bg-primary/10 ring-2 ring-primary/30 ring-inset",
                              !isCurrentMonth && "opacity-30",
                            )}
                          >
                            <span
                              className={cn(
                                "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full transition-all",
                                isTodayDate &&
                                  "bg-primary text-primary-foreground font-bold shadow-md",
                                isSelected &&
                                  !isTodayDate &&
                                  "bg-primary/20 font-semibold",
                              )}
                            >
                              {format(day, "d")}
                            </span>

                            {/* Booking indicators */}
                            {count > 0 && (
                              <div className="flex items-center gap-0.5">
                                {hasPending && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                )}
                                {hasApproved && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                )}
                                {hasActive && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                )}
                                {hasReturned && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                )}
                              </div>
                            )}
                          </button>
                        </TooltipTrigger>
                        {count > 0 && (
                          <TooltipContent side="top" className="text-xs">
                            {count} booking{count !== 1 ? "s" : ""}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="mt-3 p-3 rounded-lg bg-muted/40 border border-border/30">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                  {t("calendar.statusLegend")}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      color: "bg-amber-500",
                      labelKey: "calendar.pending",
                      hintKey: "calendar.awaitingApproval",
                    },
                    {
                      color: "bg-blue-500",
                      labelKey: "calendar.approved",
                      hintKey: "calendar.readyForPickup",
                    },
                    {
                      color: "bg-emerald-500",
                      labelKey: "calendar.active",
                      hintKey: "calendar.currentlyInUse",
                    },
                    {
                      color: "bg-slate-400",
                      labelKey: "calendar.returned",
                      hintKey: "calendar.deviceReturned",
                    },
                  ].map((status) => (
                    <Tooltip key={status.labelKey}>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 cursor-help group">
                          <div
                            className={cn(
                              "w-2.5 h-2.5 rounded-full transition-transform group-hover:scale-110",
                              status.color,
                            )}
                          />
                          <span className="text-xs text-muted-foreground font-medium">
                            {t(status.labelKey)}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>{t(status.hintKey)}</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            </div>

            {/* Bookings Panel */}
            <div className="flex-1 p-4 bg-linear-to-br from-transparent to-muted/10 flex flex-col min-h-0">
              {/* Header */}
              <div className="flex items-center justify-between mb-3 shrink-0">
                <div>
                  <h3 className="font-bold text-base">
                    {format(selectedDate, t("common.dateFormatWithWeekday"), {
                      locale: currentLocale,
                    })}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {bookingsForSelectedDate.length === 0
                      ? t("calendar.noBookingsScheduled")
                      : `${bookingsForSelectedDate.length} ${bookingsForSelectedDate.length !== 1 ? t("calendar.bookings") : t("calendar.booking")}`}
                  </p>
                </div>
                {pendingBookings.length > 0 && (
                  <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20 font-semibold text-xs px-2.5 py-1">
                    <Zap className="h-3 w-3 mr-1" />
                    {pendingBookings.length} {t("calendar.pending").toLowerCase()}
                  </Badge>
                )}
              </div>

              {bookingsForSelectedDate.length === 0 ? (
                /* Empty State */
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="relative mb-3">
                    <div className="p-4 rounded-xl bg-linear-to-br from-muted/80 to-muted/40 ring-1 ring-border/50">
                      <CalendarX2 className="h-7 w-7 text-muted-foreground/40" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-card border border-border shadow-lg">
                      <Circle className="h-2.5 w-2.5 text-muted-foreground/30" />
                    </div>
                  </div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-0.5">
                    {t("calendar.noBookings")}
                  </h4>
                  <p className="text-xs text-muted-foreground/70 max-w-[200px]">
                    {t("calendar.selectDateWithIndicators")}
                  </p>
                </div>
              ) : (
                <ScrollArea className="flex-1 pr-1">
                  <div className="space-y-3">
                    {/* Pending bookings section */}
                    {pendingBookings.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            {t("calendar.needsAttention")} ({pendingBookings.length})
                          </span>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3">
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
                          <div className="flex items-center gap-1.5 mb-2">
                            <div className="w-2 h-2 rounded-full bg-slate-400" />
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                              {t("calendar.otherBookings")} ({otherBookings.length})
                            </span>
                          </div>
                        )}
                        <div className="grid gap-2 sm:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3">
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
