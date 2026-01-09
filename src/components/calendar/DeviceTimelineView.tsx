import React, { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
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
} from "date-fns";
import type { BookingRequest } from "@/lib/mockData";
import { devices, getUserById } from "@/lib/mockData";
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

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-500/90";
    case "approved":
      return "bg-blue-500/90";
    case "active":
      return "bg-orange-500/90";
    case "returned":
      return "bg-green-500/90";
    case "rejected":
      return "bg-gray-400/90";
    default:
      return "bg-gray-400/90";
  }
};

const DAY_WIDTH = 32;
const ROW_HEIGHT = 44;

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
      width: Math.max(durationDays * DAY_WIDTH - 2, 16),
    };
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) =>
      direction === "prev" ? subMonths(prev, 1) : addMonths(prev, 1),
    );
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Compact Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium text-xs">
              {t("calendar.timelineView")}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => navigateMonth("prev")}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-[10px]"
              onClick={goToToday}
            >
              {t("calendar.today")}
            </Button>
            <span className="font-medium text-xs min-w-[80px] text-center">
              {format(currentMonth, "MMM yyyy")}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => navigateMonth("next")}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <ScrollArea className="w-full" ref={scrollRef}>
          <div
            className="relative"
            style={{ minWidth: daysInMonth.length * DAY_WIDTH + 140 }}
          >
            {/* Header - Days */}
            <div className="flex border-b border-border sticky top-0 bg-background z-10">
              <div className="w-[140px] shrink-0 px-2 py-1.5 font-medium text-xs text-muted-foreground border-r border-border">
                {t("calendar.device")}
              </div>
              <div className="flex">
                {daysInMonth.map((day, index) => {
                  const isToday = isSameDay(day, today);
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  return (
                    <div
                      key={index}
                      className={cn(
                        "flex flex-col items-center justify-center py-1",
                        isToday && "bg-primary/10",
                        isWeekend && !isToday && "bg-muted/50",
                      )}
                      style={{ width: DAY_WIDTH }}
                    >
                      <span
                        className={cn(
                          "text-[9px] uppercase leading-none",
                          isToday
                            ? "text-primary font-medium"
                            : "text-muted-foreground",
                        )}
                      >
                        {format(day, "EEE").charAt(0)}
                      </span>
                      <span
                        className={cn(
                          "text-[11px] leading-none mt-0.5",
                          isToday && "text-primary font-semibold",
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
            {filteredDevices.map((device) => {
              const deviceBookings = getDeviceBookings(device.id);

              return (
                <div
                  key={device.id}
                  className="flex border-b border-border/50 hover:bg-accent/20 transition-colors"
                >
                  <div className="w-[140px] shrink-0 px-2 py-1.5 border-r border-border">
                    <div className="font-medium text-[11px] truncate leading-tight">
                      {device.name}
                    </div>
                    <div className="text-[9px] text-muted-foreground leading-tight">
                      {device.assetTag}
                    </div>
                  </div>
                  <div
                    className="relative flex-1"
                    style={{ height: ROW_HEIGHT }}
                  >
                    {/* Weekend backgrounds */}
                    {daysInMonth.map((day, index) => {
                      const isWeekend =
                        day.getDay() === 0 || day.getDay() === 6;
                      const isToday = isSameDay(day, today);
                      if (!isWeekend && !isToday) return null;
                      return (
                        <div
                          key={index}
                          className={cn(
                            "absolute top-0 bottom-0",
                            isToday ? "bg-primary/5" : "bg-muted/30",
                          )}
                          style={{ left: index * DAY_WIDTH, width: DAY_WIDTH }}
                        />
                      );
                    })}

                    {/* Today line */}
                    {daysInMonth.some((d) => isSameDay(d, today)) && (
                      <div
                        className="absolute top-0 bottom-0 w-px bg-primary z-10"
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

                      return (
                        <Popover key={booking.id}>
                          <PopoverTrigger asChild>
                            <div
                              className={cn(
                                "absolute top-1.5 rounded cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md flex items-center px-1 overflow-hidden",
                                getStatusColor(booking.status),
                              )}
                              style={{ left, width, height: ROW_HEIGHT - 12 }}
                            >
                              <span className="text-[9px] text-white font-medium truncate">
                                {user?.name?.split(" ")[0]}
                              </span>
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
              <div className="p-8 text-center text-muted-foreground text-sm">
                {t("calendar.noDevicesSelected")}
              </div>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Compact Legend */}
        <div className="flex items-center gap-3 px-3 py-1.5 border-t border-border bg-muted/30 text-[10px]">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-sm bg-yellow-500" />
            <span className="text-muted-foreground">
              {t("requests.pending")}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-sm bg-blue-500" />
            <span className="text-muted-foreground">
              {t("requests.approved")}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-sm bg-orange-500" />
            <span className="text-muted-foreground">
              {t("requests.active")}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-sm bg-green-500" />
            <span className="text-muted-foreground">
              {t("requests.returned")}
            </span>
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <div className="w-px h-2.5 bg-primary" />
            <span className="text-muted-foreground">{t("calendar.today")}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
