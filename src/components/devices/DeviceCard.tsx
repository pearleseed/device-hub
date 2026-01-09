import React from "react";
import type { Device } from "@/lib/mockData";
import { getCategoryIcon } from "@/lib/mockData";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Heart, Zap } from "lucide-react";

interface DeviceCardProps {
  device: Device;
  onClick?: (device: Device) => void;
  onQuickRequest?: (device: Device) => void;
  onFavoriteToggle?: (deviceId: string) => void;
  isFavorite?: boolean;
  className?: string;
  showQuickRequest?: boolean;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  onClick,
  onQuickRequest,
  onFavoriteToggle,
  isFavorite = false,
  className,
  showQuickRequest = true,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.(device);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavoriteToggle?.(device.id);
  };

  const handleQuickRequest = (e: React.MouseEvent) => {
    e.stopPropagation();
    onQuickRequest?.(device);
  };

  return (
    <Card
      className={cn(
        "overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-medium hover:-translate-y-1 group",
        "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary",
        className,
      )}
      onClick={() => onClick?.(device)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${device.name} by ${device.brand}, status: ${device.status}`}
    >
      <div className="aspect-4/3 relative overflow-hidden bg-muted">
        <img
          src={device.image}
          alt={`${device.name} - ${device.brand} ${device.model}`}
          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-3 left-3">
          <StatusBadge status={device.status} />
        </div>

        {/* Favorite Button */}
        {onFavoriteToggle && (
          <button
            onClick={handleFavoriteClick}
            className={cn(
              "absolute top-3 right-3 h-8 w-8 rounded-full flex items-center justify-center transition-all",
              "bg-background/80 backdrop-blur-sm hover:bg-background shadow-sm",
              isFavorite && "text-red-500",
            )}
            aria-label={
              isFavorite ? "Remove from favorites" : "Add to favorites"
            }
          >
            <Heart
              className={cn(
                "h-4 w-4 transition-all",
                isFavorite ? "fill-current scale-110" : "group-hover:scale-110",
              )}
            />
          </button>
        )}

        {/* Quick Request Button - shows on hover for available devices */}
        {showQuickRequest &&
          device.status === "available" &&
          onQuickRequest && (
            <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                className="w-full gap-1.5 shadow-lg"
                onClick={handleQuickRequest}
              >
                <Zap className="h-3.5 w-3.5" />
                Quick Request
              </Button>
            </div>
          )}
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg" aria-hidden="true">
                {getCategoryIcon(device.category)}
              </span>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                {device.category}
              </span>
            </div>
            <h3 className="font-semibold text-foreground truncate">
              {device.name}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {device.brand} • {device.model}
            </p>
          </div>
        </div>

        {/* Quick Specs */}
        <div
          className="mt-3 flex flex-wrap gap-2"
          aria-label="Device specifications"
        >
          {device.specs.os && (
            <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-md">
              {device.specs.os}
            </span>
          )}
          {device.specs.ram && (
            <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-md">
              {device.specs.ram}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
