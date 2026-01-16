import React, { memo } from "react";
import { cn } from "@/lib/utils";
import type { DeviceStatus, RequestStatus } from "@/types/api";

interface StatusBadgeProps {
  status: DeviceStatus | RequestStatus;
  className?: string;
}

const statusConfig: Record<DeviceStatus | RequestStatus, { label: string; className: string }> = {
  available: { label: "Available", className: "bg-status-available text-status-available-foreground" },
  inuse: { label: "In Use", className: "bg-status-inuse text-status-inuse-foreground" },
  maintenance: { label: "Maintenance", className: "bg-status-maintenance text-status-maintenance-foreground" },
  updating: { label: "Updating", className: "bg-status-maintenance text-status-maintenance-foreground" },
  storage: { label: "Storage", className: "bg-muted text-muted-foreground" },
  discard: { label: "Discard", className: "bg-destructive text-destructive-foreground" },
  transferred: { label: "Transferred", className: "bg-blue-500 text-white" },
  pending: { label: "Pending", className: "bg-yellow-500 text-white" },
  approved: { label: "Approved", className: "bg-blue-500 text-white" },
  active: { label: "Active", className: "bg-status-available text-status-available-foreground" },
  returned: { label: "Returned", className: "bg-muted text-muted-foreground" },
  rejected: { label: "Rejected", className: "bg-destructive text-destructive-foreground" },
};

export const StatusBadge: React.FC<StatusBadgeProps> = memo(({ status, className }) => {
  const config = statusConfig[status];
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", config.className, className)}>
      {config.label}
    </span>
  );
});
