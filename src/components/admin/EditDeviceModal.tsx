import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Device, DeviceCategory, DeviceStatus } from "@/lib/mockData";
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

const deviceSchema = z.object({
  name: z.string().min(2, "Device name must be at least 2 characters").max(100),
  brand: z.string().min(1, "Brand is required").max(50),
  model: z.string().min(1, "Model is required").max(100),
  category: z.enum(["laptop", "mobile", "tablet", "monitor", "accessories"]),
  status: z.enum(["available", "borrowed", "maintenance"]),
  assetTag: z.string().min(1, "Asset tag is required").max(20),
  image: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  os: z.string().max(50).optional(),
  processor: z.string().max(100).optional(),
  ram: z.string().max(20).optional(),
  storage: z.string().max(50).optional(),
});

type DeviceFormData = z.infer<typeof deviceSchema>;

interface EditDeviceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: Device | null;
  onSave: (device: Device) => void;
}

const categories: DeviceCategory[] = [
  "laptop",
  "mobile",
  "tablet",
  "monitor",
  "accessories",
];
const statuses: DeviceStatus[] = ["available", "borrowed", "maintenance"];

export const EditDeviceModal: React.FC<EditDeviceModalProps> = ({
  open,
  onOpenChange,
  device,
  onSave,
}) => {
  const form = useForm<DeviceFormData>({
    resolver: zodResolver(deviceSchema),
    defaultValues: {
      name: "",
      brand: "",
      model: "",
      category: "laptop",
      status: "available",
      assetTag: "",
      image: "",
      os: "",
      processor: "",
      ram: "",
      storage: "",
    },
  });

  // Update form when device changes
  useEffect(() => {
    if (device) {
      form.reset({
        name: device.name,
        brand: device.brand,
        model: device.model,
        category: device.category,
        status: device.status,
        assetTag: device.assetTag,
        image: device.image,
        os: device.specs.os,
        processor: device.specs.processor,
        ram: device.specs.ram,
        storage: device.specs.storage,
      });
    }
  }, [device, form]);

  const onSubmit = (data: DeviceFormData) => {
    if (!device) return;

    onSave({
      ...device,
      name: data.name,
      brand: data.brand,
      model: data.model,
      category: data.category as DeviceCategory,
      status: data.status as DeviceStatus,
      assetTag: data.assetTag,
      image: data.image || device.image,
      specs: {
        os: data.os || "",
        processor: data.processor || "",
        ram: data.ram || "",
        storage: data.storage || "",
      },
    });
    onOpenChange(false);
  };

  const handleClose = () => {
    form.reset();
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
                name="assetTag"
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

            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
