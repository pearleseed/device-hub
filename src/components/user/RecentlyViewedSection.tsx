import React from "react";
import { Link } from "react-router-dom";
import type { Device } from "@/lib/mockData";
import { getDeviceById } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Eye, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecentlyViewedSectionProps {
  deviceIds: string[];
  onClear: () => void;
  onDeviceClick?: (device: Device) => void;
  className?: string;
}

export const RecentlyViewedSection: React.FC<RecentlyViewedSectionProps> = ({
  deviceIds,
  onClear,
  onDeviceClick,
  className,
}) => {
  const devices = deviceIds
    .map((id) => getDeviceById(id))
    .filter((d): d is Device => d !== undefined);

  if (devices.length === 0) return null;

  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Recently Viewed</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-muted-foreground hover:text-foreground h-8"
        >
          <X className="h-3 w-3 mr-1" />
          Clear
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-thin">
          {devices.map((device) => (
            <div
              key={device.id}
              className="shrink-0 w-36 cursor-pointer group"
              onClick={() => onDeviceClick?.(device)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onDeviceClick?.(device);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`View ${device.name}`}
            >
              <div className="aspect-4/3 rounded-lg overflow-hidden bg-muted mb-2 relative">
                <img
                  src={device.image}
                  alt={device.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute top-2 left-2">
                  <StatusBadge
                    status={device.status}
                    className="scale-75 origin-top-left"
                  />
                </div>
              </div>
              <h4 className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                {device.name}
              </h4>
              <p className="text-xs text-muted-foreground truncate">
                {device.brand}
              </p>
            </div>
          ))}
        </div>

        <Button asChild variant="ghost" size="sm" className="mt-3 w-full">
          <Link to="/catalog">
            Browse Full Catalog
            <ArrowRight className="h-3 w-3 ml-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};
