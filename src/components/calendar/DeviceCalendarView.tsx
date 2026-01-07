import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, parseISO, isWithinInterval, isSameDay, startOfDay } from 'date-fns';
import { CalendarDays, List } from 'lucide-react';
import { BookingRequest, getDeviceById, getUserById } from '@/lib/mockData';
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
      <div className="flex gap-0.5 justify-center mt-0.5">
        {statusCounts.pending > 0 && (
          <div className="w-1 h-1 rounded-full bg-yellow-500" />
        )}
        {statusCounts.approved > 0 && (
          <div className="w-1 h-1 rounded-full bg-blue-500" />
        )}
        {statusCounts.active > 0 && (
          <div className="w-1 h-1 rounded-full bg-orange-500" />
        )}
        {statusCounts.returned > 0 && (
          <div className="w-1 h-1 rounded-full bg-green-500" />
        )}
      </div>
    );
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row">
          {/* Calendar Section */}
          <div className="flex-1 p-4 border-b lg:border-b-0 lg:border-r border-border">
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t('calendar.monthlyView')}</span>
            </div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border w-full"
              classNames={{
                months: "w-full",
                month: "w-full",
                table: "w-full",
                head_row: "flex w-full",
                head_cell: "flex-1 text-muted-foreground font-normal text-xs",
                row: "flex w-full",
                cell: "flex-1 text-center p-0 relative",
                day: cn(
                  "h-8 w-full p-0 font-normal text-sm hover:bg-accent rounded-md transition-colors",
                  "aria-selected:bg-primary aria-selected:text-primary-foreground"
                ),
                day_selected: "bg-primary text-primary-foreground hover:bg-primary",
                day_today: "bg-accent font-semibold",
              }}
              components={{
                DayContent: ({ date }) => (
                  <div className="flex flex-col items-center py-1">
                    <span>{format(date, 'd')}</span>
                    {getDayContent(date)}
                  </div>
                ),
              }}
            />
            
            {/* Compact Legend */}
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="text-muted-foreground">{t('requests.pending')}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-muted-foreground">{t('requests.approved')}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-muted-foreground">{t('requests.active')}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-muted-foreground">{t('requests.returned')}</span>
              </div>
            </div>
          </div>

          {/* Bookings Panel */}
          <div className="w-full lg:w-80 p-4">
            <div className="flex items-center gap-2 mb-3">
              <List className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {selectedDate ? format(selectedDate, 'MMM d, yyyy') : t('calendar.selectDate')}
              </span>
              {bookingsForSelectedDate.length > 0 && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  {bookingsForSelectedDate.length}
                </Badge>
              )}
            </div>
            
            {bookingsForSelectedDate.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CalendarDays className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">{t('calendar.noBookingsForDate')}</p>
              </div>
            ) : (
              <ScrollArea className="h-[320px]">
                <div className="space-y-2 pr-2">
                  {bookingsForSelectedDate.map(booking => {
                    const device = getDeviceById(booking.deviceId);
                    const user = getUserById(booking.userId);
                    
                    return (
                      <Popover key={booking.id}>
                        <PopoverTrigger asChild>
                          <div className={cn(
                            "p-2.5 rounded-lg border-l-2 bg-accent/30 hover:bg-accent cursor-pointer transition-colors",
                            booking.status === 'pending' && "border-l-yellow-500",
                            booking.status === 'approved' && "border-l-blue-500",
                            booking.status === 'active' && "border-l-orange-500",
                            booking.status === 'returned' && "border-l-green-500",
                            booking.status === 'rejected' && "border-l-gray-400"
                          )}>
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="font-medium text-sm truncate">{device?.name}</span>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                                {t(`requests.${booking.status}`)}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{user?.name}</p>
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-auto" align="end">
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
