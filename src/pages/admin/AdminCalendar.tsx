import React, { useState, useMemo } from "react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, LayoutList, Filter, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { DeviceCategory } from "@/types/api";
import { useDevices, useBorrowRequests } from "@/hooks/use-api-queries";
import { DeviceCalendarView } from "@/components/calendar/DeviceCalendarView";
import { DeviceTimelineView } from "@/components/calendar/DeviceTimelineView";
import { AvailabilitySummary } from "@/components/calendar/AvailabilitySummary";
import { useToast } from "@/hooks/use-toast";

const categories: { value: DeviceCategory; labelKey: string }[] = [
  { value: "laptop", labelKey: "category.laptop" },
  { value: "mobile", labelKey: "category.mobile" },
  { value: "tablet", labelKey: "category.tablet" },
  { value: "monitor", labelKey: "category.monitor" },
  { value: "accessories", labelKey: "category.accessories" },
];

const AdminCalendar: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [activeView, setActiveView] = useState<"calendar" | "timeline">(
    "calendar",
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<number[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);

  // Use API queries directly
  const { data: devices = [], isLoading: devicesLoading } = useDevices();
  const { data: bookingRequests = [], isLoading: requestsLoading } =
    useBorrowRequests();

  // Filter devices by selected categories
  const filteredDevices = useMemo(
    () =>
      selectedCategories.length > 0
        ? devices.filter((d) => selectedCategories.includes(d.category))
        : devices,
    [devices, selectedCategories],
  );

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
    // Reset device selection when category changes
    setSelectedDevices([]);
  };

  const handleDeviceToggle = (deviceId: number) => {
    setSelectedDevices((prev) =>
      prev.includes(deviceId)
        ? prev.filter((d) => d !== deviceId)
        : [...prev, deviceId],
    );
  };

  const handleSelectAllDevices = () => {
    if (selectedDevices.length === filteredDevices.length) {
      setSelectedDevices([]);
    } else {
      setSelectedDevices(filteredDevices.map((d) => d.id));
    }
  };

  const handleClearFilters = () => {
    setSelectedCategories([]);
    setSelectedDevices([]);
  };

  const handleApprove = (id: number) => {
    toast({
      title: t("requests.approved"),
      description: `Request ${id} has been approved.`,
    });
  };

  const handleReject = (id: number) => {
    toast({
      title: t("requests.rejected"),
      description: `Request ${id} has been rejected.`,
      variant: "destructive",
    });
  };

  const activeFiltersCount = selectedCategories.length + selectedDevices.length;

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main
        id="main-content"
        className="flex-1 p-8"
        tabIndex={-1}
        role="main"
        aria-label="Calendar management"
      >
        <BreadcrumbNav />

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">{t("calendar.title")}</h1>
            <p className="text-muted-foreground">{t("calendar.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Filter Popover */}
            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  {t("calendar.filters")}
                  {activeFiltersCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-5 px-1.5 text-xs"
                    >
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">
                      {t("calendar.filters")}
                    </span>
                    {activeFiltersCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto py-1 px-2 text-xs"
                        onClick={handleClearFilters}
                      >
                        {t("common.clearAll")}
                      </Button>
                    )}
                  </div>

                  {/* Categories */}
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                      {t("calendar.categories")}
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {categories.map((category) => (
                        <div
                          key={category.value}
                          className="flex items-center gap-2"
                        >
                          <Checkbox
                            id={`cat-${category.value}`}
                            checked={selectedCategories.includes(
                              category.value,
                            )}
                            onCheckedChange={() =>
                              handleCategoryToggle(category.value)
                            }
                          />
                          <Label
                            htmlFor={`cat-${category.value}`}
                            className="text-xs cursor-pointer"
                          >
                            {t(category.labelKey)}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Devices */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs font-medium text-muted-foreground">
                        {t("calendar.devices")}
                      </Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto py-0.5 px-1.5 text-[10px]"
                        onClick={handleSelectAllDevices}
                      >
                        {selectedDevices.length === filteredDevices.length
                          ? t("common.deselectAll")
                          : t("common.selectAll")}
                      </Button>
                    </div>
                    <ScrollArea className="h-[180px]">
                      <div className="space-y-1.5 pr-2">
                        {filteredDevices.map((device) => (
                          <div
                            key={device.id}
                            className="flex items-center gap-2"
                          >
                            <Checkbox
                              id={`device-${device.id}`}
                              checked={selectedDevices.includes(device.id)}
                              onCheckedChange={() =>
                                handleDeviceToggle(device.id)
                              }
                            />
                            <Label
                              htmlFor={`device-${device.id}`}
                              className="text-xs cursor-pointer truncate"
                            >
                              {device.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Active Filter Tags */}
            {activeFiltersCount > 0 && (
              <div className="hidden sm:flex items-center gap-1">
                {selectedCategories.slice(0, 2).map((cat) => (
                  <Badge
                    key={cat}
                    variant="secondary"
                    className="text-xs gap-1"
                  >
                    {t(
                      categories.find((c) => c.value === cat)?.labelKey ||
                        "category.all",
                    )}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleCategoryToggle(cat)}
                    />
                  </Badge>
                ))}
                {selectedCategories.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{selectedCategories.length - 2}
                  </Badge>
                )}
              </div>
            )}

            <div className="h-6 w-px bg-border mx-1" />

            {/* View Toggle */}
            <div className="flex items-center bg-muted rounded-md p-0.5">
              <Button
                variant={activeView === "calendar" ? "default" : "ghost"}
                size="sm"
                className="h-7 px-2.5 gap-1.5"
                onClick={() => setActiveView("calendar")}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-xs">
                  {t("calendar.calendarView")}
                </span>
              </Button>
              <Button
                variant={activeView === "timeline" ? "default" : "ghost"}
                size="sm"
                className="h-7 px-2.5 gap-1.5"
                onClick={() => setActiveView("timeline")}
              >
                <LayoutList className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-xs">
                  {t("calendar.timelineView")}
                </span>
              </Button>
            </div>
          </div>
        </div>

        {/* Availability Summary */}
        <AvailabilitySummary />

        {/* Main Content */}
        <div className="mt-6">
          {activeView === "calendar" ? (
            <DeviceCalendarView
              bookings={bookingRequests}
              selectedDevices={selectedDevices.map(String)}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ) : (
            <DeviceTimelineView
              bookings={bookingRequests}
              selectedDevices={selectedDevices.map(String)}
              selectedCategories={selectedCategories}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminCalendar;
