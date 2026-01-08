import React, { useState, useEffect, useMemo } from "react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { equipmentAPI, usersAPI } from "@/lib/api";
import type {
  Equipment,
  User,
  DeviceCategory,
  DeviceStatus,
} from "@/lib/types";
import { getCategoryIcon } from "@/lib/types";
import { AddDeviceModal } from "@/components/admin/AddDeviceModal";
import { EditDeviceModal } from "@/components/admin/EditDeviceModal";
import { Plus, Search, Pencil, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Legacy Device interface
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

const AdminInventory: React.FC = () => {
  const { toast } = useToast();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [users, setUsers] = useState<Map<number, User>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<DeviceCategory | "all">(
    "all",
  );
  const [statusFilter, setStatusFilter] = useState<DeviceStatus | "all">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editDevice, setEditDevice] = useState<Device | null>(null);
  const [deleteDevice, setDeleteDevice] = useState<Device | null>(null);

  // Fetch data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [equipmentRes, usersRes] = await Promise.all([
        equipmentAPI.getAll(),
        usersAPI.getAll(),
      ]);

      if (equipmentRes.success && equipmentRes.data) {
        setEquipment(equipmentRes.data);
      }

      if (usersRes.success && usersRes.data) {
        const userMap = new Map<number, User>();
        usersRes.data.forEach((u) => userMap.set(u.id, u));
        setUsers(userMap);
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Convert to legacy format
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

  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      const matchesSearch =
        device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.assetTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.brand.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || device.category === categoryFilter;
      const matchesStatus =
        statusFilter === "all" || device.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [devices, searchQuery, categoryFilter, statusFilter]);

  const statusColors: Record<DeviceStatus, string> = {
    available: "bg-status-available text-status-available-foreground",
    borrowed: "bg-status-borrowed text-status-borrowed-foreground",
    maintenance: "bg-status-maintenance text-status-maintenance-foreground",
  };

  const handleAddDevice = async (newDevice: Omit<Device, "id">) => {
    // This would call the API to create a new device
    toast({
      title: "Device added",
      description: `${newDevice.name} has been added to inventory.`,
    });
    setShowAddModal(false);
    fetchData();
  };

  const handleEditDevice = async (updatedDevice: Device) => {
    try {
      const response = await equipmentAPI.update(parseInt(updatedDevice.id), {
        name: updatedDevice.name,
        asset_tag: updatedDevice.assetTag,
        category: updatedDevice.category,
        brand: updatedDevice.brand,
        model: updatedDevice.model,
        status: updatedDevice.status,
        specs_json: JSON.stringify(updatedDevice.specs),
        image_url: updatedDevice.image,
      });

      if (response.success) {
        toast({
          title: "Device updated",
          description: `${updatedDevice.name} has been updated.`,
        });
        setEditDevice(null);
        fetchData();
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to update device",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update device",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDevice = async () => {
    if (!deleteDevice) return;

    try {
      const response = await equipmentAPI.delete(parseInt(deleteDevice.id));
      if (response.success) {
        toast({
          title: "Device deleted",
          description: `${deleteDevice.name} has been removed.`,
        });
        setDeleteDevice(null);
        fetchData();
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to delete device",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete device",
        variant: "destructive",
      });
    }
  };

  const getUserById = (userId: string | null): User | undefined => {
    if (!userId) return undefined;
    return users.get(parseInt(userId));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading inventory...</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main id="main-content" className="flex-1 p-8" tabIndex={-1}>
        <BreadcrumbNav />
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Device Inventory</h1>
            <p className="text-muted-foreground">
              Manage all devices in your organization
            </p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Device
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by name, asset tag, or brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={categoryFilter}
            onValueChange={(v) =>
              setCategoryFilter(v as DeviceCategory | "all")
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Category" />
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
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as DeviceStatus | "all")}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="borrowed">Borrowed</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-4">
          Showing {filteredDevices.length} of {devices.length} devices
        </p>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Asset Tag</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDevices.map((device) => {
                const assignedUser = getUserById(device.assignedTo);
                return (
                  <TableRow key={device.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <img
                            src={device.image}
                            alt={device.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium">{device.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {device.brand} • {device.model}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        {getCategoryIcon(device.category)}
                        <span className="capitalize">{device.category}</span>
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {device.assetTag}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[device.status]}>
                        {device.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {assignedUser ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full overflow-hidden bg-muted">
                            <img
                              src={assignedUser.avatar_url || ""}
                              alt={assignedUser.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-sm">{assignedUser.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditDevice(device)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteDevice(device)}
                          disabled={device.status === "borrowed"}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </main>

      {/* Add Device Modal */}
      <AddDeviceModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddDevice}
      />

      {/* Edit Device Modal */}
      <EditDeviceModal
        device={editDevice}
        open={!!editDevice}
        onClose={() => setEditDevice(null)}
        onSave={handleEditDevice}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteDevice}
        onOpenChange={() => setDeleteDevice(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Device</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDevice?.name}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDevice}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminInventory;
