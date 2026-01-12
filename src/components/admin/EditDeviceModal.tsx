import React, { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type {
  DeviceWithDepartment,
  DeviceCategory,
  DeviceStatus,
} from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AvatarUploader } from "@/components/ui/AvatarUploader";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

const deviceSchema = z.object({
  name: z.string().min(2, "Device name must be at least 2 characters").max(100),
  brand: z.string().min(1, "Brand is required").max(50),
  model: z.string().min(1, "Model is required").max(100),
  category: z.enum(["laptop", "mobile", "tablet", "monitor", "accessories"]),
  status: z.enum(["available", "borrowed", "maintenance"]),
  asset_tag: z.string().min(1, "Asset tag is required").max(20),
  image_url: z.string().optional().or(z.literal("")),
  purchase_price: z.coerce.number().min(0, "Price must be positive"),
  purchase_date: z.string().min(1, "Purchase date is required"),
  os: z.string().max(50).optional(),
  processor: z.string().max(100).optional(),
  ram: z.string().max(20).optional(),
  storage: z.string().max(50).optional(),
});

type DeviceFormData = z.infer<typeof deviceSchema>;

interface EditDeviceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: DeviceWithDepartment | null;
  onSave: (device: DeviceWithDepartment) => void;
}

const categories: DeviceCategory[] = [
  "laptop",
  "mobile",
  "tablet",
  "monitor",
  "accessories",
];
const statuses: DeviceStatus[] = ["available", "borrowed", "maintenance"];

// Helper to parse specs from JSON string
const parseSpecs = (specsJson: string | undefined): Record<string, string> => {
  if (!specsJson) return {};
  try {
    return JSON.parse(specsJson);
  } catch {
    return {};
  }
};

export const EditDeviceModal: React.FC<EditDeviceModalProps> = ({
  open,
  onOpenChange,
  device,
  onSave,
}) => {
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [initializedDeviceId, setInitializedDeviceId] = useState<number | null>(
    null,
  );

  const form = useForm<DeviceFormData>({
    resolver: zodResolver(deviceSchema) as any,
    defaultValues: {
      name: "",
      brand: "",
      model: "",
      category: "laptop",
      status: "available",
      asset_tag: "",
      image_url: "",
      purchase_price: 0,
      purchase_date: new Date().toISOString().split("T")[0],
      os: "",
      processor: "",
      ram: "",
      storage: "",
    },
  });

  const resetFormForDevice = useCallback(() => {
    if (device && device.id !== initializedDeviceId) {
      const specs = parseSpecs(device.specs_json);
      const purchaseDate = device.purchase_date
        ? format(new Date(device.purchase_date), "yyyy-MM-dd")
        : new Date().toISOString().split("T")[0];

      form.reset({
        name: device.name,
        brand: device.brand,
        model: device.model,
        category: device.category as
          | "laptop"
          | "mobile"
          | "tablet"
          | "monitor"
          | "accessories",
        status: device.status as "available" | "borrowed" | "maintenance",
        asset_tag: device.asset_tag,
        image_url: device.image_url || "",
        purchase_price: device.purchase_price || 0,
        purchase_date: purchaseDate,
        os: specs.os || "",
        processor: specs.processor || "",
        ram: specs.ram || "",
        storage: specs.storage || "",
      });
      setCurrentImageUrl(device.image_url || null);
      setInitializedDeviceId(device.id);
    }
  }, [device, form, initializedDeviceId]);

  React.useEffect(() => {
    if (open) {
      resetFormForDevice();
    }
  }, [open, resetFormForDevice]);

  const handleAvatarUploadSuccess = (newUrl: string) => {
    setCurrentImageUrl(newUrl);
    form.setValue("image_url", newUrl);
  };

  const handleAvatarDelete = () => {
    setCurrentImageUrl(null);
    form.setValue("image_url", "");
  };

  const onSubmit = (data: DeviceFormData) => {
    if (!device) return;

    onSave({
      ...device,
      name: data.name,
      brand: data.brand,
      model: data.model,
      category: data.category as DeviceCategory,
      status: data.status as DeviceStatus,
      asset_tag: data.asset_tag,
      image_url: data.image_url || device.image_url,
      purchase_price: data.purchase_price,
      purchase_date: new Date(data.purchase_date),
      specs_json: JSON.stringify({
        os: data.os || "",
        processor: data.processor || "",
        ram: data.ram || "",
        storage: data.storage || "",
      }),
    });
    onOpenChange(false);
  };

  const handleClose = () => {
    form.reset();
    setCurrentImageUrl(null);
    onOpenChange(false);
  };

  if (!device) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Device</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Device Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="asset_tag"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Tag *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c} value={c} className="capitalize">
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statuses.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Device Image Upload Section */}
            <div className="pt-2 border-t">
              <p className="text-sm font-medium text-muted-foreground mb-3">
                Device Image
              </p>
              <div className="flex justify-center">
                <AvatarUploader
                  currentAvatarUrl={currentImageUrl}
                  onUploadSuccess={handleAvatarUploadSuccess}
                  onDelete={handleAvatarDelete}
                  entityType="device"
                  entityId={device.id}
                  size="lg"
                />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="purchase_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Price *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="purchase_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="pt-2 border-t">
              <p className="text-sm font-medium text-muted-foreground mb-3">
                Specifications
              </p>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="os"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>OS</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="processor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Processor</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ram"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RAM</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="storage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Storage</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
