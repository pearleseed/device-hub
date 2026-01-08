import React from "react";
import type { DeviceCategory, DeviceStatus } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// Legacy Device interface for backward compatibility
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

interface DeviceComparisonModalProps {
  devices: Device[];
  open: boolean;
  onClose: () => void;
}

export const DeviceComparisonModal: React.FC<DeviceComparisonModalProps> = ({
  devices,
  open,
  onClose,
}) => {
  const statusColors: Record<DeviceStatus, string> = {
    available: "bg-status-available text-status-available-foreground",
    borrowed: "bg-status-borrowed text-status-borrowed-foreground",
    maintenance: "bg-status-maintenance text-status-maintenance-foreground",
  };

  // Get all unique spec keys across all devices
  const allSpecs = Array.from(
    new Set(devices.flatMap((d) => Object.keys(d.specs))),
  );

  const specLabels: Record<string, string> = {
    os: "Operating System",
    processor: "Processor",
    ram: "RAM",
    storage: "Storage",
    display: "Display",
    battery: "Battery",
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Device Comparison</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-3 bg-muted font-medium w-1/4">
                    Feature
                  </th>
                  {devices.map((device) => (
                    <th key={device.id} className="p-3 bg-muted">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-background">
                          <img
                            src={device.image}
                            alt={device.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="font-semibold text-sm text-center">
                          {device.name}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-3 font-medium">Status</td>
                  {devices.map((device) => (
                    <td key={device.id} className="p-3 text-center">
                      <Badge className={statusColors[device.status]}>
                        {device.status}
                      </Badge>
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-medium">Brand</td>
                  {devices.map((device) => (
                    <td key={device.id} className="p-3 text-center">
                      {device.brand}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-medium">Model</td>
                  {devices.map((device) => (
                    <td key={device.id} className="p-3 text-center">
                      {device.model}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-medium">Category</td>
                  {devices.map((device) => (
                    <td key={device.id} className="p-3 text-center capitalize">
                      {device.category}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-medium">Asset Tag</td>
                  {devices.map((device) => (
                    <td
                      key={device.id}
                      className="p-3 text-center font-mono text-sm"
                    >
                      {device.assetTag}
                    </td>
                  ))}
                </tr>
                {allSpecs.map((spec) => (
                  <tr key={spec} className="border-b">
                    <td className="p-3 font-medium">
                      {specLabels[spec] || spec}
                    </td>
                    {devices.map((device) => (
                      <td key={device.id} className="p-3 text-center text-sm">
                        {device.specs[spec] || "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
