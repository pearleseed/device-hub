import React, { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { DeviceWithDepartment, DeviceCategory } from "@/types/api";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link2, Upload } from "lucide-react";

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
  image: z.string().optional().or(z.literal("")),
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
  onAdd: (device: Omit<DeviceWithDepartment, "id">) => void;
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
  const [imageInputMode, setImageInputMode] = useState<"url" | "upload">("url");
  const [uploadedImagePreview, setUploadedImagePreview] = useState<
    string | null
  >(null);

  const form = useForm<DeviceFormData>({
    resolver: zodResolver(deviceSchema) as Resolver<DeviceFormData>,
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        return;
      }
      // Validate file size (5MB for devices)
      if (file.size > 5 * 1024 * 1024) {
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      setUploadedImagePreview(previewUrl);
      form.setValue("image", previewUrl);
    }
  };

  const onSubmit = (data: DeviceFormData) => {
    onAdd({
      name: data.name,
      brand: data.brand,
      model: data.model,
      category: data.category as DeviceCategory,
      asset_tag: data.assetTag,
      status: "available",
      department_id: 1, // Default department
      image_url: data.image,
      image_thumbnail_url: null,
      specs_json: JSON.stringify({
        os: data.os || "",
        processor: data.processor || "",
        ram: data.ram || "",
        storage: data.storage || "",
      }),
      purchase_price: data.purchasePrice,
      selling_price: null,
      purchase_date: new Date(data.purchaseDate),
      created_at: new Date(),
    });
    form.reset();
    setUploadedImagePreview(null);
    setImageInputMode("url");
    onOpenChange(false);
  };

  const handleClose = () => {
    form.reset();
    if (uploadedImagePreview) {
      URL.revokeObjectURL(uploadedImagePreview);
    }
    setUploadedImagePreview(null);
    setImageInputMode("url");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add New Device</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column - Basic Info & Specs */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
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
                  </div>
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
                            <SelectTrigger className="capitalize">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((c) => (
                              <SelectItem
                                key={c}
                                value={c}
                                className="capitalize"
                              >
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="pt-3 border-t space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    Specifications (Optional)
                  </p>
                  <div className="grid grid-cols-2 gap-3">
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
              </div>

              {/* Right Column - Image & Purchase Info */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    Device Image
                  </p>
                  <Tabs
                    value={imageInputMode}
                    onValueChange={(v) =>
                      setImageInputMode(v as "url" | "upload")
                    }
                  >
                    <TabsList className="grid w-full grid-cols-2 mb-3">
                      <TabsTrigger value="url" className="gap-1.5">
                        <Link2 className="h-3.5 w-3.5" />
                        URL
                      </TabsTrigger>
                      <TabsTrigger value="upload" className="gap-1.5">
                        <Upload className="h-3.5 w-3.5" />
                        Upload
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="url">
                      <FormField
                        control={form.control}
                        name="image"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="https://..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                    <TabsContent value="upload">
                      <div className="space-y-2">
                        <div className="flex items-center justify-center w-full">
                          <label
                            htmlFor="device-image-upload"
                            className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors"
                          >
                            {uploadedImagePreview ? (
                              <img
                                src={uploadedImagePreview}
                                alt="Preview"
                                className="h-full w-full object-contain rounded-lg"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center py-4">
                                <Upload className="w-6 h-6 mb-1.5 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">
                                  Click to upload
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  JPEG, PNG, WebP (max 5MB)
                                </p>
                              </div>
                            )}
                            <input
                              id="device-image-upload"
                              type="file"
                              className="hidden"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={handleFileSelect}
                            />
                          </label>
                        </div>
                        {uploadedImagePreview && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (uploadedImagePreview) {
                                URL.revokeObjectURL(uploadedImagePreview);
                              }
                              setUploadedImagePreview(null);
                              form.setValue("image", "");
                            }}
                          >
                            Remove Image
                          </Button>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                <div className="pt-3 border-t space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    Purchase Information
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="purchasePrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              {...field}
                            />
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
                          <FormLabel>Date *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2 border-t">
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
