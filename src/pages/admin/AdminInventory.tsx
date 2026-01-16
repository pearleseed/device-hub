import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
  DeviceWithDepartment,
  DeviceCategory,
  DeviceStatus,
} from "@/types/api";
import { PRICE_RANGES, type PriceRange } from "@/lib/constants";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDevices, useUsers } from "@/hooks/use-api-queries";
import { useDeleteDevice } from "@/hooks/use-api-mutations";
import { exportToCSV, deviceExportColumns } from "@/lib/exportUtils";
import { cn, getDeviceImageUrl, parseSpecs } from "@/lib/utils";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Download,
  Undo2,
  Search,
  X,
  Laptop,
  Smartphone,
  Tablet,
  Monitor as MonitorIcon,
  Headphones,
  LayoutGrid,
  HardDrive,
  MemoryStick,
} from "lucide-react";
import {
  usePagination,
  PaginationInfo,
  PaginationNav,
} from "@/hooks/use-pagination";
import { AddDeviceModal } from "@/components/admin/AddDeviceModal";
import { useToast } from "@/hooks/use-toast";

// Category icon mapping
const getCategoryIcon = (category: DeviceCategory): string => {
  const icons: Record<DeviceCategory, string> = {
    laptop: "💻",
    mobile: "📱",
    tablet: "📲",
    monitor: "🖥️",
    accessories: "🎧",
    storage: "💾",
    ram: "🧠",
  };
  return icons[category];
};

