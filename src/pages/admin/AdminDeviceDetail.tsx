import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useDevice, useUsers } from "@/hooks/use-api-queries";
import { getDeviceImageUrl } from "@/lib/utils";
import { getCategoryIcon } from "@/lib/constants";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  ArrowLeft,
  Cpu,
  HardDrive,
  Battery,
  Monitor,
  Package,
  Tag,
  Building,
  User,
  DollarSign,
  Calendar,
  Pencil,
  MemoryStick,
  Laptop,
  Network,
  Globe,
  Server,
  Shield,
  Store,
} from "lucide-react";

const AdminDeviceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const deviceId = id ? parseInt(id, 10) : 0;
  const { data: device, isLoading } = useDevice(deviceId);
  const { data: users = [] } = useUsers();

  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const getUserById = (userId: number) => userMap.get(userId);

  const assignedUser = device?.assigned_to_id
    ? getUserById(device.assigned_to_id)
    : null;

  const specs = useMemo(() => {
    try {
      return device?.specs_json ? JSON.parse(device.specs_json) : {};
    } catch {
      return {};
    }
  }, [device?.specs_json]);

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
            <h1 className="text-2xl font-bold mb-2">
              {t("deviceDetail.deviceNotFound")}
            </h1>
            <p className="text-muted-foreground mb-6">
              {t("deviceDetail.deviceNotFoundDesc")}
            </p>
            <Button onClick={() => navigate("/admin/inventory")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("adminInventory.backToInventory")}
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
    {
      icon: Laptop,
      label: t("deviceDetail.operatingSystemLabel"),
      value: specs.os,
    },
  ].filter((item) => item.value);

  // Check if device category supports network info (laptop, mobile, tablet)
  const supportsNetworkInfo = ["laptop", "mobile", "tablet"].includes(
    device.category
  );

  const hasNetworkInfo =
    supportsNetworkInfo &&
    (device.mac_address || device.ip_address || device.hostname);

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main
        id="main-content"
        className="flex-1 p-8"
        tabIndex={-1}
        role="main"
        aria-label="Device details"
      >
        <BreadcrumbNav
          items={[
            { label: t("adminInventory.title"), href: "/admin/inventory" },
            { label: device.name },
          ]}
        />

        {/* Back Button & Actions */}
        <div className="flex items-center justify-between mb-6 mt-4">
          <Button variant="ghost" onClick={() => navigate("/admin/inventory")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("adminInventory.backToInventory")}
          </Button>
          <Button
            onClick={() => navigate(`/admin/inventory?edit=${device.id}`)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            {t("common.edit")}
          </Button>
        </div>

        {/* Header Card with Image and Basic Info */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Device Image - Smaller */}
              <div className="relative w-full md:w-64 h-48 rounded-xl overflow-hidden bg-muted shrink-0">
                <img
                  src={getDeviceImageUrl(device.image_url, device.category)}
                  alt={device.name}
                  className="object-cover w-full h-full"
                />
                <div className="absolute top-3 left-3">
                  <StatusBadge status={device.status} />
                </div>
              </div>

              {/* Device Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">
                    {getCategoryIcon(device.category)}
                  </span>
                  <Badge variant="secondary" className="capitalize">
                    {device.category}
                  </Badge>
                </div>
                <h1 className="text-2xl font-bold mb-1">{device.name}</h1>
                <p className="text-lg text-muted-foreground mb-3">
                  {device.brand} • {device.model}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Tag className="h-4 w-4" />
                  <span className="font-mono">{device.asset_tag}</span>
                </div>

                {/* Quick Stats */}
                <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t("table.status")}
                    </p>
                    <StatusBadge status={device.status} className="mt-1" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t("table.assignedTo")}
                    </p>
                    <p className="font-medium text-sm mt-1">
                      {assignedUser?.name || device.assigned_to_name || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t("table.department")}
                    </p>
                    <p className="font-medium text-sm mt-1">
                      {device.department_name || "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Specifications Card */}
          {specItems.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Cpu className="h-4 w-4" />
                  {t("inventory.specifications")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {specItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="p-2 bg-background rounded-md">
                        <item.icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">
                          {item.label}
                        </p>
                        <p className="font-medium text-sm truncate">
                          {item.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Purchase Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                {t("table.purchaseInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("table.purchasePrice")}
                </span>
                <span className="font-semibold">
                  $
                  {device.purchase_price?.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }) || "—"}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("table.purchaseDate")}
                </span>
                <span className="font-medium">
                  {device.purchase_date
                    ? format(new Date(device.purchase_date), "MMM d, yyyy")
                    : "—"}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("table.warrantyDate")}
                </span>
                <span className="font-medium">
                  {device.warranty_date
                    ? format(new Date(device.warranty_date), "MMM d, yyyy")
                    : "—"}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("table.vendor")}
                </span>
                <span className="font-medium">{device.vendor || "—"}</span>
              </div>
            </CardContent>
          </Card>

          {/* Assignment Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                {t("table.assignment")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("table.assignedTo")}
                </span>
                <span className="font-medium">
                  {assignedUser?.name || device.assigned_to_name || "—"}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("table.department")}
                </span>
                <span className="font-medium">
                  {device.department_name || "—"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Network Info Card - Only for compatible devices */}
          {hasNetworkInfo && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Network className="h-4 w-4" />
                  {t("table.networkInfo")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {device.hostname && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {t("table.hostname")}
                      </span>
                      <span className="font-mono text-sm">
                        {device.hostname}
                      </span>
                    </div>
                    <Separator />
                  </>
                )}
                {device.ip_address && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {t("table.ipAddress")}
                      </span>
                      <span className="font-mono text-sm">
                        {device.ip_address}
                      </span>
                    </div>
                    <Separator />
                  </>
                )}
                {device.mac_address && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {t("table.macAddress")}
                    </span>
                    <span className="font-mono text-sm">
                      {device.mac_address}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Device Details Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building className="h-4 w-4" />
                {t("table.details")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("table.brand")}
                </span>
                <span className="font-medium">{device.brand}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("table.model")}
                </span>
                <span className="font-medium">{device.model}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("table.category")}
                </span>
                <Badge variant="outline" className="capitalize">
                  {device.category}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDeviceDetail;
