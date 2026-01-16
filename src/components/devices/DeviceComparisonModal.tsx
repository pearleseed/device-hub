import React from "react";
import type { DeviceWithDepartment } from "@/types/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Check } from "lucide-react";
import { cn, getDeviceThumbnailUrl } from "@/lib/utils";

interface DeviceComparisonModalProps {
  devices: DeviceWithDepartment[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRemoveDevice: (deviceId: number) => void;
}

interface SpecRow {
  label: string;
  key: string;
  type: "spec" | "main" | "status";
}

const specRows: SpecRow[] = [
  { label: "Status", key: "status", type: "status" },
  { label: "Brand", key: "brand", type: "main" },
  { label: "Model", key: "model", type: "main" },
  { label: "Category", key: "category", type: "main" },
  { label: "Operating System", key: "os", type: "spec" },
  { label: "Processor", key: "processor", type: "spec" },
  { label: "RAM", key: "ram", type: "spec" },
  { label: "Storage", key: "storage", type: "spec" },
];

// Helper to parse specs from JSON string
const parseSpecs = (specsJson: any): Record<string, string> => {
  if (!specsJson) return {};
  if (typeof specsJson === 'object') return specsJson as Record<string, string>;
  try {
    return JSON.parse(specsJson);
  } catch {
    return {};
  }
};

export const DeviceComparisonModal: React.FC<DeviceComparisonModalProps> = ({
  devices,
  open,
  onOpenChange,
  onRemoveDevice,
}) => {
  const getValue = (
    device: DeviceWithDepartment,
    row: SpecRow,
  ): string | React.ReactNode => {
    if (row.type === "status") {
      return <StatusBadge status={device.status} />;
    }
    if (row.type === "main") {
      return (device as unknown as Record<string, unknown>)[row.key] as string;
    }
    const specs = parseSpecs(device.specs_json);
    return specs[row.key] || "—";
  };

  const compareValues = (values: (string | undefined)[]): boolean[] => {
    const nonEmpty = values.filter((v) => v && v !== "—");
    if (nonEmpty.length <= 1) return values.map(() => false);

    const best = nonEmpty.sort((a, b) => {
      // Try to compare numerically for RAM/Storage
      const aNum = parseInt(a || "0");
      const bNum = parseInt(b || "0");
      if (!isNaN(aNum) && !isNaN(bNum)) return bNum - aNum;
      return 0;
    })[0];

    return values.map((v) => v === best && nonEmpty.length > 1);
  };

  if (devices.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Compare Devices ({devices.length})</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="min-w-[600px]">
            {/* Device Headers */}
            <div
              className="grid gap-4 mb-6"
              style={{
                gridTemplateColumns: `150px repeat(${devices.length}, 1fr)`,
              }}
            >
              <div /> {/* Empty cell for labels column */}
              {devices.map((device) => (
                <div key={device.id} className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-muted hover:bg-destructive hover:text-destructive-foreground z-10"
                    onClick={() => onRemoveDevice(device.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <div className="aspect-video rounded-lg overflow-hidden bg-muted mb-3">
                    <img
                      src={getDeviceThumbnailUrl(
                        device.image_thumbnail_url,
                        device.image_url,
                        device.category,
                      )}
                      alt={device.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h4 className="font-semibold text-sm truncate">
                    {device.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {device.asset_tag}
                  </p>
                </div>
              ))}
            </div>

            {/* Comparison Table */}
            <div className="border rounded-lg overflow-hidden">
              {specRows.map((row, rowIndex) => {
                const values = devices.map((d) => {
                  if (row.type === "main") {
                    return (d as unknown as Record<string, unknown>)[
                      row.key
                    ] as string;
                  }
                  if (row.type === "spec") {
                    const specs = parseSpecs(d.specs_json);
                    return specs[row.key];
                  }
                  return "";
                });
                const highlights =
                  row.key === "ram" || row.key === "storage"
                    ? compareValues(values)
                    : values.map(() => false);

                return (
                  <div
                    key={row.key}
                    className={cn(
                      "grid gap-4 p-3 text-sm",
                      rowIndex % 2 === 0 ? "bg-muted/50" : "bg-background",
                    )}
                    style={{
                      gridTemplateColumns: `150px repeat(${devices.length}, 1fr)`,
                    }}
                  >
                    <div className="font-medium text-muted-foreground">
                      {row.label}
                    </div>
                    {devices.map((device, deviceIndex) => (
                      <div
                        key={device.id}
                        className={cn(
                          "flex items-center gap-2",
                          highlights[deviceIndex] && "text-primary font-medium",
                        )}
                      >
                        {highlights[deviceIndex] && (
                          <Check className="h-4 w-4 text-green-500 shrink-0" />
                        )}
                        {getValue(device, row)}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Availability Comparison */}
            <div className="mt-6 p-4 rounded-lg bg-muted/50">
              <h4 className="font-semibold mb-3">Availability</h4>
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: `repeat(${devices.length}, 1fr)`,
                }}
              >
                {devices.map((device) => (
                  <div key={device.id} className="text-center">
                    <StatusBadge status={device.status} />
                    <p className="text-xs text-muted-foreground mt-2">
                      {device.status === "available"
                        ? "Ready to borrow"
                        : device.status === "inuse"
                          ? "Currently in use"
                          : "Under maintenance"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
