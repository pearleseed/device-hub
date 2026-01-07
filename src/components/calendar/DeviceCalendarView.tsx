import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, parseISO, isWithinInterval, isSameDay, startOfDay } from 'date-fns';
import { BookingRequest, Device, getDeviceById, getUserById } from '@/lib/mockData';
import { useLanguage } from '@/contexts/LanguageContext';
import { BookingDetailsPopover } from './BookingDetailsPopover';
import { cn } from '@/lib/utils';

interface DeviceCalendarViewProps {
  bookings: BookingRequest[];
  selectedDevices: string[];
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

export const DeviceCalendarView: React.FC<DeviceCalendarViewProps> = ({
  bookings,
  selectedDevices,
  onApprove,
  onReject,
}) => {
  const { t } = useLanguage();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedBooking, setSelectedBooking] = useState<BookingRequest | null>(null);

  // Filter bookings by selected devices
  const filteredBookings = selectedDevices.length > 0
    ? bookings.filter(b => selectedDevices.includes(b.deviceId))
    : bookings;

  // Get bookings for a specific date
  const getBookingsForDate = (date: Date) => {
    return filteredBookings.filter(booking => {
      const start = startOfDay(parseISO(booking.startDate));
      const end = startOfDay(parseISO(booking.endDate));
      const checkDate = startOfDay(date);
      
      return isWithinInterval(checkDate, { start, end }) || 
             isSameDay(checkDate, start) || 
             isSameDay(checkDate, end);
    });
  };

  // Get bookings for selected date
  const bookingsForSelectedDate = selectedDate ? getBookingsForDate(selectedDate) : [];

  // Custom day content with booking indicators
  const getDayContent = (day: Date) => {
    const dayBookings = getBookingsForDate(day);
    if (dayBookings.length === 0) return null;

    const statusCounts = {
      pending: dayBookings.filter(b => b.status === 'pending').length,
      approved: dayBookings.filter(b => b.status === 'approved').length,
      active: dayBookings.filter(b => b.status === 'active').length,
      returned: dayBookings.filter(b => b.status === 'returned').length,
    };

    return (
      <div className="flex gap-0.5 justify-center mt-1">
        {statusCounts.pending > 0 && (
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
        )}
        {statusCounts.approved > 0 && (
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        )}
        {statusCounts.active > 0 && (
          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
        )}
        {statusCounts.returned > 0 && (
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>{t('calendar.monthlyView')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border pointer-events-auto"
            components={{
              DayContent: ({ date }) => (
                <div className="flex flex-col items-center">
                  <span>{format(date, 'd')}</span>
                  {getDayContent(date)}
                </div>
              ),
            }}
          />
          
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
          </div>
        </CardContent>
      </Card>

      {/* Bookings for Selected Date */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {selectedDate
              ? format(selectedDate, 'MMMM d, yyyy')
              : t('calendar.selectDate')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bookingsForSelectedDate.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t('calendar.noBookingsForDate')}</p>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {bookingsForSelectedDate.map(booking => {
                  const device = getDeviceById(booking.deviceId);
                  const user = getUserById(booking.userId);
                  
                  return (
                    <Popover key={booking.id}>
                      <PopoverTrigger asChild>
                        <div className="p-3 rounded-lg border border-border hover:bg-accent cursor-pointer transition-colors">
                          <div className="flex items-start justify-between mb-1">
                            <span className="font-medium text-sm">{device?.name}</span>
                            <Badge className={`${getStatusColor(booking.status)} text-white text-xs`}>
                              {t(`requests.${booking.status}`)}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{user?.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(parseISO(booking.startDate), 'MMM d')} - {format(parseISO(booking.endDate), 'MMM d')}
                          </p>
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
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
