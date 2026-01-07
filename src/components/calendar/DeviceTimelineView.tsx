import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
} from 'date-fns';
import { BookingRequest, Device, devices, getDeviceById, getUserById } from '@/lib/mockData';
import { useLanguage } from '@/contexts/LanguageContext';
import { BookingDetailsPopover } from './BookingDetailsPopover';
import { cn } from '@/lib/utils';

interface DeviceTimelineViewProps {
  bookings: BookingRequest[];
  selectedDevices: string[];
  selectedCategories: string[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-500';
    case 'approved':
      return 'bg-blue-500';
    case 'active':
      return 'bg-orange-500';
    case 'returned':
      return 'bg-green-500';
    case 'rejected':
      return 'bg-gray-400';
    default:
      return 'bg-gray-400';
  }
};

const DAY_WIDTH = 40;

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
  const filteredDevices = devices.filter(device => {
    if (selectedDevices.length > 0 && !selectedDevices.includes(device.id)) return false;
    if (selectedCategories.length > 0 && !selectedCategories.includes(device.category)) return false;
    return true;
  });

  // Get days of current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const today = startOfDay(new Date());

  // Get bookings for a device
  const getDeviceBookings = (deviceId: string) => {
    return bookings.filter(b => {
      if (b.deviceId !== deviceId) return false;
      if (b.status === 'rejected') return false;
      
      const start = parseISO(b.startDate);
      const end = parseISO(b.endDate);
      
      // Check if booking overlaps with current month
      return isWithinInterval(monthStart, { start, end }) ||
             isWithinInterval(monthEnd, { start, end }) ||
             (start >= monthStart && start <= monthEnd) ||
             (end >= monthStart && end <= monthEnd);
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
      width: Math.max(durationDays * DAY_WIDTH - 4, 20), // Minimum width
    };
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>{t('calendar.timelineView')}</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            {t('calendar.today')}
          </Button>
          <span className="font-medium min-w-[140px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full" ref={scrollRef}>
          <div className="relative" style={{ minWidth: daysInMonth.length * DAY_WIDTH + 200 }}>
            {/* Header - Days */}
            <div className="flex border-b border-border sticky top-0 bg-background z-10">
              <div className="w-[200px] flex-shrink-0 p-2 font-medium border-r border-border">
                {t('calendar.device')}
              </div>
              <div className="flex">
                {daysInMonth.map((day, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex flex-col items-center justify-center p-1 border-r border-border",
                      isSameDay(day, today) && "bg-primary/10"
                    )}
                    style={{ width: DAY_WIDTH }}
                  >
                    <span className="text-xs text-muted-foreground">
                      {format(day, 'EEE')}
                    </span>
                    <span className={cn(
                      "text-sm font-medium",
                      isSameDay(day, today) && "text-primary"
                    )}>
                      {format(day, 'd')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rows - Devices */}
            {filteredDevices.map(device => {
              const deviceBookings = getDeviceBookings(device.id);
              
              return (
                <div key={device.id} className="flex border-b border-border hover:bg-accent/30">
                  <div className="w-[200px] flex-shrink-0 p-2 border-r border-border">
                    <div className="font-medium text-sm truncate">{device.name}</div>
                    <div className="text-xs text-muted-foreground">{device.assetTag}</div>
                  </div>
                  <div className="relative flex-1 h-16">
                    {/* Today line */}
                    {daysInMonth.some(d => isSameDay(d, today)) && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-primary z-5"
                        style={{ left: differenceInDays(today, monthStart) * DAY_WIDTH + DAY_WIDTH / 2 }}
                      />
                    )}
                    
                    {/* Booking bars */}
                    {deviceBookings.map(booking => {
                      const { left, width } = getBarStyles(booking);
                      const user = getUserById(booking.userId);
                      
                      return (
                        <Popover key={booking.id}>
                          <PopoverTrigger asChild>
                            <div
                              className={cn(
                                "absolute top-3 h-10 rounded-md cursor-pointer transition-opacity hover:opacity-80 flex items-center px-2",
                                getStatusColor(booking.status)
                              )}
                              style={{ left, width }}
                            >
                              <span className="text-xs text-white font-medium truncate">
                                {user?.name}
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
              <div className="p-8 text-center text-muted-foreground">
                {t('calendar.noDevicesSelected')}
              </div>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-sm">{t('requests.pending')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-sm">{t('requests.approved')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-sm">{t('requests.active')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm">{t('requests.returned')}</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <div className="w-0.5 h-4 bg-primary" />
            <span className="text-sm">{t('calendar.today')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
