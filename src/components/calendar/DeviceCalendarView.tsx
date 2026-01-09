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
import {
  CalendarDays,
  Clock,
  Check,
  X,
  Smartphone,
  ChevronRight,
  ChevronLeft,
  CalendarX2,
  Circle,
  Zap,
  User,
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

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const DeviceCalendarView: React.FC<DeviceCalendarViewProps> = ({
  bookings,
  selectedDevices,
  onApprove,
  onReject,
}) => {
  const { t } = useLanguage();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Filter bookings by selected devices
  const filteredBookings = useMemo(() => {
    return selectedDevices.length > 0
      ? bookings.filter((b) => selectedDevices.includes(b.deviceId))
      : bookings;
  }, [bookings, selectedDevices]);

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
    (b) => b.status === "pending"
  );
  const otherBookings = bookingsForSelectedDate.filter(
    (b) => b.status !== "pending"
  );

  // Get booking indicators for a date
  const getDateIndicators = (date: Date) => {
    const dayBookings = getBookingsForDate(date);
    const hasPending = dayBookings.some((b) => b.status === "pending");
    const hasApproved = dayBookings.some((b) => b.status === "approved");
    const hasActive = dayBookings.some((b) => b.status === "active");
    const hasReturned = dayBookings.some((b) => b.status === "returned");
    return { hasPending, hasApproved, hasActive, hasReturned, count: dayBookings.length };
  };

  // Navigate months
  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

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
          <div className="p-2">
            <div
              className={cn(
                "group relative rounded-2xl border-l-4 bg-card p-4 cursor-pointer transition-all duration-300",
                "hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 hover:scale-[1.01]",
                "border border-border/50",
                config.border
              )}
            >

            {/* Status badge */}
            <div className="flex items-center justify-between mb-3">
              <Badge
                variant="secondary"
                className={cn(
                  "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5",
                  config.bg,
                  config.text
                )}
              >
                {booking.status}
              </Badge>
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Device info */}
            <div className="flex items-start gap-3 mb-4">
              <div
                className={cn(
                  "p-2.5 rounded-xl transition-all duration-200",
                  config.bg,
                  "group-hover:scale-110"
                )}
              >
                <Smartphone className={cn("h-4 w-4", config.text)} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm truncate">{device?.name}</h4>
                <p className="text-xs text-muted-foreground">
                  {device?.brand} • {device?.model}
                </p>
              </div>
            </div>

            {/* User info */}
            <div className="flex items-center gap-2.5 mb-3">
              <Avatar className="h-7 w-7 ring-2 ring-background">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="text-[10px] font-medium">
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
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-2.5 py-1.5">
              <Clock className="h-3 w-3" />
              <span className="font-medium">
                {format(parseISO(booking.startDate), "MMM d")} –{" "}
                {format(parseISO(booking.endDate), "MMM d, yyyy")}
              </span>
            </div>

            {/* Quick actions for pending */}
            {booking.status === "pending" && (onApprove || onReject) && (
              <div className="flex gap-2 pt-4 mt-4 border-t border-border/50">
                {onApprove && (
                  <Button
                    size="sm"
                    className="flex-1 h-9 text-xs font-medium bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onApprove(booking.id);
                    }}
                  >
                    <Check className="h-3.5 w-3.5 mr-1.5" />
                    Approve
                  </Button>
                )}
                {onReject && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-9 text-xs font-medium border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/50"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReject(booking.id);
                    }}
                  >
                    <X className="h-3.5 w-3.5 mr-1.5" />
                    Reject
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
      <Card className="overflow-hidden border-0 shadow-xl shadow-black/5 bg-linear-to-br from-card via-card to-muted/20">
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row min-h-[600px]">
            {/* Calendar Section */}
            <div className="lg:w-[420px] xl:w-[460px] p-6 border-b lg:border-b-0 lg:border-r border-border/30 bg-linear-to-b from-muted/20 to-transparent shrink-0">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 ring-1 ring-primary/20">
                    <CalendarDays className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{format(currentMonth, "MMMM yyyy")}</h3>
                    <p className="text-xs text-muted-foreground">
                      {filteredBookings.length} booking{filteredBookings.length !== 1 ? "s" : ""} total
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
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
                    Today
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
              <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
                {/* Week days header */}
                <div className="grid grid-cols-7 border-b border-border/30 bg-muted/30">
                  {weekDays.map((day) => (
                    <div
                      key={day}
                      className="py-3 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7">
                  {calendarDays.map((day, index) => {
                    if (!day) {
                      return (
                        <div
                          key={`empty-${index}`}
                          className="aspect-square border-b border-r border-border/20 last:border-r-0"
                        />
                      );
                    }

                    const { hasPending, hasApproved, hasActive, hasReturned, count } =
                      getDateIndicators(day);
                    const isSelected = isSameDay(day, selectedDate);
                    const isTodayDate = isToday(day);
                    const isCurrentMonth = isSameMonth(day, currentMonth);

                    return (
                      <Tooltip key={day.toISOString()}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setSelectedDate(day)}
                            className={cn(
                              "aspect-square p-1 border-b border-r border-border/20 last:border-r-0",
                              "flex flex-col items-center justify-center gap-0.5",
                              "transition-all duration-200 hover:bg-muted/50 relative",
                              "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-inset",
                              isSelected && "bg-primary/10 ring-2 ring-primary/30 ring-inset",
                              !isCurrentMonth && "opacity-30"
                            )}
                          >
                            <span
                              className={cn(
                                "text-sm font-medium w-8 h-8 flex items-center justify-center rounded-full transition-all",
                                isTodayDate &&
                                  "bg-primary text-primary-foreground font-bold shadow-md",
                                isSelected && !isTodayDate && "bg-primary/20 font-semibold"
                              )}
                            >
                              {format(day, "d")}
                            </span>

                            {/* Booking indicators */}
                            {count > 0 && (
                              <div className="flex items-center gap-0.5 mt-0.5">
                                {hasPending && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 ring-1 ring-amber-500/30" />
                                )}
                                {hasApproved && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 ring-1 ring-blue-500/30" />
                                )}
                                {hasActive && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-1 ring-emerald-500/30" />
                                )}
                                {hasReturned && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 ring-1 ring-slate-400/30" />
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
              <div className="mt-5 p-4 rounded-xl bg-muted/40 border border-border/30">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
                  Status Legend
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { color: "bg-amber-500", label: "Pending", hint: "Awaiting approval" },
                    { color: "bg-blue-500", label: "Approved", hint: "Ready for pickup" },
                    { color: "bg-emerald-500", label: "Active", hint: "Currently in use" },
                    { color: "bg-slate-400", label: "Returned", hint: "Device returned" },
                  ].map((status) => (
                    <Tooltip key={status.label}>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 cursor-help group">
                          <div
                            className={cn(
                              "w-3 h-3 rounded-full ring-2 ring-offset-1 ring-offset-background transition-transform group-hover:scale-110",
                              status.color,
                              `ring-${status.color}/20`
                            )}
                          />
                          <span className="text-xs text-muted-foreground font-medium">
                            {status.label}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>{status.hint}</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            </div>

            {/* Bookings Panel */}
            <div className="flex-1 p-6 bg-linear-to-br from-transparent to-muted/10">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-xl">
                    {format(selectedDate, "EEEE, MMMM d")}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {bookingsForSelectedDate.length === 0
                      ? "No bookings scheduled"
                      : `${bookingsForSelectedDate.length} booking${bookingsForSelectedDate.length !== 1 ? "s" : ""} scheduled`}
                  </p>
                </div>
                {pendingBookings.length > 0 && (
                  <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20 font-semibold">
                    <Zap className="h-3 w-3 mr-1" />
                    {pendingBookings.length} pending
                  </Badge>
                )}
              </div>

              {bookingsForSelectedDate.length === 0 ? (
                /* Empty State */
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="relative mb-6">
                    <div className="p-6 rounded-3xl bg-linear-to-br from-muted/80 to-muted/40 ring-1 ring-border/50">
                      <CalendarX2 className="h-12 w-12 text-muted-foreground/40" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 p-2 rounded-full bg-card border border-border shadow-lg">
                      <Circle className="h-4 w-4 text-muted-foreground/30" />
                    </div>
                  </div>
                  <h4 className="font-semibold text-lg text-muted-foreground mb-2">
                    No Bookings
                  </h4>
                  <p className="text-sm text-muted-foreground/70 max-w-[280px]">
                    Select a date with colored indicators to view booking details
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[480px] pr-2">
                  <div className="space-y-6">
                    {/* Pending bookings section */}
                    {pendingBookings.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            Needs Attention ({pendingBookings.length})
                          </span>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-1 xl:grid-cols-2">
                          {pendingBookings.map((booking) =>
                            renderBookingCard(booking)
                          )}
                        </div>
                      </div>
                    )}

                    {/* Other bookings section */}
                    {otherBookings.length > 0 && (
                      <div>
                        {pendingBookings.length > 0 && (
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-2 h-2 rounded-full bg-slate-400" />
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                              Other Bookings ({otherBookings.length})
                            </span>
                          </div>
                        )}
                        <div className="grid gap-4 sm:grid-cols-1 xl:grid-cols-2">
                          {otherBookings.map((booking) =>
                            renderBookingCard(booking)
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
