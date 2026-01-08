import React, { useState, useMemo } from "react";
import type { DeviceCategory, DeviceStatus } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface EditDeviceModalProps {
  device: Device | null;
  open: boolean;
  onClose: () => void;
  onSave: (device: Device) => void;
}

export const EditDeviceModal: React.FC<EditDeviceModalProps> = ({
  device,
  open,
  onClose,
  onSave,
}) => {
  // Track edits separately from the device prop
  const [edits, setEdits] = useState<Partial<Device>>({});

  // Reset edits when device changes
  const deviceKey = device?.id ?? "";
  const formData = useMemo(() => {
    if (!device) return null;
    return { ...device, ...edits };
  }, [device, edits]);

  // Reset edits when switching devices
  const [lastDeviceKey, setLastDeviceKey] = useState(deviceKey);
  if (deviceKey !== lastDeviceKey) {
    setLastDeviceKey(deviceKey);
    setEdits({});
  }

  if (!formData) return null;

  const setFormData = (newData: Device) => {
    setEdits((prev) => ({ ...prev, ...newData }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Device</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Device Name</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    category: value as DeviceCategory,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="laptop">💻 Laptop</SelectItem>
                  <SelectItem value="mobile">📱 Mobile</SelectItem>
                  <SelectItem value="tablet">📲 Tablet</SelectItem>
                  <SelectItem value="monitor">🖥️ Monitor</SelectItem>
                  <SelectItem value="accessories">🎧 Accessories</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as DeviceStatus })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="borrowed">Borrowed</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-brand">Brand</Label>
              <Input
                id="edit-brand"
                value={formData.brand}
                onChange={(e) =>
                  setFormData({ ...formData, brand: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-model">Model</Label>
              <Input
                id="edit-model"
                value={formData.model}
                onChange={(e) =>
                  setFormData({ ...formData, model: e.target.value })
                }
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-assetTag">Asset Tag</Label>
            <Input
              id="edit-assetTag"
              value={formData.assetTag}
              onChange={(e) =>
                setFormData({ ...formData, assetTag: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-image">Image URL</Label>
            <Input
              id="edit-image"
              type="url"
              value={formData.image}
              onChange={(e) =>
                setFormData({ ...formData, image: e.target.value })
              }
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
