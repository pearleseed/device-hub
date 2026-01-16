import React, { useState } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { DeviceCategory } from "@/types/api";
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
  FormDescription,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Link2,
  Upload,
  Loader2,
  Laptop,
  Cpu,
  Receipt,
  Image as ImageIcon,
} from "lucide-react";
import { useCreateDevice } from "@/hooks/use-api-mutations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "../ui/textarea";

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
  notes: z.string().max(500).optional(),
});

type DeviceFormData = z.infer<typeof deviceSchema>;

// Separate component to handle image preview without form.watch() in parent
const ImagePreview: React.FC<{
  imageUrl: string | undefined;
  uploadedImagePreview: string | null;
  onRemove: () => void;
}> = ({ imageUrl, uploadedImagePreview, onRemove }) => {
  const displayUrl = uploadedImagePreview || imageUrl;

  return (
    <div className="mt-4 relative rounded-lg border bg-muted/30 overflow-hidden flex items-center justify-center flex-1 min-h-[150px]">
      {displayUrl ? (
        <img
          src={displayUrl}
          alt="Preview"
          className="w-full h-full object-contain absolute inset-0"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "";
            (e.target as HTMLImageElement).style.display = "none";
          }}
          onLoad={(e) => {
            (e.target as HTMLImageElement).style.display = "block";
          }}
        />
      ) : (
        <div className="text-muted-foreground/30 flex flex-col items-center">
          <ImageIcon className="h-10 w-10 mb-2 opacity-50" />
          <span className="text-xs">No image selected</span>
        </div>
      )}

      {uploadedImagePreview && (
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6 rounded-full shadow-sm"
          onClick={onRemove}
        >
          <span className="sr-only">Remove</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
        </Button>
      )}
    </div>
  );
};

