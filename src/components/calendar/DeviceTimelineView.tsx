import React, { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Layers,
  Clock,
} from "lucide-react";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  differenceInDays,
  isWithinInterval,
  addMonths,
  subMonths,
  isSameDay,
  startOfDay,
  isToday,
  isWeekend,
} from "date-fns";
import type { BookingRequest } from "@/lib/mockData";
import { devices, getUserById, getDeviceById } from "@/lib/mockData";
import { useLanguage } from "@/contexts/LanguageContext";
import { BookingDetailsPopover } from "./BookingDetailsPopover";
import { cn } from "@/lib/utils";

interface DeviceTimelineViewProps {
  bookings: BookingRequest[];
  selectedDevices: string[];
  selectedCategories: string[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

const statusConfig = {
  pending: {
    bg: "bg-gradient-to-r from-amber-500 to-amber-400",
    border: "border-amber-500/50",
    shadow: "shadow-amber-500/20",
    text: "text-white",
  },
  approved: {
    bg: "bg-gradient-to-r from-blue-500 to-blue-400",
    border: "border-blue-500/50",
    shadow: "shadow-blue-500/20",
    text: "text-white",
  },
  active: {
    bg: "bg-gradient-to-r from-emerald-500 to-emerald-400",
    border: "border-emerald-500/50",
    shadow: "shadow-emerald-500/20",
    text: "text-white",
  },
  returned: {
    bg: "bg-gradient-to-r from-slate-500 to-slate-400",
    border: "border-slate-500/50",
    shadow: "shadow-slate-500/20",
    text: "text-white",
  },
  rejected: {
    bg: "bg-gradient-to-r from-red-500 to-red-400",
    border: "border-red-500/50",
    shadow: "shadow-red-500/20",
    text: "text-white",
  },
};

const DAY_WIDTH = 36;
const ROW_HEIGHT = 56;

export const DeviceTimelineView: React.FC<DeviceTimelineViewProps> = ({
  bookings,
  selectedDevices,
  selectedCategories,
  onApprove,
  onReject,
}) => {
  const { t } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter devices
  const filteredDevices = devices.filter((device) => {
    if (selectedDevices.length > 0 && !selectedDevices.includes(device.id))
      return false;
    if (
      selectedCategories.length > 0 &&
      !selectedCategories.includes(device.category)
    )
      return false;
    return true;
  });

  // Get days of current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const today = startOfDay(new Date());

  // Get bookings for a device
  const getDeviceBookings = (deviceId: string) => {
    return bookings.filter((b) => {
      if (b.deviceId !== deviceId) return false;
      if (b.status === "rejected") return false;

      const start = parseISO(b.startDate);
      const end = parseISO(b.endDate);

      // Check if booking overlaps with current month
      return (
        isWithinInterval(monthStart, { start, end }) ||
        isWithinInterval(monthEnd, { start, end }) ||
        (start >= monthStart && start <= monthEnd) ||
        (end >= monthStart && end <= monthEnd)
      );
    });
  };

  // Calculate bar position and width
  const getBarStyles = (booking: BookingRequest) => {
    const start = parseISO(booking.startDate);
    const end = parseISO(booking.endDate);

    const displayStart = start < monthStart ? monthStart : start;
    const displayEnd = end > monthEnd ? monthEnd : end;

    const leftDays = differenceInDays(displayStart, monthStart);
    const durationDays = differenceInDays(displayEnd, displayStart) + 1;

    return {
      left: leftDays * DAY_WIDTH,
      width: Math.max(durationDays * DAY_WIDTH - 4, 20),
    };
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) =>
      direction === "prev" ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // Get stats for devices
  const totalBookings = filteredDevices.reduce(
    (acc, device) => acc + getDeviceBookings(device.id).length,
    0
  );

  return (
    <TooltipProvider>
      <Card className="overflow-hidden border-0 shadow-xl shadow-black/5 bg-gradient-to-br from-card via-card to-muted/20">
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/30 bg-gradient-to-r from-muted/30 to-transparent">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <Layers className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-sm">{t("calendar.timelineView")}</h3>
                <p className="text-xs text-muted-foreground">
                  {filteredDevices.length} device{filteredDevices.length !== 1 ? "s" : ""} • {totalBookings} booking{totalBookings !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => navigateMonth("prev")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-xs font-medium rounded-lg"
                onClick={goToToday}
              >
                Today
              </Button>
              <div className="px-4 py-1.5 rounded-lg bg-muted/50 border border-border/50">
                <span className="font-semibold text-sm">
                  {format(currentMonth, "MMMM yyyy")}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => navigateMonth("next")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="w-full" ref={scrollRef}>
            <div
              className="relative"
              style={{ minWidth: daysInMonth.length * DAY_WIDTH + 180 }}
            >
              {/* Header - Days */}
              <div className="flex border-b border-border/30 sticky top-0 bg-card/95 backdrop-blur-sm z-10">
                <div className="w-[180px] shrink-0 px-4 py-3 font-semibold text-xs text-muted-foreground border-r border-border/30 bg-muted/30 flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" />
                  {t("calendar.device")}
                </div>
                <div className="flex">
                  {daysInMonth.map((day, index) => {
                    const isTodayDate = isToday(day);
                    const isWeekendDay = isWeekend(day);
                    return (
                      <div
                        key={index}
                        className={cn(
                          "flex flex-col items-center justify-center py-2 transition-colors",
                          isTodayDate && "bg-primary/10",
                          isWeekendDay && !isTodayDate && "bg-muted/40"
                        )}
                        style={{ width: DAY_WIDTH }}
                      >
                        <span
                          className={cn(
                            "text-[9px] uppercase font-medium leading-none mb-1",
                            isTodayDate
                              ? "text-primary"
                              : isWeekendDay
                              ? "text-muted-foreground/60"
                              : "text-muted-foreground"
                          )}
                        >
                          {format(day, "EEE").charAt(0)}
                        </span>
                        <span
                          className={cn(
                            "text-xs font-semibold leading-none",
                            isTodayDate &&
                              "bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center"
                          )}
                        >
                          {format(day, "d")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Rows - Devices */}
              {filteredDevices.map((device, deviceIndex) => {
                const deviceBookings = getDeviceBookings(device.id);

                return (
                  <div
                    key={device.id}
                    className={cn(
                      "flex border-b border-border/20 transition-colors hover:bg-accent/30",
                      deviceIndex % 2 === 0 && "bg-muted/10"
                    )}
                  >
                    <div className="w-[180px] shrink-0 px-4 py-2 border-r border-border/20 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center overflow-hidden">
                        {device.image ? (
                          <img
                            src={device.image}
                            alt={device.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs truncate leading-tight">
                          {device.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground leading-tight truncate">
                          {device.brand} • {device.assetTag}
                        </div>
                      </div>
                    </div>
                    <div
                      className="relative flex-1"
                      style={{ height: ROW_HEIGHT }}
                    >
                      {/* Weekend and today backgrounds */}
                      {daysInMonth.map((day, index) => {
                        const isWeekendDay = isWeekend(day);
                        const isTodayDate = isToday(day);
                        if (!isWeekendDay && !isTodayDate) return null;
                        return (
                          <div
                            key={index}
                            className={cn(
                              "absolute top-0 bottom-0",
                              isTodayDate
                                ? "bg-primary/5"
                                : "bg-muted/20"
                            )}
                            style={{ left: index * DAY_WIDTH, width: DAY_WIDTH }}
                          />
                        );
                      })}

                      {/* Today line */}
                      {daysInMonth.some((d) => isToday(d)) && (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-primary z-10 shadow-lg shadow-primary/30"
                          style={{
                            left:
                              differenceInDays(today, monthStart) * DAY_WIDTH +
                              DAY_WIDTH / 2,
                          }}
                        />
                      )}

                      {/* Booking bars */}
                      {deviceBookings.map((booking) => {
                        const { left, width } = getBarStyles(booking);
                        const user = getUserById(booking.userId);
                        const config =
                          statusConfig[
                            booking.status as keyof typeof statusConfig
                          ] || statusConfig.rejected;

                        return (
                          <Popover key={booking.id}>
                            <PopoverTrigger asChild>
                              <div
                                className={cn(
                                  "absolute top-2 rounded-lg cursor-pointer transition-all duration-200",
                                  "hover:scale-[1.02] hover:shadow-lg hover:z-20",
                                  "flex items-center gap-2 px-2 overflow-hidden",
                                  "border",
                                  config.bg,
                                  config.border,
                                  config.shadow,
                                  "shadow-md"
                                )}
                                style={{ left, width, height: ROW_HEIGHT - 16 }}
                              >
                                <Avatar className="h-5 w-5 ring-1 ring-white/30 shrink-0">
                                  <AvatarImage src={user?.avatar} />
                                  <AvatarFallback className="text-[8px] bg-white/20">
                                    {user?.name?.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                {width > 60 && (
                                  <span
                                    className={cn(
                                      "text-[10px] font-medium truncate",
                                      config.text
                                    )}
                                  >
                                    {user?.name?.split(" ")[0]}
                                  </span>
                                )}
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
                      })}
                    </div>
                  </div>
                );
              })}

              {filteredDevices.length === 0 && (
                <div className="p-12 text-center">
                  <div className="p-4 rounded-2xl bg-muted/50 inline-block mb-4">
                    <Calendar className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground font-medium">
                    {t("calendar.noDevicesSelected")}
                  </p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Select devices from the filter to view their timeline
                  </p>
                </div>
              )}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* Legend */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-border/30 bg-gradient-to-r from-muted/30 to-transparent">
            <div className="flex items-center gap-4 text-[11px]">
              {[
                { color: "bg-amber-500", label: t("requests.pending") },
                { color: "bg-blue-500", label: t("requests.approved") },
                { color: "bg-emerald-500", label: t("requests.active") },
                { color: "bg-slate-500", label: t("requests.returned") },
              ].map((status) => (
                <div key={status.label} className="flex items-center gap-1.5">
                  <div
                    className={cn(
                      "w-2.5 h-2.5 rounded-sm",
                      status.color
                    )}
                  />
                  <span className="text-muted-foreground font-medium">
                    {status.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              <div className="w-0.5 h-4 bg-primary rounded-full" />
              <span className="text-muted-foreground font-medium">
                {t("calendar.today")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
