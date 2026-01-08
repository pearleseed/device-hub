import React, { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeviceCalendarView } from "@/components/calendar/DeviceCalendarView";
import { DeviceTimelineView } from "@/components/calendar/DeviceTimelineView";
import { AvailabilitySummary } from "@/components/calendar/AvailabilitySummary";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { borrowingAPI } from "@/lib/api";
import type { DeviceCategory, BookingRequest } from "@/lib/types";
import { Loader2, CalendarDays, GanttChart, Filter } from "lucide-react";

const AdminCalendar: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<
    DeviceCategory | "all"
  >("all");
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const requestsRes = await borrowingAPI.getAll();

        if (requestsRes.success && requestsRes.data) {
          // Convert to BookingRequest format
          const bookingRequests: BookingRequest[] = requestsRes.data.map(
            (r) => ({
              id: String(r.id),
              deviceId: String(r.equipment_id),
              userId: String(r.user_id),
              startDate: r.start_date,
              endDate: r.end_date,
              reason: r.reason,
              status: r.status,
              createdAt: r.created_at,
            }),
          );
          setBookings(bookingRequests);
        }
      } catch (error) {
        console.error("Error fetching calendar data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Selected categories for timeline filtering
  const selectedCategories =
    selectedCategory === "all" ? [] : [selectedCategory];

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <main className="flex-1 p-6 lg:p-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span>Loading calendar...</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main
        id="main-content"
        className="flex-1 p-6 lg:p-8 overflow-x-hidden"
        tabIndex={-1}
      >
        <BreadcrumbNav />

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-primary" />
              Device Calendar
            </h1>
            <p className="text-muted-foreground mt-1">
              View and manage device availability and bookings
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={selectedCategory}
              onValueChange={(v) =>
                setSelectedCategory(v as DeviceCategory | "all")
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="laptop">💻 Laptops</SelectItem>
                <SelectItem value="mobile">📱 Mobile</SelectItem>
                <SelectItem value="tablet">📲 Tablets</SelectItem>
                <SelectItem value="monitor">🖥️ Monitors</SelectItem>
                <SelectItem value="accessories">🎧 Accessories</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Availability Summary - Self-fetching component */}
        <div className="mb-6">
          <AvailabilitySummary />
        </div>

        {/* Tabs for Calendar/Timeline views */}
        <Tabs defaultValue="calendar" className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Calendar View
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <GanttChart className="h-4 w-4" />
              Timeline View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="mt-4">
            <DeviceCalendarView
              bookings={bookings}
              selectedDevices={[]}
            />
          </TabsContent>

          <TabsContent value="timeline" className="mt-4">
            <DeviceTimelineView
              bookings={bookings}
              selectedDevices={[]}
              selectedCategories={selectedCategories}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminCalendar;