interface AddDeviceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd?: () => void; // Optional callback after successful creation
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

  const createDevice = useCreateDevice();

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
      notes: "",
    },
  });

  // Use useWatch instead of form.watch() for better React Compiler compatibility
  const watchedImage = useWatch({ control: form.control, name: "image" });

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

  const onSubmit = async (data: DeviceFormData) => {
    try {
      await createDevice.mutateAsync({
        name: data.name,
        brand: data.brand,
        model: data.model,
        category: data.category as DeviceCategory,
        asset_tag: data.assetTag,
        department_id: 1, // Default department
        image_url: data.image || "",
        specs_json: JSON.stringify({
          os: data.os || "",
          processor: data.processor || "",
          ram: data.ram || "",
          storage: data.storage || "",
        }),
        purchase_price: data.purchasePrice,
        purchase_date: data.purchaseDate,
        notes: data.notes || "",
      });

      form.reset();
      setUploadedImagePreview(null);
      setImageInputMode("url");
      onOpenChange(false);
      onAdd?.();
    } catch (error) {
      console.error("Failed to create device:", error);
    }
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
      <DialogContent className="max-w-[95vw] sm:max-w-2xl lg:max-w-5xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pb-3 sm:pb-4 border-b">
          <DialogTitle className="text-lg sm:text-2xl font-semibold tracking-tight">
            Add New Device
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Basic Information Card */}
              <Card className="lg:col-span-2 h-full flex flex-col">
                <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
                  <CardTitle className="text-sm sm:text-base font-medium flex items-center gap-2 text-primary">
                    <Laptop className="h-4 w-4 sm:h-5 sm:w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 px-3 sm:px-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="col-span-1 sm:col-span-2">
                        <FormLabel className="text-xs sm:text-sm">Device Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. MacBook Pro 14" className="h-9 sm:h-10 text-sm" {...field} />
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
                        <FormLabel className="text-xs sm:text-sm">Category *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="capitalize h-9 sm:h-10 text-sm">
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
                  <FormField
                    control={form.control}
                    name="assetTag"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm">Asset Tag *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. LAP-001" className="h-9 sm:h-10 text-sm" {...field} />
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
                        <FormLabel className="text-xs sm:text-sm">Brand *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Apple" className="h-9 sm:h-10 text-sm" {...field} />
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
                        <FormLabel className="text-xs sm:text-sm">Model *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. M3 Pro 2023" className="h-9 sm:h-10 text-sm" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Device Image Card - Hidden on mobile, shown as collapsible */}
              <Card className="lg:col-span-1 h-full flex flex-col">
                <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
                  <CardTitle className="text-sm sm:text-base font-medium flex items-center gap-2 text-primary">
                    <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    Device Image
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 flex-1 flex flex-col px-3 sm:px-6">
                  <Tabs
                    value={imageInputMode}
                    onValueChange={(v) =>
                      setImageInputMode(v as "url" | "upload")
                    }
                    className="w-full flex-1 flex flex-col"
                  >
                    <TabsList className="grid w-full grid-cols-2 mb-3 sm:mb-4 h-8 sm:h-10">
                      <TabsTrigger value="url" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                        <Link2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        URL
                      </TabsTrigger>
                      <TabsTrigger value="upload" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                        <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
                        Upload
                      </TabsTrigger>
                    </TabsList>

                    <div className="flex-1 flex flex-col">
                      <TabsContent value="url" className="mt-0">
                        <FormField
                          control={form.control}
                          name="image"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder="https://example.com/image.jpg" className="h-9 sm:h-10 text-sm" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TabsContent>
                      <TabsContent value="upload" className="mt-0">
                        <div className="space-y-2">
                          <label
                            htmlFor="device-image-upload"
                            className="flex items-center justify-center w-full h-9 sm:h-10 border border-dashed rounded-md cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors border-muted-foreground/25"
                          >
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="text-xs sm:text-sm font-medium">
                                Click to upload (Max 5MB)
                              </span>
                            </div>
                            <input
                              id="device-image-upload"
                              type="file"
                              className="hidden"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={handleFileSelect}
                            />
                          </label>
                        </div>
                      </TabsContent>

                      {/* Preview Area - smaller on mobile */}
                      <div className="hidden sm:block">
                        <ImagePreview
                          imageUrl={watchedImage}
                          uploadedImagePreview={uploadedImagePreview}
                          onRemove={() => {
                            if (uploadedImagePreview) {
                              URL.revokeObjectURL(uploadedImagePreview);
                            }
                            setUploadedImagePreview(null);
                            form.setValue("image", "");
                          }}
                        />
                      </div>
                      {/* Compact preview for mobile */}
                      <div className="sm:hidden mt-2">
                        {(uploadedImagePreview || watchedImage) && (
                          <div className="relative h-20 rounded-md border bg-muted/30 overflow-hidden">
                            <img
                              src={uploadedImagePreview || watchedImage}
                              alt="Preview"
                              className="w-full h-full object-contain"
                            />
                            {uploadedImagePreview && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-1 right-1 h-5 w-5 rounded-full"
                                onClick={() => {
                                  URL.revokeObjectURL(uploadedImagePreview);
                                  setUploadedImagePreview(null);
                                  form.setValue("image", "");
                                }}
                              >
                                <span className="sr-only">Remove</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-2.5 w-2.5"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Specifications Card */}
              <Card className="lg:col-span-2 h-full flex flex-col">
                <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
                  <CardTitle className="text-sm sm:text-base font-medium flex items-center gap-2 text-primary">
                    <Cpu className="h-4 w-4 sm:h-5 sm:w-5" />
                    Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3 sm:gap-4 px-3 sm:px-6">
                  <FormField
                    control={form.control}
                    name="processor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm">Processor</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Intel i7" className="h-9 sm:h-10 text-sm" {...field} />
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
                        <FormLabel className="text-xs sm:text-sm">RAM</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 16GB" className="h-9 sm:h-10 text-sm" {...field} />
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
                        <FormLabel className="text-xs sm:text-sm">Storage</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 512GB SSD" className="h-9 sm:h-10 text-sm" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="os"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm">OS</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. macOS" className="h-9 sm:h-10 text-sm" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Purchase Info Card */}
              <Card className="lg:col-span-1 h-full flex flex-col">
                <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
                  <CardTitle className="text-sm sm:text-base font-medium flex items-center gap-2 text-primary">
                    <Receipt className="h-4 w-4 sm:h-5 sm:w-5" />
                    Purchase Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4 px-3 sm:px-6">
                  <FormField
                    control={form.control}
                    name="purchasePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm">Price ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className="h-9 sm:h-10 text-sm"
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
                        <FormLabel className="text-xs sm:text-sm">Date</FormLabel>
                        <FormControl>
                          <Input type="date" className="h-9 sm:h-10 text-sm" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Notes Card */}
              <Card className="lg:col-span-3">
                <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
                  <CardTitle className="text-sm sm:text-base font-medium flex items-center gap-2 text-primary">
                    <Receipt className="h-4 w-4 sm:h-5 sm:w-5" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Add any additional notes..."
                            className="min-h-[60px] sm:min-h-[100px] text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            <DialogFooter className="pt-3 sm:pt-4 border-t gap-2 flex-col-reverse sm:flex-row">
              <Button type="button" variant="outline" onClick={handleClose} className="w-full sm:w-auto h-9 sm:h-10">
                Cancel
              </Button>
              <Button type="submit" disabled={createDevice.isPending} className="w-full sm:w-auto px-6 sm:px-8 h-9 sm:h-10">
                {createDevice.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Device"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
