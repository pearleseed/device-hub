import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { UserNavbar } from "@/components/layout/UserNavbar";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { DeviceCard } from "@/components/devices/DeviceCard";
import type {
  DeviceWithDepartment,
  DeviceCategory,
  DeviceStatus,
} from "@/types/api";
import { PRICE_RANGES, type PriceRange } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useDevices } from "@/hooks/use-api-queries";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, getDeviceThumbnailUrl } from "@/lib/utils";
import {
  Search,
  Laptop,
  Smartphone,
  Tablet,
  Monitor as MonitorIcon,
  Headphones,
  LayoutGrid,
  List,
  Grid3X3,
  X,
  Heart,
  ArrowUpDown,
  SortAsc,
  SortDesc,
  HardDrive,
  MemoryStick,
} from "lucide-react";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import { useFavorites } from "@/hooks/use-favorites";
import {
  usePagination,
  PaginationInfo,
  PaginationNav,
} from "@/components/ui/pagination-controls";
import { toast } from "sonner";
import { SkeletonCard, SkeletonListItem } from "@/components/ui/skeleton-card";
import { EmptyState } from "@/components/ui/empty-state";

// Helper function to parse specs_json safely
const parseSpecs = (
  specsJson: string | undefined | null,
): Record<string, string | undefined> => {
  if (!specsJson) return {};
  try {
    return JSON.parse(specsJson);
  } catch {
    return {};
  }
};

type SortOption =
  | "name-asc"
  | "name-desc"
  | "newest"
  | "availability"
  | "favorites";