const AdminInventory: React.FC = () => {
  const { t } = useLanguage();

  // Helper function to get category-specific specs display
  const getCategorySpecsDisplay = (
    device: DeviceWithDepartment,
  ): { label: string; value: string }[] => {
    const specs: { label: string; value: string }[] = [];
    const parsedSpecs = parseSpecs(device.specs_json);

    switch (device.category) {
      case "storage":
        if (parsedSpecs.capacity)
          specs.push({
            label: t("deviceDetail.capacity") || "Capacity",
            value: parsedSpecs.capacity,
          });
        if (parsedSpecs.speed)
          specs.push({
            label: t("deviceDetail.speed"),
            value: parsedSpecs.speed,
          });
        break;
      case "ram":
        if (parsedSpecs.capacity)
          specs.push({
            label: t("deviceDetail.capacity") || "Capacity",
            value: parsedSpecs.capacity,
          });
        if (parsedSpecs.busSpeed)
          specs.push({
            label: t("deviceDetail.busSpeed"),
            value: parsedSpecs.busSpeed,
          });
        break;
      case "laptop":
      case "tablet":
      case "mobile":
        if (parsedSpecs.ram)
          specs.push({
            label: t("deviceDetail.ram") || "RAM",
            value: parsedSpecs.ram,
          });
        if (parsedSpecs.storage)
          specs.push({
            label: t("deviceDetail.storage"),
            value: parsedSpecs.storage,
          });
        break;
      case "monitor":
        if (parsedSpecs.display)
          specs.push({
            label: t("deviceDetail.display"),
            value: parsedSpecs.display,
          });
        break;
      default:
        if (parsedSpecs.ram)
          specs.push({
            label: t("deviceDetail.ram") || "RAM",
            value: parsedSpecs.ram,
          });
    }

    return specs.slice(0, 2);
  };
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: cachedDevices = [] } = useDevices();
  const { data: users = [] } = useUsers();
  
  // Mutation hooks
  const deleteDeviceMutation = useDeleteDevice();
  const [isDeleting, setIsDeleting] = useState(false);

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
      { value: "inuse", label: t("status.inuse") },
      { value: "maintenance", label: t("status.maintenance") },
      { value: "updating", label: t("status.updating") },
      { value: "storage", label: t("status.storage") },
      { value: "discard", label: t("status.discard") },
      { value: "transferred", label: t("status.transferred") },
    ],
    [t],
  );

  const userMap = React.useMemo(
    () => new Map(users.map((u) => [u.id, u])),
    [users],
  );

  // Use cached devices directly (no local state needed since we use API)
  const devices = cachedDevices;

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<DeviceCategory | "all">(
    "all",
  );
  const [statusFilter, setStatusFilter] = useState<DeviceStatus | "all">("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [priceFilter, setPriceFilter] = useState<PriceRange>("all");

  // Get unique departments from devices
  const departments = useMemo(() => {
    const deps = new Set<string>();
    devices.forEach((device) => {
      if (device.department_name) deps.add(device.department_name);
    });
    return Array.from(deps).sort();
  }, [devices]);

  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState<
    DeviceWithDepartment[]
  >([]);

  // Filtered devices
  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          device.name.toLowerCase().includes(query) ||
          device.asset_tag.toLowerCase().includes(query) ||
          device.brand.toLowerCase().includes(query) ||
          device.category.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (categoryFilter !== "all" && device.category !== categoryFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all" && device.status !== statusFilter) {
        return false;
      }


      // Department filter
      if (departmentFilter !== "all") {
        // Filter by device's assigned department (if any) or check if assigned user is in that department
        // device.department_name usually comes from the joined query
        if (device.department_name !== departmentFilter) {
          return false;
        }
      }

      // Price filtering
      if (priceFilter !== "all") {
        const devicePrice = device.selling_price ?? device.purchase_price;
        const priceRange = PRICE_RANGES.find((r) => r.value === priceFilter);
        
        if (priceRange) {
          if (priceRange.min !== undefined && devicePrice < priceRange.min) {
            return false;
          }
          if (priceRange.max !== undefined && devicePrice >= priceRange.max) {
            return false;
          }
        }
      }

      return true;
    });
  }, [devices, searchQuery, categoryFilter, statusFilter, departmentFilter]);

  // Pagination
  const pagination = usePagination(filteredDevices, [
    searchQuery,
    categoryFilter,
    statusFilter,
    departmentFilter,
    priceFilter,
  ]);

  const hasActiveFilters = !!(
    searchQuery ||
    categoryFilter !== "all" ||
    statusFilter !== "all" ||
    departmentFilter !== "all" ||
    priceFilter !== "all"
  );

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setDepartmentFilter("all");
    setPriceFilter("all");
  };

  // handleAddDevice is handled by AddDeviceModal which uses useCreateDevice mutation
  const handleAddDevice = () => {
    // This is just a placeholder - the actual creation is done by AddDeviceModal
    // The modal will call the API and invalidate the query
  };

  const handleDeleteDevice = async (device: DeviceWithDepartment) => {
    try {
      await deleteDeviceMutation.mutateAsync(device.id);
    } catch (error) {
      console.error("Failed to delete device:", error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDevices.length === 0) return;
    
    setIsDeleting(true);
    
    try {
      // Delete all selected devices
      const promises = selectedDevices.map((device) =>
        deleteDeviceMutation.mutateAsync(device.id)
      );
      
      await Promise.all(promises);
      setSelectedDevices([]);
    } catch (error) {
      console.error("Failed to delete devices:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditDevice = (device: DeviceWithDepartment) => {
    navigate(`/admin/inventory/${device.id}?edit=true`);
  };

  const handleDeviceClick = (device: DeviceWithDepartment) => {
    navigate(`/admin/inventory/${device.id}`);
  };

  const handleExportCSV = () => {
    exportToCSV(filteredDevices, "device_inventory", deviceExportColumns);
    toast({
      title: t("adminInventory.exportComplete"),
      description: t("adminInventory.exportCSVDesc"),
    });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main
        id="main-content"
        className="flex-1 p-8"
        tabIndex={-1}
        role="main"
        aria-label="Inventory management"
      >
        <BreadcrumbNav />

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">{t("adminInventory.title")}</h1>
            {/* <p className="text-muted-foreground">
              {t("adminInventory.subtitle")}
            </p> */}
          </div>
          <div className="flex gap-2">
            {selectedDevices.length > 0 && (
              <Button variant="destructive" onClick={handleBulkDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                {t("common.delete")} ({selectedDevices.length})
              </Button>
            )}
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              {t("adminInventory.exportCSV")}
            </Button>
            <Button onClick={() => setAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("adminInventory.addDevice")}
            </Button>
          </div>
        </div>

        {/* Filters*/}
        <section className="border-b bg-background shadow-sm sticky top-0 z-40 -mx-8 px-8 mb-6">
          <div className="py-3">
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={t("inventory.searchDevices")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>

              {/* Department Dropdown */}
              <Select
                value={departmentFilter}
                onValueChange={(v) => setDepartmentFilter(v)}
              >
                <SelectTrigger className="flex-1 min-w-[140px] max-w-[180px] h-9 text-sm">
                  <SelectValue placeholder={t("table.department")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filter.all")}</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Category Dropdown */}
              <Select
                value={categoryFilter}
                onValueChange={(v) =>
                  setCategoryFilter(v as DeviceCategory | "all")
                }
              >
                <SelectTrigger className="flex-1 min-w-[140px] max-w-[180px] h-9 text-sm">
                  <SelectValue placeholder={t("table.category")} />
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
                onValueChange={(v) =>
                  setStatusFilter(v as DeviceStatus | "all")
                }
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
                onValueChange={(v) => setPriceFilter(v as PriceRange)}
              >
                <SelectTrigger className="flex-1 min-w-[130px] max-w-[160px] h-9 text-sm">
                  <SelectValue placeholder={t("deviceCatalog.priceRange")} />
                </SelectTrigger>
                <SelectContent>
                  {PRICE_RANGES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(`priceRange.${option.value}` as any) || option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active Filters - Only show when filters are applied */}
            {hasActiveFilters && (
              <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-dashed overflow-x-auto">
                <span className="text-xs text-muted-foreground shrink-0">
                  {t("deviceCatalog.filters")}:
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
                {departmentFilter !== "all" && (
                  <Badge
                    variant="secondary"
                    className="h-6 text-xs gap-1 pl-2 pr-1 shrink-0"
                  >
                    {departmentFilter}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => setDepartmentFilter("all")}
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
                    {t(`priceRange.${priceFilter}` as any) || PRICE_RANGES.find(r => r.value === priceFilter)?.label}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => setPriceFilter("all")}
                    />
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground shrink-0"
                  onClick={clearFilters}
                >
                  {t("deviceCatalog.clear")}
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Results Count */}
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

        {/* Device Grid */}
        {filteredDevices.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">
              {hasActiveFilters
                ? t("inventory.noMatchingDevices")
                : t("table.noData")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {pagination.paginatedItems.map((device) => {
              const assignedUser = device.assigned_to_id
                ? userMap.get(device.assigned_to_id)
                : null;

              return (
                <Card
                  key={device.id}
                  className={cn(
                    "overflow-hidden cursor-pointer transition-all duration-200",
                    "hover:shadow-md hover:-translate-y-1 group",
                  )}
                  onClick={() => handleDeviceClick(device)}
                >
                  {/* Image Section */}
                  <div className="aspect-4/3 relative overflow-hidden bg-muted">
                    <img
                      src={getDeviceImageUrl(device.image_url, device.category)}
                      alt={device.name}
                      className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getDeviceImageUrl(
                          null,
                          device.category,
                        );
                      }}
                    />
                    <div className="absolute top-3 left-3">
                      <StatusBadge status={device.status} />
                    </div>

                    {/* Action Menu */}
                    <div className="absolute top-3 right-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background shadow-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditDevice(device);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            {t("common.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDevice(device);
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t("common.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Content Section */}
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg" aria-hidden="true">
                        {getCategoryIcon(device.category)}
                      </span>
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">
                        {device.category}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground truncate">
                      {device.name}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {device.brand} • {device.model}
                    </p>

                    {/* Specs Tags */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {getCategorySpecsDisplay(device).map((spec, index) => (
                        <span
                          key={index}
                          className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md"
                        >
                          {spec.value}
                        </span>
                      ))}
                    </div>

                    {/* Assigned User & Department */}
                    {(assignedUser || device.department_name) && (
                      <div className="mt-3 pt-3 border-t space-y-1">
                        {assignedUser && (
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <span className="opacity-70">{t("table.assignedTo")}:</span> {assignedUser.name}
                          </p>
                        )}
                        {device.department_name && (
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <span className="opacity-70">{t("table.department")}:</span> {device.department_name}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination Navigation */}
        <PaginationNav
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={pagination.goToPage}
        />

        <AddDeviceModal
          open={addModalOpen}
          onOpenChange={setAddModalOpen}
          onAdd={handleAddDevice}
        />
      </main>
    </div>
  );
};

export default AdminInventory;
