import React, { useState, useMemo, useCallback } from "react";
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
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Calendar, LayoutList, Filter, X, Search, Laptop, Smartphone, Tablet, Monitor, Headphones } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { DeviceCategory } from "@/types/api";
import { useDevices, useBorrowRequests } from "@/hooks/use-api-queries";
import { useUpdateBorrowStatus } from "@/hooks/use-api-mutations";
import { DeviceCalendarView } from "@/components/calendar/DeviceCalendarView";
import { DeviceTimelineView } from "@/components/calendar/DeviceTimelineView";
import { AvailabilitySummary } from "@/components/calendar/AvailabilitySummary";
import { useToast } from "@/hooks/use-toast";

const categories: { value: DeviceCategory; labelKey: string; icon: React.ElementType }[] = [
  { value: "laptop", labelKey: "category.laptop", icon: Laptop },
  { value: "mobile", labelKey: "category.mobile", icon: Smartphone },
  { value: "tablet", labelKey: "category.tablet", icon: Tablet },
  { value: "monitor", labelKey: "category.monitor", icon: Monitor },
  { value: "accessories", labelKey: "category.accessories", icon: Headphones },
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
  const [deviceSearch, setDeviceSearch] = useState("");

  // Use API queries directly
  const { data: devices = [] } = useDevices();
  const { data: bookingRequests = [] } = useBorrowRequests();
  
  // Use mutation hook for updating borrow status
  const updateBorrowStatus = useUpdateBorrowStatus();

  // Filter devices by selected categories
  const filteredDevices = useMemo(
    () =>
      selectedCategories.length > 0
        ? devices.filter((d) => selectedCategories.includes(d.category))
        : devices,
    [devices, selectedCategories],
  );

  // Filter devices by search term
  const searchFilteredDevices = useMemo(
    () =>
      deviceSearch.trim()
        ? filteredDevices.filter((d) =>
            d.name.toLowerCase().includes(deviceSearch.toLowerCase())
          )
        : filteredDevices,
    [filteredDevices, deviceSearch],
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
    if (selectedDevices.length === searchFilteredDevices.length) {
      setSelectedDevices([]);
    } else {
      setSelectedDevices(searchFilteredDevices.map((d) => d.id));
    }
  };

  const handleClearFilters = () => {
    setSelectedCategories([]);
    setSelectedDevices([]);
    setDeviceSearch("");
  };

  const handleApprove = useCallback((id: number) => {
    updateBorrowStatus.mutate(
      { id, status: "approved" },
      {
        onSuccess: () => {
          toast({
            title: t("requests.approved"),
            description: t("calendar.requestApprovedToast", { id: String(id) }),
            variant: "approved",
          });
        },
      }
    );
  }, [updateBorrowStatus, toast, t]);

  const handleReject = useCallback((id: number) => {
    updateBorrowStatus.mutate(
      { id, status: "rejected" },
      {
        onSuccess: () => {
          toast({
            title: t("requests.rejected"),
            description: t("calendar.requestRejectedToast", { id: String(id) }),
            variant: "rejected",
          });
        },
      }
    );
  }, [updateBorrowStatus, toast, t]);

  const activeFiltersCount = selectedCategories.length + selectedDevices.length;

  // Compute effective device IDs for filtering bookings
  // If specific devices are selected, use those
  // If only categories are selected, use all devices in those categories
  // If nothing is selected, show all (empty array means no filter)
  const effectiveDeviceIds = useMemo(() => {
    if (selectedDevices.length > 0) {
      // User selected specific devices
      return selectedDevices;
    }
    if (selectedCategories.length > 0) {
      // User selected categories but no specific devices - use all devices in those categories
      return filteredDevices.map((d) => d.id);
    }
    // No filter - return empty to show all
    return [];
  }, [selectedDevices, selectedCategories, filteredDevices]);

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
            {/* <p className="text-muted-foreground">{t("calendar.subtitle")}</p> */}
          </div>
          <div className="flex items-center gap-2 py-2">
            {/* Filter Popover */}
            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant={activeFiltersCount > 0 ? "default" : "outline"} 
                  size="sm" 
                  className="gap-2"
                >
                  <Filter className="h-4 w-4" />
                  {t("calendar.filters")}
                  {activeFiltersCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-5 px-1.5 text-xs bg-background/20"
                    >
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">
                      {t("calendar.filters")}
                    </span>
                    {activeFiltersCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto py-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                        onClick={handleClearFilters}
                      >
                        <X className="h-3 w-3 mr-1" />
                        {t("common.clearAll")}
                      </Button>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Categories - Chip style */}
                <div className="p-4 pb-3">
                  <Label className="text-xs font-medium text-muted-foreground mb-3 block">
                    {t("calendar.categories")}
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => {
                      const Icon = category.icon;
                      const isSelected = selectedCategories.includes(category.value);
                      return (
                        <button
                          key={category.value}
                          onClick={() => handleCategoryToggle(category.value)}
                          className={`
                            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                            transition-all duration-200 border
                            ${isSelected 
                              ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                              : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground"
                            }
                          `}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {t(category.labelKey)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                {/* Devices with search */}
                <div className="p-4 pt-3">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-xs font-medium text-muted-foreground">
                      {t("calendar.devices")} 
                      {selectedDevices.length > 0 && (
                        <span className="ml-1 text-primary">({selectedDevices.length})</span>
                      )}
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto py-0.5 px-2 text-[10px] text-muted-foreground hover:text-foreground"
                      onClick={handleSelectAllDevices}
                    >
                      {selectedDevices.length === searchFilteredDevices.length && searchFilteredDevices.length > 0
                        ? t("common.deselectAll")
                        : t("common.selectAll")}
                    </Button>
                  </div>
                  
                  {/* Search input */}
                  <div className="relative mb-3">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder={t("calendar.searchDevices")}
                      value={deviceSearch}
                      onChange={(e) => setDeviceSearch(e.target.value)}
                      className="h-8 pl-8 text-xs"
                    />
                    {deviceSearch && (
                      <button
                        onClick={() => setDeviceSearch("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <ScrollArea className="h-[160px]">
                    <div className="space-y-1 pr-3">
                      {searchFilteredDevices.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          {t("calendar.noDevicesFound")}
                        </p>
                      ) : (
                        searchFilteredDevices.map((device) => (
                          <div
                            key={device.id}
                            className={`
                              flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors
                              ${selectedDevices.includes(device.id) 
                                ? "bg-primary/10" 
                                : "hover:bg-muted/50"
                              }
                            `}
                            onClick={() => handleDeviceToggle(device.id)}
                          >
                            <Checkbox
                              id={`device-${device.id}`}
                              checked={selectedDevices.includes(device.id)}
                              onCheckedChange={() => handleDeviceToggle(device.id)}
                              className="pointer-events-none"
                            />
                            <Label
                              htmlFor={`device-${device.id}`}
                              className="text-xs cursor-pointer truncate flex-1"
                            >
                              {device.name}
                            </Label>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {t(`category.${device.category}`)}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Apply button */}
                <Separator />
                <div className="p-3">
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => setFilterOpen(false)}
                  >
                    {t("common.apply")}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Active Filter Tags */}
            {activeFiltersCount > 0 && (
              <div className="hidden sm:flex items-center gap-1.5">
                {selectedCategories.slice(0, 2).map((cat) => {
                  const category = categories.find((c) => c.value === cat);
                  const Icon = category?.icon || Filter;
                  return (
                    <Badge
                      key={cat}
                      variant="secondary"
                      className="text-xs gap-1 pl-2 pr-1 py-1"
                    >
                      <Icon className="h-3 w-3" />
                      {t(category?.labelKey || "category.all")}
                      <button
                        className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                        onClick={() => handleCategoryToggle(cat)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
                {selectedCategories.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{selectedCategories.length - 2}
                  </Badge>
                )}
                {selectedDevices.length > 0 && selectedCategories.length < 2 && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedDevices.length} {t("calendar.devicesSelected")}
                  </Badge>
                )}
              </div>
            )}

            <div className="h-6 w-px bg-border mx-1" />

            {/* View Toggle */}
            <div className="flex items-center bg-muted rounded-md p-1">
              <Button
                variant={activeView === "calendar" ? "default" : "ghost"}
                size="sm"
                className="h-8 px-6 gap-2"
                onClick={() => setActiveView("calendar")}
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline text-sm font-medium">
                  {t("calendar.calendarView")}
                </span>
              </Button>
              <Button
                variant={activeView === "timeline" ? "default" : "ghost"}
                size="sm"
                className="h-8 px-6 gap-2"
                onClick={() => setActiveView("timeline")}
              >
                <LayoutList className="h-4 w-4" />
                <span className="hidden sm:inline text-sm font-medium">
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
              selectedDevices={effectiveDeviceIds.map(String)}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ) : (
            <DeviceTimelineView
              bookings={bookingRequests}
              selectedDevices={effectiveDeviceIds.map(String)}
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
