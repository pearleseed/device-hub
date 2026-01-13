import React, { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AvatarUploader } from "@/components/ui/AvatarUploader";
import { useDevice, useUsers } from "@/hooks/use-api-queries";
import { useUpdateDevice } from "@/hooks/use-api-mutations";
import { getDeviceImageUrl } from "@/lib/utils";
import { getCategoryIcon } from "@/lib/constants";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import type { DeviceCategory, DeviceStatus } from "@/types/api";
import {
  ArrowLeft, Cpu, HardDrive, Battery, Monitor, Package, Tag, Building,
  User, DollarSign, Pencil, MemoryStick, Laptop, Network, X, Save,
} from "lucide-react";

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
  warranty_date: z.string().optional(),
  vendor: z.string().optional(),
  hostname: z.string().optional(),
  ip_address: z.string().optional(),
  mac_address: z.string().optional(),
  os: z.string().max(50).optional(),
  processor: z.string().max(100).optional(),
  ram: z.string().max(20).optional(),
  storage: z.string().max(50).optional(),
  display: z.string().max(50).optional(),
  battery: z.string().max(50).optional(),
});

type DeviceFormData = z.infer<typeof deviceSchema>;

const categories: DeviceCategory[] = ["laptop", "mobile", "tablet", "monitor", "accessories"];
const statuses: DeviceStatus[] = ["available", "borrowed", "maintenance"];

const parseSpecs = (specsJson: string | undefined): Record<string, string> => {
  if (!specsJson) return {};
  try { return JSON.parse(specsJson); } catch { return {}; }
};

const AdminDeviceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useLanguage();
  const { toast } = useToast();

  const deviceId = id ? parseInt(id, 10) : 0;
  const { data: device, isLoading, refetch } = useDevice(deviceId);
  const { data: users = [] } = useUsers();
  const updateDevice = useUpdateDevice();

  const [isEditing, setIsEditing] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const getUserById = (userId: number) => userMap.get(userId);
  const assignedUser = device?.assigned_to_id ? getUserById(device.assigned_to_id) : null;

  const specs = useMemo(() => {
    try { return device?.specs_json ? JSON.parse(device.specs_json) : {}; }
    catch { return {}; }
  }, [device?.specs_json]);

  const form = useForm<DeviceFormData>({
    resolver: zodResolver(deviceSchema) as any,
    defaultValues: {
      name: "", brand: "", model: "", category: "laptop", status: "available",
      asset_tag: "", image_url: "", purchase_price: 0,
      purchase_date: new Date().toISOString().split("T")[0],
      warranty_date: "", vendor: "", hostname: "", ip_address: "", mac_address: "",
      os: "", processor: "", ram: "", storage: "", display: "", battery: "",
    },
  });

  // Check for edit mode from URL
  useEffect(() => {
    const editMode = searchParams.get("edit");
    if (editMode === "true") {
      setIsEditing(true);
      searchParams.delete("edit");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Reset form when device loads or edit mode changes
  useEffect(() => {
    if (device && isEditing) {
      const parsedSpecs = parseSpecs(device.specs_json);
      form.reset({
        name: device.name, brand: device.brand, model: device.model,
        category: device.category as any, status: device.status as any,
        asset_tag: device.asset_tag, image_url: device.image_url || "",
        purchase_price: device.purchase_price || 0,
        purchase_date: device.purchase_date ? format(new Date(device.purchase_date), "yyyy-MM-dd") : "",
        warranty_date: device.warranty_date ? format(new Date(device.warranty_date), "yyyy-MM-dd") : "",
        vendor: device.vendor || "", hostname: device.hostname || "",
        ip_address: device.ip_address || "", mac_address: device.mac_address || "",
        os: parsedSpecs.os || "", processor: parsedSpecs.processor || "",
        ram: parsedSpecs.ram || "", storage: parsedSpecs.storage || "",
        display: parsedSpecs.display || "", battery: parsedSpecs.battery || "",
      });
      setCurrentImageUrl(device.image_url || null);
    }
  }, [device, isEditing, form]);

  const handleStartEdit = () => setIsEditing(true);
  const handleCancelEdit = () => { setIsEditing(false); setCurrentImageUrl(device?.image_url || null); };

  const handleAvatarUploadSuccess = (newUrl: string) => {
    setCurrentImageUrl(newUrl);
    form.setValue("image_url", newUrl);
  };
  const handleAvatarDelete = () => { setCurrentImageUrl(null); form.setValue("image_url", ""); };

  const onSubmit = async (data: DeviceFormData) => {
    if (!device) return;
    try {
      await updateDevice.mutateAsync({
        id: device.id,
        data: {
          name: data.name, brand: data.brand, model: data.model,
          category: data.category as DeviceCategory, status: data.status as DeviceStatus,
          asset_tag: data.asset_tag, image_url: data.image_url || device.image_url,
          purchase_price: data.purchase_price,
          purchase_date: data.purchase_date || undefined,
          specs_json: JSON.stringify({
            os: data.os || "", processor: data.processor || "", ram: data.ram || "",
            storage: data.storage || "", display: data.display || "", battery: data.battery || "",
          }),
        },
      });
      toast({ title: t("common.success"), description: t("inventory.deviceUpdated") });
      setIsEditing(false);
      refetch();
    } catch (error) {
      toast({ title: t("common.error"), description: t("common.errorOccurred"), variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <main className="flex-1 p-8">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">{t("deviceDetail.loading")}</p>
          </div>
        </main>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <main className="flex-1 p-8">
          <div className="text-center py-20">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">{t("deviceDetail.deviceNotFound")}</h1>
            <p className="text-muted-foreground mb-6">{t("deviceDetail.deviceNotFoundDesc")}</p>
            <Button onClick={() => navigate("/admin/inventory")}>
              <ArrowLeft className="h-4 w-4 mr-2" />{t("adminInventory.backToInventory")}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const specItems = [
    { icon: Cpu, label: t("deviceDetail.processor"), value: specs.processor },
    { icon: MemoryStick, label: t("deviceDetail.ram"), value: specs.ram },
    { icon: HardDrive, label: t("deviceDetail.storage"), value: specs.storage },
    { icon: Monitor, label: t("deviceDetail.display"), value: specs.display },
    { icon: Battery, label: t("deviceDetail.battery"), value: specs.battery },
    { icon: Laptop, label: t("deviceDetail.operatingSystemLabel"), value: specs.os },
  ].filter((item) => item.value);

  const supportsNetworkInfo = ["laptop", "mobile", "tablet"].includes(device.category);
  const hasNetworkInfo = supportsNetworkInfo && (device.mac_address || device.ip_address || device.hostname);

  // Edit Mode UI
  if (isEditing) {
    return (
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <main id="main-content" className="flex-1 p-8" tabIndex={-1} role="main">
          <BreadcrumbNav items={[
            { label: t("adminInventory.title"), href: "/admin/inventory" },
            { label: device.name, href: `/admin/inventory/${device.id}` },
            { label: t("common.edit") },
          ]} />

          <div className="flex items-center justify-between mb-6 mt-4">
            <Button variant="ghost" onClick={handleCancelEdit}>
              <X className="h-4 w-4 mr-2" />{t("common.cancel")}
            </Button>
            <Button onClick={form.handleSubmit(onSubmit)} disabled={updateDevice.isPending}>
              <Save className="h-4 w-4 mr-2" />{t("common.save")}
            </Button>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Info Card */}
              <Card>
                <CardHeader><CardTitle className="text-base">{t("deviceDetail.basicInfo")}</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex flex-col items-center gap-3">
                      <AvatarUploader currentAvatarUrl={currentImageUrl} onUploadSuccess={handleAvatarUploadSuccess}
                        onDelete={handleAvatarDelete} entityType="device" entityId={device.id} size="lg" />
                      {/* <p className="text-xs text-muted-foreground">{t("deviceModal.deviceImage")}</p> */}
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>{t("deviceModal.deviceName")} *</FormLabel>
                          <FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="asset_tag" render={({ field }) => (
                        <FormItem><FormLabel>{t("table.assetTag")} *</FormLabel>
                          <FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="brand" render={({ field }) => (
                        <FormItem><FormLabel>{t("table.brand")} *</FormLabel>
                          <FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="model" render={({ field }) => (
                        <FormItem><FormLabel>{t("table.model")} *</FormLabel>
                          <FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="category" render={({ field }) => (
                        <FormItem><FormLabel>{t("table.category")} *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>{categories.map((c) => (
                              <SelectItem key={c} value={c} className="capitalize">{t(`category.${c}`)}</SelectItem>
                            ))}</SelectContent>
                          </Select><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="status" render={({ field }) => (
                        <FormItem><FormLabel>{t("table.status")} *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>{statuses.map((s) => (
                              <SelectItem key={s} value={s} className="capitalize">{t(`status.${s}`)}</SelectItem>
                            ))}</SelectContent>
                          </Select><FormMessage /></FormItem>
                      )} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Purchase Info Card */}
              <Card>
                <CardHeader><CardTitle className="text-base">{t("table.purchaseInfo")}</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <FormField control={form.control} name="purchase_price" render={({ field }) => (
                    <FormItem><FormLabel>{t("table.purchasePrice")} *</FormLabel>
                      <FormControl><Input type="number" step="0.01" min="0" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="purchase_date" render={({ field }) => (
                    <FormItem><FormLabel>{t("table.purchaseDate")} *</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="warranty_date" render={({ field }) => (
                    <FormItem><FormLabel>{t("table.warrantyDate")}</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="vendor" render={({ field }) => (
                    <FormItem><FormLabel>{t("table.vendor")}</FormLabel>
                      <FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </CardContent>
              </Card>

              {/* Network Info Card */}
              {supportsNetworkInfo && (
                <Card>
                  <CardHeader><CardTitle className="text-base">{t("table.networkInfo")}</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="hostname" render={({ field }) => (
                      <FormItem><FormLabel>{t("table.hostname")}</FormLabel>
                        <FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="ip_address" render={({ field }) => (
                      <FormItem><FormLabel>{t("table.ipAddress")}</FormLabel>
                        <FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="mac_address" render={({ field }) => (
                      <FormItem><FormLabel>{t("table.macAddress")}</FormLabel>
                        <FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </CardContent>
                </Card>
              )}

              {/* Specifications Card */}
              <Card>
                <CardHeader><CardTitle className="text-base">{t("inventory.specifications")}</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormField control={form.control} name="processor" render={({ field }) => (
                    <FormItem><FormLabel>{t("deviceDetail.processor")}</FormLabel>
                      <FormControl><Input placeholder={t("deviceModal.enterProcessor")} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="ram" render={({ field }) => (
                    <FormItem><FormLabel>{t("deviceDetail.ram")}</FormLabel>
                      <FormControl><Input placeholder={t("deviceModal.enterRAM")} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="storage" render={({ field }) => (
                    <FormItem><FormLabel>{t("deviceDetail.storage")}</FormLabel>
                      <FormControl><Input placeholder={t("deviceModal.enterStorage")} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="display" render={({ field }) => (
                    <FormItem><FormLabel>{t("deviceDetail.display")}</FormLabel>
                      <FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="battery" render={({ field }) => (
                    <FormItem><FormLabel>{t("deviceDetail.battery")}</FormLabel>
                      <FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="os" render={({ field }) => (
                    <FormItem><FormLabel>{t("deviceDetail.operatingSystemLabel")}</FormLabel>
                      <FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </CardContent>
              </Card>
            </form>
          </Form>
        </main>
      </div>
    );
  }

  // View Mode UI
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main id="main-content" className="flex-1 p-8" tabIndex={-1} role="main" aria-label="Device details">
        <BreadcrumbNav items={[
          { label: t("adminInventory.title"), href: "/admin/inventory" },
          { label: device.name },
        ]} />

        <div className="flex items-center justify-between mb-6 mt-4">
          <Button variant="ghost" onClick={() => navigate("/admin/inventory")}>
            <ArrowLeft className="h-4 w-4 mr-2" />{t("adminInventory.backToInventory")}
          </Button>
          <Button onClick={handleStartEdit}>
            <Pencil className="h-4 w-4 mr-2" />{t("common.edit")}
          </Button>
        </div>

        {/* Header Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="relative w-full md:w-64 h-48 rounded-xl overflow-hidden bg-muted shrink-0">
                <img src={getDeviceImageUrl(device.image_url, device.category)} alt={device.name} className="object-cover w-full h-full" />
                <div className="absolute top-3 left-3"><StatusBadge status={device.status} /></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{getCategoryIcon(device.category)}</span>
                  <Badge variant="secondary" className="capitalize">{device.category}</Badge>
                </div>
                <h1 className="text-2xl font-bold mb-1">{device.name}</h1>
                <p className="text-lg text-muted-foreground mb-3">{device.brand} • {device.model}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Tag className="h-4 w-4" /><span className="font-mono">{device.asset_tag}</span>
                </div>
                <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
                  <div><p className="text-xs text-muted-foreground">{t("table.status")}</p><StatusBadge status={device.status} className="mt-1" /></div>
                  <div><p className="text-xs text-muted-foreground">{t("table.assignedTo")}</p><p className="font-medium text-sm mt-1">{assignedUser?.name || device.assigned_to_name || "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground">{t("table.department")}</p><p className="font-medium text-sm mt-1">{device.department_name || "—"}</p></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {specItems.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Cpu className="h-4 w-4" />{t("inventory.specifications")}</CardTitle></CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {specItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="p-2 bg-background rounded-md"><item.icon className="h-4 w-4 text-muted-foreground" /></div>
                      <div className="min-w-0 flex-1"><p className="text-xs text-muted-foreground">{item.label}</p><p className="font-medium text-sm truncate">{item.value}</p></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4" />{t("table.purchaseInfo")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{t("table.purchasePrice")}</span><span className="font-semibold">${device.purchase_price?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "—"}</span></div>
              <Separator />
              <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{t("table.purchaseDate")}</span><span className="font-medium">{device.purchase_date ? format(new Date(device.purchase_date), "MMM d, yyyy") : "—"}</span></div>
              <Separator />
              <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{t("table.warrantyDate")}</span><span className="font-medium">{device.warranty_date ? format(new Date(device.warranty_date), "MMM d, yyyy") : "—"}</span></div>
              <Separator />
              <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{t("table.vendor")}</span><span className="font-medium">{device.vendor || "—"}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" />{t("table.assignment")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{t("table.assignedTo")}</span><span className="font-medium">{assignedUser?.name || device.assigned_to_name || "—"}</span></div>
              <Separator />
              <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{t("table.department")}</span><span className="font-medium">{device.department_name || "—"}</span></div>
            </CardContent>
          </Card>

          {hasNetworkInfo && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Network className="h-4 w-4" />{t("table.networkInfo")}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {device.hostname && (<><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{t("table.hostname")}</span><span className="font-mono text-sm">{device.hostname}</span></div><Separator /></>)}
                {device.ip_address && (<><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{t("table.ipAddress")}</span><span className="font-mono text-sm">{device.ip_address}</span></div><Separator /></>)}
                {device.mac_address && (<div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{t("table.macAddress")}</span><span className="font-mono text-sm">{device.mac_address}</span></div>)}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Building className="h-4 w-4" />{t("table.details")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{t("table.brand")}</span><span className="font-medium">{device.brand}</span></div>
              <Separator />
              <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{t("table.model")}</span><span className="font-medium">{device.model}</span></div>
              <Separator />
              <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{t("table.category")}</span><Badge variant="outline" className="capitalize">{device.category}</Badge></div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDeviceDetail;
