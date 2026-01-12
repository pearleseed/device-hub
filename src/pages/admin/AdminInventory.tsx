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
import { useLanguage } from "@/contexts/LanguageContext";
import { useDevices, useUsers } from "@/hooks/use-api-queries";
import { exportToCSV, deviceExportColumns } from "@/lib/exportUtils";
import { cn, getDeviceImageUrl } from "@/lib/utils";
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
} from "@/components/ui/pagination-controls";
import { AddDeviceModal } from "@/components/admin/AddDeviceModal";
import { EditDeviceModal } from "@/components/admin/EditDeviceModal";
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

// Helper function to parse specs_json safely
const parseSpecs = (
  specsJson: string | undefined | null,
): Record<string, string> => {
  if (!specsJson) return {};
  try {
    return JSON.parse(specsJson);
  } catch {
    return {};
  }
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

  const userMap = React.useMemo(
    () => new Map(users.map((u) => [u.id, u])),
    [users],
  );

  // Local state for optimistic updates
  const [localDevices, setLocalDevices] = useState<
    DeviceWithDepartment[] | null
  >(null);
  const devices = localDevices ?? cachedDevices;

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<DeviceCategory | "all">(
    "all",
  );
  const [statusFilter, setStatusFilter] = useState<DeviceStatus | "all">("all");

  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] =
    useState<DeviceWithDepartment | null>(null);
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

      return true;
    });
  }, [devices, searchQuery, categoryFilter, statusFilter]);

  // Pagination
  const pagination = usePagination(filteredDevices, [
    searchQuery,
    categoryFilter,
    statusFilter,
  ]);

  const hasActiveFilters = !!(
    searchQuery ||
    categoryFilter !== "all" ||
    statusFilter !== "all"
  );

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setStatusFilter("all");
  };

  const handleAddDevice = (newDevice: Omit<DeviceWithDepartment, "id">) => {
    const device: DeviceWithDepartment = {
      ...newDevice,
      id: devices.length + 1,
    };
    setLocalDevices([...devices, device]);
    toast({
      title: t("inventory.deviceAdded"),
      description: `${device.name} ${t("inventory.hasBeenAdded")}`,
    });
  };

  const handleEditDevice = (updatedDevice: DeviceWithDepartment) => {
    setLocalDevices(
      devices.map((d) => (d.id === updatedDevice.id ? updatedDevice : d)),
    );
    toast({
      title: t("inventory.deviceUpdated"),
      description: `${updatedDevice.name} ${t("inventory.hasBeenUpdated")}`,
    });
  };

  const handleDeleteDevice = (device: DeviceWithDepartment) => {
    const deletedDevice = { ...device };

    setLocalDevices((prev) => {
      const current = prev ?? cachedDevices;
      return current.filter((d) => d.id !== device.id);
    });

    toast({
      title: t("inventory.deviceDeleted"),
      description: `${device.name} ${t("inventory.hasBeenRemoved")}`,
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setLocalDevices((prev) => {
              const current = prev ?? cachedDevices;
              if (current.some((d) => d.id === deletedDevice.id)) {
                return current;
              }
              return [...current, deletedDevice];
            });
            toast({
              title: t("common.restored"),
              description: `${deletedDevice.name} ${t("inventory.deviceRestored")}`,
            });
          }}
        >
          <Undo2 className="h-4 w-4 mr-1" />
          {t("common.undo")}
        </Button>
      ),
    });
  };

  const handleBulkDelete = () => {
    const deletedDevices = selectedDevices.map((device) => ({ ...device }));

    setLocalDevices((prev) => {
      const current = prev ?? cachedDevices;
      return current.filter((d) => !selectedDevices.some((s) => s.id === d.id));
    });
    setSelectedDevices([]);

    toast({
      title: t("inventory.devicesDeleted"),
      description: `${deletedDevices.length} ${t("inventory.haveBeenRemoved")}`,
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setLocalDevices((prev) => {
              const current = prev ?? cachedDevices;
              const devicesToRestore = deletedDevices.filter(
                (deleted) => !current.some((d) => d.id === deleted.id),
              );
              return [...current, ...devicesToRestore];
            });
            toast({
              title: t("common.restored"),
              description: `${deletedDevices.length} ${t("inventory.haveBeenRestored")}`,
            });
          }}
        >
          <Undo2 className="h-4 w-4 mr-1" />
          {t("common.undo")}
        </Button>
      ),
    });
  };

  const openEditModal = (device: DeviceWithDepartment) => {
    setSelectedDevice(device);
    setEditModalOpen(true);
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
            <p className="text-muted-foreground">
              {t("adminInventory.subtitle")}
            </p>
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

        {/* Filters - Compact Sticky Header like Catalog */}
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
                              openEditModal(device);
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

                    {/* Assigned User */}
                    {assignedUser && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground truncate">
                          {t("table.assignedTo")}: {assignedUser.name}
                        </p>
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
        <EditDeviceModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          device={selectedDevice}
          onSave={handleEditDevice}
        />
      </main>
    </div>
  );
};

export default AdminInventory;
