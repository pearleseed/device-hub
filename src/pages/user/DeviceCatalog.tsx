import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { UserNavbar } from "@/components/layout/UserNavbar";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { DeviceCard } from "@/components/devices/DeviceCard";
import { DeviceDetailModal } from "@/components/devices/DeviceDetailModal";
import { DeviceComparisonModal } from "@/components/devices/DeviceComparisonModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { SkeletonDeviceCard } from "@/components/ui/skeleton-card";
import { EmptyState } from "@/components/ui/empty-state";
import { equipmentAPI } from "@/lib/api";
import type { Equipment, DeviceCategory, DeviceStatus } from "@/lib/types";
import { getCategoryIcon } from "@/lib/types";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import { useFavorites } from "@/hooks/use-favorites";
import {
  Search,
  LayoutGrid,
  List,
  Scale,
  X,
  SlidersHorizontal,
  Heart,
  Loader2,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// Legacy Device type for components that still use the old format
interface Device {
  id: string;
  name: string;
  category: DeviceCategory;
  brand: string;
  model: string;
  assetTag: string;
  status: DeviceStatus;
  assignedTo: string | null;
  specs: Record<string, string | undefined>;
  image: string;
  addedDate: string;
}

const DeviceCatalog: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    DeviceCategory | "all"
  >("all");
  const [selectedStatus, setSelectedStatus] = useState<DeviceStatus | "all">(
    "all",
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [compareDevices, setCompareDevices] = useState<Device[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [equipment, setEquipment] = useState<Equipment[]>([]);

  const { addToRecentlyViewed } = useRecentlyViewed();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  // Fetch equipment data
  useEffect(() => {
    const fetchEquipment = async () => {
      setIsLoading(true);
      try {
        const response = await equipmentAPI.getAll();
        if (response.success && response.data) {
          setEquipment(response.data);
        }
      } catch (error) {
        console.error("Error fetching equipment:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEquipment();
  }, []);

  // Convert Equipment to Device format for components
  const devices: Device[] = useMemo(() => {
    return equipment.map((eq) => ({
      id: String(eq.id),
      name: eq.name,
      category: eq.category,
      brand: eq.brand,
      model: eq.model,
      assetTag: eq.asset_tag,
      status: eq.status,
      assignedTo: eq.assigned_to_id ? String(eq.assigned_to_id) : null,
      specs: eq.specs as Record<string, string | undefined>,
      image: eq.image_url,
      addedDate: eq.created_at,
    }));
  }, [equipment]);

  // Handle URL parameter for device detail
  useEffect(() => {
    const deviceId = searchParams.get("device");
    if (deviceId) {
      const device = devices.find((d) => d.id === deviceId);
      if (device) {
        setSelectedDevice(device);
        addToRecentlyViewed(deviceId);
      }
    }
  }, [searchParams, devices, addToRecentlyViewed]);

  const categories: { value: DeviceCategory | "all"; label: string }[] = [
    { value: "all", label: "All Categories" },
    { value: "laptop", label: "💻 Laptops" },
    { value: "mobile", label: "📱 Mobile" },
    { value: "tablet", label: "📲 Tablets" },
    { value: "monitor", label: "🖥️ Monitors" },
    { value: "accessories", label: "🎧 Accessories" },
  ];

  const statuses: { value: DeviceStatus | "all"; label: string }[] = [
    { value: "all", label: "All Statuses" },
    { value: "available", label: "Available" },
    { value: "borrowed", label: "Borrowed" },
    { value: "maintenance", label: "Maintenance" },
  ];

  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      const matchesSearch =
        device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.assetTag.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || device.category === selectedCategory;
      const matchesStatus =
        selectedStatus === "all" || device.status === selectedStatus;
      const matchesFavorites = !showFavoritesOnly || isFavorite(device.id);
      return (
        matchesSearch && matchesCategory && matchesStatus && matchesFavorites
      );
    });
  }, [
    devices,
    searchQuery,
    selectedCategory,
    selectedStatus,
    showFavoritesOnly,
    isFavorite,
  ]);

  const activeFiltersCount = [
    selectedCategory !== "all",
    selectedStatus !== "all",
    showFavoritesOnly,
  ].filter(Boolean).length;

  const handleDeviceClick = (device: Device) => {
    setSearchParams({ device: device.id });
    setSelectedDevice(device);
    addToRecentlyViewed(device.id);
  };

  const handleCloseDetail = () => {
    setSearchParams({});
    setSelectedDevice(null);
  };

  const toggleCompare = (device: Device, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompareDevices((prev) => {
      const isSelected = prev.some((d) => d.id === device.id);
      if (isSelected) {
        return prev.filter((d) => d.id !== device.id);
      } else if (prev.length < 3) {
        return [...prev, device];
      }
      return prev;
    });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedStatus("all");
    setShowFavoritesOnly(false);
  };

  const FilterContent = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Category</Label>
        <Select
          value={selectedCategory}
          onValueChange={(v) =>
            setSelectedCategory(v as DeviceCategory | "all")
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          value={selectedStatus}
          onValueChange={(v) => setSelectedStatus(v as DeviceStatus | "all")}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div className="flex items-center space-x-2">
        <Checkbox
          id="favorites-filter"
          checked={showFavoritesOnly}
          onCheckedChange={(checked) =>
            setShowFavoritesOnly(checked as boolean)
          }
        />
        <Label
          htmlFor="favorites-filter"
          className="text-sm font-normal cursor-pointer flex items-center gap-2"
        >
          <Heart className="h-4 w-4" />
          Show favorites only
        </Label>
      </div>

      {activeFiltersCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearFilters}
          className="w-full"
        >
          Clear all filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <UserNavbar />

      <main
        id="main-content"
        className="container px-4 md:px-6 py-8"
        tabIndex={-1}
      >
        <BreadcrumbNav />

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Device Catalog</h1>
          <p className="text-muted-foreground">
            Browse and request available devices for your work needs.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search devices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Desktop Filters */}
          <div className="hidden lg:flex gap-2">
            <Select
              value={selectedCategory}
              onValueChange={(v) =>
                setSelectedCategory(v as DeviceCategory | "all")
              }
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedStatus}
              onValueChange={(v) =>
                setSelectedStatus(v as DeviceStatus | "all")
              }
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant={showFavoritesOnly ? "default" : "outline"}
              size="icon"
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              title="Show favorites only"
            >
              <Heart
                className={`h-4 w-4 ${showFavoritesOnly ? "fill-current" : ""}`}
              />
            </Button>

            <Separator orientation="vertical" className="h-10" />

            <div className="flex gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Mobile Filter Button */}
          <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="lg:hidden flex items-center gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>
                  Filter devices by category, status, and more.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <FilterContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedCategory !== "all" && (
              <Badge variant="secondary" className="gap-1">
                {getCategoryIcon(selectedCategory)} {selectedCategory}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setSelectedCategory("all")}
                />
              </Badge>
            )}
            {selectedStatus !== "all" && (
              <Badge variant="secondary" className="gap-1">
                {selectedStatus}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setSelectedStatus("all")}
                />
              </Badge>
            )}
            {showFavoritesOnly && (
              <Badge variant="secondary" className="gap-1">
                <Heart className="h-3 w-3" /> Favorites
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setShowFavoritesOnly(false)}
                />
              </Badge>
            )}
          </div>
        )}

        {/* Compare Bar */}
        {compareDevices.length > 0 && (
          <div className="sticky top-20 z-40 mb-6 p-4 bg-primary text-primary-foreground rounded-lg flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-4">
              <Scale className="h-5 w-5" />
              <span className="font-medium">
                {compareDevices.length} device(s) selected for comparison
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCompareDevices([])}
              >
                Clear
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowComparison(true)}
                disabled={compareDevices.length < 2}
              >
                Compare
              </Button>
            </div>
          </div>
        )}

        {/* Results Count */}
        <p className="text-sm text-muted-foreground mb-4">
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading devices...
            </span>
          ) : (
            `Showing ${filteredDevices.length} of ${devices.length} devices`
          )}
        </p>

        {/* Device Grid/List */}
        {isLoading ? (
          <div
            className={`grid gap-6 ${viewMode === "grid" ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}
          >
            {[...Array(8)].map((_, i) => (
              <SkeletonDeviceCard key={i} />
            ))}
          </div>
        ) : filteredDevices.length > 0 ? (
          <div
            className={`grid gap-6 ${viewMode === "grid" ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}
          >
            {filteredDevices.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                viewMode={viewMode}
                onClick={() => handleDeviceClick(device)}
                onCompare={(e) => toggleCompare(device, e)}
                isComparing={compareDevices.some((d) => d.id === device.id)}
                isFavorite={isFavorite(device.id)}
                onToggleFavorite={() => toggleFavorite(device.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            type="no-results"
            actionLabel="Clear filters"
            onAction={clearFilters}
          />
        )}
      </main>

      {/* Device Detail Modal */}
      <DeviceDetailModal
        device={selectedDevice}
        open={!!selectedDevice}
        onClose={handleCloseDetail}
      />

      {/* Comparison Modal */}
      <DeviceComparisonModal
        devices={compareDevices}
        open={showComparison}
        onClose={() => setShowComparison(false)}
      />
    </div>
  );
};

export default DeviceCatalog;