const DeviceCatalog: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const categoryOptions = useMemo(
    () => [
      {
        value: "all",
        label: t("category.all"),
        icon: <LayoutGrid className="h-4 w-4" />,
      },
      {
        value: "laptop",
        label: t("category.laptop"),
        icon: <Laptop className="h-4 w-4" />,
      },
      {
        value: "mobile",
        label: t("category.mobile"),
        icon: <Smartphone className="h-4 w-4" />,
      },
      {
        value: "tablet",
        label: t("category.tablet"),
        icon: <Tablet className="h-4 w-4" />,
      },
      {
        value: "monitor",
        label: t("category.monitor"),
        icon: <MonitorIcon className="h-4 w-4" />,
      },
      {
        value: "storage",
        label: t("category.storage"),
        icon: <HardDrive className="h-4 w-4" />,
      },
      {
        value: "ram",
        label: t("category.ram"),
        icon: <MemoryStick className="h-4 w-4" />,
      },
      {
        value: "accessories",
        label: t("category.accessories"),
        icon: <Headphones className="h-4 w-4" />,
      },
    ],
    [t],
  );

  const statusOptions = useMemo(
    () => [
      { value: "all", label: t("status.all") },
      { value: "available", label: t("status.available") },
      { value: "borrowed", label: t("status.borrowed") },
      { value: "maintenance", label: t("status.maintenance") },
    ],
    [t],
  );

  const sortOptions = useMemo(
    () => [
      {
        value: "name-asc",
        label: t("sort.nameAsc"),
        icon: <SortAsc className="h-4 w-4" />,
      },
      {
        value: "name-desc",
        label: t("sort.nameDesc"),
        icon: <SortDesc className="h-4 w-4" />,
      },
      {
        value: "newest",
        label: t("sort.newest"),
        icon: <ArrowUpDown className="h-4 w-4" />,
      },
      {
        value: "availability",
        label: t("sort.availability"),
        icon: <ArrowUpDown className="h-4 w-4" />,
      },
      {
        value: "favorites",
        label: t("sort.favorites"),
        icon: <Heart className="h-4 w-4" />,
      },
    ],
    [t],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<DeviceCategory | "all">(
    "all",
  );
  const [statusFilter, setStatusFilter] = useState<DeviceStatus | "all">("all");
  const [priceFilter, setPriceFilter] = useState<PriceRange>("all");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Use cached devices data
  const { data: devices = [], isLoading } = useDevices();

  // Recently viewed tracking
  const { addToRecentlyViewed } = useRecentlyViewed();

  // Favorites
  const { favorites, toggleFavorite, isFavorite, favoritesCount } =
    useFavorites();

  const filteredAndSortedDevices = useMemo(() => {
    const result = devices.filter((device) => {
      const matchesSearch =
        device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.model.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        categoryFilter === "all" || device.category === categoryFilter;
      const matchesStatus =
        statusFilter === "all" || device.status === statusFilter;
      const matchesFavorites =
        !showFavoritesOnly || favorites.includes(String(device.id));

      // Price filtering - use selling_price if available, otherwise purchase_price
      let matchesPrice = true;
      const devicePrice = device.selling_price ?? device.purchase_price;

      // Check price range filter
      if (priceFilter !== "all") {
        const priceRange = PRICE_RANGES.find((r) => r.value === priceFilter);
        if (priceRange) {
          if (priceRange.min !== undefined && devicePrice < priceRange.min) {
            matchesPrice = false;
          }
          if (priceRange.max !== undefined && devicePrice >= priceRange.max) {
            matchesPrice = false;
          }
        }
      }

      // Check custom min/max price
      if (minPrice && devicePrice < parseFloat(minPrice)) {
        matchesPrice = false;
      }
      if (maxPrice && devicePrice > parseFloat(maxPrice)) {
        matchesPrice = false;
      }

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus &&
        matchesFavorites &&
        matchesPrice
      );
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "newest":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "availability": {
          const statusOrder = { available: 0, borrowed: 1, maintenance: 2 };
          return statusOrder[a.status] - statusOrder[b.status];
        }
        case "favorites": {
          const aFav = favorites.includes(String(a.id)) ? 0 : 1;
          const bFav = favorites.includes(String(b.id)) ? 0 : 1;
          return aFav - bFav;
        }
        default:
          return 0;
      }
    });

    return result;
  }, [
    devices,
    searchQuery,
    categoryFilter,
    statusFilter,
    sortBy,
    showFavoritesOnly,
    favorites,
    priceFilter,
    minPrice,
    maxPrice,
  ]);

  // Pagination
  const pagination = usePagination(filteredAndSortedDevices, [
    searchQuery,
    categoryFilter,
    statusFilter,
    priceFilter,
    minPrice,
    maxPrice,
    sortBy,
    showFavoritesOnly,
  ]);

  const hasActiveFilters =
    categoryFilter !== "all" ||
    statusFilter !== "all" ||
    priceFilter !== "all" ||
    searchQuery !== "" ||
    showFavoritesOnly;

  const handleDeviceClick = (device: DeviceWithDepartment) => {
    addToRecentlyViewed(String(device.id));
    navigate(`/device/${device.id}`);
  };

  const handleQuickRequest = (device: DeviceWithDepartment) => {
    addToRecentlyViewed(String(device.id));
    navigate(`/device/${device.id}`);
    toast.info(t("deviceCatalog.quickRequest"), {
      description: `${t("deviceCatalog.openingRequest")} ${device.name}`,
    });
  };

  const handleFavoriteToggle = (deviceId: number) => {
    const deviceIdStr = String(deviceId);
    const wasAdded = !isFavorite(deviceIdStr);
    toggleFavorite(deviceIdStr);

    const device = devices.find((d) => d.id === deviceId);
    toast.success(
      wasAdded ? t("deviceCatalog.favAdded") : t("deviceCatalog.favRemoved"),
      {
        description: device?.name,
      },
    );
  };

  return (
    <div
      className="min-h-screen bg-background"
      id="main-content"
      tabIndex={-1}
      role="main"
      aria-label={t("nav.catalog")}
    >
      <UserNavbar />

      <div className="container px-4 md:px-6 pt-4">
        <BreadcrumbNav />
      </div>

      {/* Hero Section - Dashboard Style */}
      <section
        className="container px-4 md:px-6 py-8"
        aria-labelledby="catalog-heading"
      >
        <div className="flex items-center gap-2 mb-1">
          <Laptop className="h-5 w-5 text-primary" aria-hidden="true" />
          <span className="text-sm text-muted-foreground">
            {devices.filter((d) => d.status === "available").length}{" "}
            {t("deviceCatalog.devicesAvailable")}
          </span>
        </div>
        <h1
          id="catalog-heading"
          className="text-2xl md:text-3xl font-bold mb-2"
        >
          {t("deviceCatalog.browseCatalog")}
        </h1>
        <p className="text-muted-foreground">
          {t("deviceCatalog.browseAndRequest")}
        </p>
      </section>

      {/* Filters - Compact Sticky Header */}
      <section
        className="border-b bg-background shadow-sm sticky top-14 z-40"
        aria-label={t("deviceCatalog.filters")}
      >
        <div className="container px-4 md:px-6 py-3">
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                placeholder={t("inventory.searchDevices")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
                aria-label={t("inventory.searchDevices")}
              />
            </div>

            {/* Category Dropdown */}
            <Select
              value={categoryFilter}
              onValueChange={(v) =>
                setCategoryFilter(v as DeviceCategory | "all")
              }
            >
              <SelectTrigger className="flex-1 min-w-[140px] max-w-[180px] h-9 text-sm">
                <SelectValue placeholder={t("inventory.category")} />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {option.icon}
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as DeviceStatus | "all")}
            >
              <SelectTrigger className="flex-1 min-w-[120px] max-w-[150px] h-9 text-sm">
                <SelectValue placeholder={t("table.status")} />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Price Filter */}
            <Select
              value={priceFilter}
              onValueChange={(v) => {
                setPriceFilter(v as PriceRange);
                if (v !== "all") {
                  setMinPrice("");
                  setMaxPrice("");
                }
              }}
            >
              <SelectTrigger className="flex-1 min-w-[130px] max-w-[160px] h-9 text-sm">
                <SelectValue placeholder={t("deviceCatalog.priceRange")} />
              </SelectTrigger>
              <SelectContent>
                {PRICE_RANGES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(`priceRange.${option.value}` as any)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select
              value={sortBy}
              onValueChange={(v) => setSortBy(v as SortOption)}
            >
              <SelectTrigger className="flex-1 min-w-[130px] max-w-[160px] h-9 text-sm">
                <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder={t("deviceCatalog.sortBy")} />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View & Favorites */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div
                className="flex items-center rounded-md border bg-muted/30 p-0.5"
                role="group"
                aria-label={t("deviceCatalog.viewMode")}
              >
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-7 w-7 rounded-sm"
                  onClick={() => setViewMode("grid")}
                  aria-label={t("deviceCatalog.gridView")}
                  aria-pressed={viewMode === "grid"}
                >
                  <Grid3X3 className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-7 w-7 rounded-sm"
                  onClick={() => setViewMode("list")}
                  aria-label={t("deviceCatalog.listView")}
                  aria-pressed={viewMode === "list"}
                >
                  <List className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </div>

              <Button
                variant={showFavoritesOnly ? "default" : "ghost"}
                size="sm"
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className="h-8 px-2.5 gap-1.5"
                aria-pressed={showFavoritesOnly}
                aria-label={
                  showFavoritesOnly
                    ? t("deviceCatalog.showAll")
                    : t("deviceCatalog.showFavoritesOnly")
                }
              >
                <Heart
                  className={cn(
                    "h-3.5 w-3.5",
                    showFavoritesOnly && "fill-current",
                  )}
                  aria-hidden="true"
                />
                {favoritesCount > 0 && (
                  <span className="text-xs">{favoritesCount}</span>
                )}
              </Button>
            </div>
          </div>

          {/* Active Filters - Only show when filters are applied */}
          {(categoryFilter !== "all" ||
            statusFilter !== "all" ||
            priceFilter !== "all" ||
            searchQuery ||
            showFavoritesOnly) && (
            <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-dashed overflow-x-auto">
              <span className="text-xs text-muted-foreground shrink-0">
                {t("deviceCatalog.filters")}
              </span>
              {searchQuery && (
                <Badge
                  variant="secondary"
                  className="h-6 text-xs gap-1 pl-2 pr-1 shrink-0"
                >
                  "{searchQuery}"
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => setSearchQuery("")}
                  />
                </Badge>
              )}
              {categoryFilter !== "all" && (
                <Badge
                  variant="secondary"
                  className="h-6 text-xs gap-1 pl-2 pr-1 shrink-0"
                >
                  {
                    categoryOptions.find((c) => c.value === categoryFilter)
                      ?.label
                  }
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => setCategoryFilter("all")}
                  />
                </Badge>
              )}
              {statusFilter !== "all" && (
                <Badge
                  variant="secondary"
                  className="h-6 text-xs gap-1 pl-2 pr-1 shrink-0"
                >
                  {statusOptions.find((s) => s.value === statusFilter)?.label}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => setStatusFilter("all")}
                  />
                </Badge>
              )}
              {priceFilter !== "all" && (
                <Badge
                  variant="secondary"
                  className="h-6 text-xs gap-1 pl-2 pr-1 shrink-0"
                >
                  {t(`priceRange.${priceFilter}` as any)}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => setPriceFilter("all")}
                  />
                </Badge>
              )}
              {showFavoritesOnly && (
                <Badge
                  variant="secondary"
                  className="h-6 text-xs gap-1 pl-2 pr-1 shrink-0"
                >
                  {t("deviceCatalog.favoritesOnly")}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => setShowFavoritesOnly(false)}
                  />
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground shrink-0"
                onClick={() => {
                  setSearchQuery("");
                  setCategoryFilter("all");
                  setStatusFilter("all");
                  setPriceFilter("all");
                  setMinPrice("");
                  setMaxPrice("");
                  setShowFavoritesOnly(false);
                }}
              >
                {t("deviceCatalog.clear")}
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Device Grid/List */}
      <section className="container px-4 md:px-6 py-8">
        <PaginationInfo
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
          onPageChange={pagination.goToPage}
          onPerPageChange={pagination.setPerPage}
          hasFilters={hasActiveFilters}
        />

        {isLoading ? (
          // Loading Skeletons
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonListItem key={i} />
              ))}
            </div>
          )
        ) : filteredAndSortedDevices.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {pagination.paginatedItems.map((device) => (
                <div key={device.id} className="relative animate-fade-in">
                  <DeviceCard
                    device={device}
                    onClick={handleDeviceClick}
                    onQuickRequest={handleQuickRequest}
                    onFavoriteToggle={handleFavoriteToggle}
                    isFavorite={isFavorite(String(device.id))}
                    showQuickRequest={true}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {pagination.paginatedItems.map((device) => {
                const specs = parseSpecs(device.specs_json);
                return (
                  <div
                    key={device.id}
                    className="flex items-center gap-4 p-4 rounded-lg border bg-card cursor-pointer transition-all hover:shadow-md animate-fade-in"
                    onClick={() => handleDeviceClick(device)}
                  >
                    {/* Favorite button for list view */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFavoriteToggle(device.id);
                      }}
                      className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center transition-colors shrink-0",
                        "hover:bg-muted",
                        isFavorite(String(device.id)) && "text-red-500",
                      )}
                      aria-label={
                        isFavorite(String(device.id))
                          ? t("deviceCatalog.removeFromFavorites")
                          : t("deviceCatalog.addToFavorites")
                      }
                    >
                      <Heart
                        className={cn(
                          "h-4 w-4",
                          isFavorite(String(device.id)) && "fill-current",
                        )}
                      />
                    </button>

                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                      <img
                        src={getDeviceThumbnailUrl(
                          device.image_thumbnail_url,
                          device.image_url,
                          device.category,
                        )}
                        alt={device.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{device.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {device.brand} • {device.model}
                      </p>
                    </div>
                    <div className="hidden sm:block text-sm text-muted-foreground capitalize">
                      {t(`category.${device.category}` as any)}
                    </div>
                    <div className="hidden md:flex gap-2">
                      {specs.ram && (
                        <Badge variant="secondary">{specs.ram}</Badge>
                      )}
                      {specs.storage && (
                        <Badge variant="secondary">{specs.storage}</Badge>
                      )}
                    </div>
                    <Badge
                      variant={
                        device.status === "available" ? "default" : "secondary"
                      }
                    >
                      {t(`status.${device.status}` as any)}
                    </Badge>

                    {/* Quick Request for list view */}
                    {device.status === "available" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickRequest(device);
                        }}
                        className="hidden lg:flex gap-1"
                      >
                        {t("deviceCatalog.quickRequest")}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <EmptyState
            type={showFavoritesOnly ? "no-favorites" : "no-results"}
            actionLabel={
              showFavoritesOnly ? t("deviceCatalog.viewAll") : undefined
            }
            onAction={
              showFavoritesOnly ? () => setShowFavoritesOnly(false) : undefined
            }
          />
        )}

        {/* Pagination Navigation */}
        <PaginationNav
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={pagination.goToPage}
        />
      </section>
    </div>
  );
};

export default DeviceCatalog;
