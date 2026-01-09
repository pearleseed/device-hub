import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Device, DeviceCategory } from "@/lib/mockData";
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
  assetTag: z
    .string()
    .min(1, "Asset tag is required")
    .max(20)
    .regex(/^[A-Z]{2,4}-\d{3,4}$/i, "Format: ABC-001"),
  image: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  purchasePrice: z.coerce.number().min(0, "Price must be positive"),
  purchaseDate: z.string().min(1, "Purchase date is required"),
  os: z.string().max(50).optional(),
  processor: z.string().max(100).optional(),
  ram: z.string().max(20).optional(),
  storage: z.string().max(50).optional(),
});

type DeviceFormData = z.infer<typeof deviceSchema>;

interface AddDeviceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (device: Omit<Device, "id">) => void;
}

const categories: DeviceCategory[] = [
  "laptop",
  "mobile",
  "tablet",
  "monitor",
  "accessories",
];

export const AddDeviceModal: React.FC<AddDeviceModalProps> = ({
  open,
  onOpenChange,
  onAdd,
}) => {
  const form = useForm<DeviceFormData>({
    resolver: zodResolver(deviceSchema),
    defaultValues: {
      name: "",
      brand: "",
      model: "",
      category: "laptop",
      assetTag: "",
      image: "",
      purchasePrice: 0,
      purchaseDate: new Date().toISOString().split("T")[0],
      os: "",
      processor: "",
      ram: "",
      storage: "",
    },
  });

  const onSubmit = (data: DeviceFormData) => {
    onAdd({
      name: data.name,
      brand: data.brand,
      model: data.model,
      category: data.category as DeviceCategory,
      assetTag: data.assetTag,
      status: "available",
      assignedTo: null,
      image:
        data.image ||
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop",
      specs: {
        os: data.os || "",
        processor: data.processor || "",
        ram: data.ram || "",
        storage: data.storage || "",
      },
      addedDate: new Date().toISOString().split("T")[0],
      purchasePrice: data.purchasePrice,
      purchaseDate: data.purchaseDate,
    });
    form.reset();
    onOpenChange(false);
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Device</DialogTitle>
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
                      <Input placeholder="MacBook Pro 14" {...field} />
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
                      <Input placeholder="LAP-001" {...field} />
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
                      <Input placeholder="Apple" {...field} />
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
                      <Input placeholder="M3 Pro 2023" {...field} />
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
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
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="purchasePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Price *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="purchaseDate"
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
                Specifications (Optional)
              </p>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="os"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>OS</FormLabel>
                      <FormControl>
                        <Input placeholder="macOS Sonoma" {...field} />
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
                        <Input placeholder="M3 Pro" {...field} />
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
                        <Input placeholder="18GB" {...field} />
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
                        <Input placeholder="512GB SSD" {...field} />
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
              <Button type="submit">Add Device</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
