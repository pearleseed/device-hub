import React from "react";
import { getCategoryIcon } from "@/lib/types";
import type { DeviceCategory, DeviceStatus } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Scale, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface DeviceCardProps {
  device: Device;
  viewMode?: "grid" | "list";
  onClick?: () => void;
  onCompare?: (e: React.MouseEvent) => void;
  isComparing?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  viewMode = "grid",
  onClick,
  onCompare,
  isComparing,
  isFavorite,
  onToggleFavorite,
}) => {
  const statusColors: Record<DeviceStatus, string> = {
    available: "bg-status-available text-status-available-foreground",
    borrowed: "bg-status-borrowed text-status-borrowed-foreground",
    maintenance: "bg-status-maintenance text-status-maintenance-foreground",
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.();
  };

  if (viewMode === "list") {
    return (
      <Card
        className={cn(
          "cursor-pointer hover:shadow-md transition-all duration-200",
          isComparing && "ring-2 ring-primary",
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              <img
                src={device.image}
                alt={device.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">
                  {getCategoryIcon(device.category)}
                </span>
                <h3 className="font-semibold truncate">{device.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {device.brand} • {device.model}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {device.assetTag}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={statusColors[device.status]}>
                {device.status}
              </Badge>
              {onToggleFavorite && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleFavoriteClick}
                >
                  <Heart
                    className={cn(
                      "h-4 w-4",
                      isFavorite && "fill-red-500 text-red-500",
                    )}
                  />
                </Button>
              )}
              {onCompare && (
                <Button
                  variant={isComparing ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={onCompare}
                >
                  <Scale className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "group cursor-pointer hover:shadow-lg transition-all duration-200 overflow-hidden",
        isComparing && "ring-2 ring-primary",
      )}
      onClick={onClick}
    >
      <div className="relative aspect-[4/3] bg-muted">
        <img
          src={device.image}
          alt={device.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <Badge
          className={cn("absolute top-3 right-3", statusColors[device.status])}
        >
          {device.status}
        </Badge>
        <div className="absolute top-3 left-3 flex gap-1">
          {onToggleFavorite && (
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleFavoriteClick}
            >
              <Heart
                className={cn(
                  "h-4 w-4",
                  isFavorite && "fill-red-500 text-red-500",
                )}
              />
            </Button>
          )}
          {onCompare && (
            <Button
              variant={isComparing ? "default" : "secondary"}
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={onCompare}
            >
              <Scale className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">{getCategoryIcon(device.category)}</span>
          <h3 className="font-semibold truncate">{device.name}</h3>
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {device.brand} • {device.model}
        </p>
        <p className="text-xs text-muted-foreground mt-2">{device.assetTag}</p>
      </CardContent>
    </Card>
  );
};
