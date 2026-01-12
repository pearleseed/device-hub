import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Separator } from "@/components/ui/separator";
import type { DeviceWithDepartment } from "@/types/api";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Cpu,
  HardDrive,
  Monitor,
  Battery,
  Calendar,
  DollarSign,
  Tag,
  Building,
  User,
} from "lucide-react";

interface DeviceDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: DeviceWithDepartment | null;
}

interface SpecItem {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

export const DeviceDetailModal: React.FC<DeviceDetailModalProps> = ({
  open,
  onOpenChange,
  device,
}) => {
  const { t } = useLanguage();

  if (!device) return null;

  // Parse specs_json
  let specs: Record<string, string> = {};
  try {
    if (device.specs_json) {
      specs =
        typeof device.specs_json === "string"
          ? JSON.parse(device.specs_json)
          : device.specs_json;
    }
  } catch {
    specs = {};
  }

  const specIcons: Record<string, React.ReactNode> = {
    processor: <Cpu className="h-4 w-4" />,
    ram: <HardDrive className="h-4 w-4" />,
    storage: <HardDrive className="h-4 w-4" />,
    display: <Monitor className="h-4 w-4" />,
    battery: <Battery className="h-4 w-4" />,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>{device.name}</span>
            <StatusBadge status={device.status} />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Device Image */}
          {device.image_url && (
            <div className="w-full h-48 rounded-lg overflow-hidden bg-muted">
              <img
                src={device.image_url}
                alt={device.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Tag className="h-4 w-4" />
                {t("table.assetTag") || "Asset Tag"}
              </p>
              <p className="font-mono font-medium">{device.asset_tag}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Building className="h-4 w-4" />
                {t("table.category") || "Category"}
              </p>
              <Badge variant="outline" className="capitalize">
                {device.category}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                {t("table.brand") || "Brand"}
              </p>
              <p className="font-medium">{device.brand}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                {t("table.model") || "Model"}
              </p>
              <p className="font-medium">{device.model}</p>
            </div>
          </div>

          <Separator />

          {/* Assignment Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                {t("table.assignedTo") || "Assigned To"}
              </p>
              <p className="font-medium">{device.assigned_to_name || "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Building className="h-4 w-4" />
                {t("table.department") || "Department"}
              </p>
              <p className="font-medium">{device.department_name || "—"}</p>
            </div>
          </div>

          <Separator />

          {/* Purchase Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                {t("table.purchasePrice") || "Purchase Price"}
              </p>
              <p className="font-medium">
                $
                {device.purchase_price?.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }) || "—"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {t("table.purchaseDate") || "Purchase Date"}
              </p>
              <p className="font-medium">
                {device.purchase_date
                  ? format(new Date(device.purchase_date), "MMM d, yyyy")
                  : "—"}
              </p>
            </div>
          </div>

          {/* Specifications */}
          {Object.keys(specs).length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-4">
                  {t("inventory.specifications") || "Specifications"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(specs).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-2 capitalize">
                        {specIcons[key.toLowerCase()] || null}
                        {key.replace(/_/g, " ")}
                      </p>
                      <p className="font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
