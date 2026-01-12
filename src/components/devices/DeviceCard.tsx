import React, { useState } from "react";
import type { DeviceWithDepartment, DeviceCategory } from "@/types/api";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, getDeviceImageUrl } from "@/lib/utils";
import { Heart, Zap, ImageOff } from "lucide-react";

// Category icon mapping
const getCategoryIcon = (category: DeviceCategory): string => {
  const icons: Record<DeviceCategory, string> = {
    laptop: "💻",
    mobile: "📱",
    tablet: "📲",
    monitor: "🖥️",
    accessories: "🎧",
    storage: "💾",
    ram: "🧠",
  };
  return icons[category];
};

// Device specs interface for parsed specs_json
interface DeviceSpecs {
  os?: string;
  processor?: string;
  ram?: string;
  storage?: string;
  display?: string;
  battery?: string;
  capacity?: string;
  speed?: string;
  type?: string;
  busSpeed?: string;
  interface?: string;
  formFactor?: string;
  latency?: string;
  voltage?: string;
}

// Helper function to parse specs_json safely
const parseSpecs = (specsJson: string | undefined | null): DeviceSpecs => {
  if (!specsJson) return {};
  try {
    return JSON.parse(specsJson) as DeviceSpecs;
  } catch {
    return {};
  }
};

// Helper function to get category-specific specs display
const getCategorySpecsDisplay = (
  device: DeviceWithDepartment,
): { label: string; value: string }[] => {
  const specs: { label: string; value: string }[] = [];
  const parsedSpecs = parseSpecs(device.specs_json);

  switch (device.category) {
    case "storage":
      if (parsedSpecs.capacity)
        specs.push({ label: "Capacity", value: parsedSpecs.capacity });
      if (parsedSpecs.speed)
        specs.push({ label: "Speed", value: parsedSpecs.speed });
      if (parsedSpecs.type)
        specs.push({ label: "Type", value: parsedSpecs.type });
      break;
    case "ram":
      if (parsedSpecs.capacity)
        specs.push({ label: "Capacity", value: parsedSpecs.capacity });
      if (parsedSpecs.busSpeed)
        specs.push({ label: "Bus Speed", value: parsedSpecs.busSpeed });
      if (parsedSpecs.type)
        specs.push({ label: "Type", value: parsedSpecs.type });
      break;
    case "laptop":
    case "tablet":
      if (parsedSpecs.processor)
        specs.push({ label: "CPU", value: parsedSpecs.processor });
      if (parsedSpecs.ram) specs.push({ label: "RAM", value: parsedSpecs.ram });
      if (parsedSpecs.storage)
        specs.push({ label: "Storage", value: parsedSpecs.storage });
      break;
    case "mobile":
      if (parsedSpecs.processor)
        specs.push({ label: "CPU", value: parsedSpecs.processor });
      if (parsedSpecs.ram) specs.push({ label: "RAM", value: parsedSpecs.ram });
      if (parsedSpecs.storage)
        specs.push({ label: "Storage", value: parsedSpecs.storage });
      break;
    case "monitor":
      if (parsedSpecs.display)
        specs.push({ label: "Display", value: parsedSpecs.display });
      break;
    default:
      // For accessories and other categories, show generic specs
      if (parsedSpecs.os) specs.push({ label: "OS", value: parsedSpecs.os });
      if (parsedSpecs.ram) specs.push({ label: "RAM", value: parsedSpecs.ram });
  }

  return specs.slice(0, 3); // Limit to 3 specs for card display
};

interface DeviceCardProps {
  device: DeviceWithDepartment;
  onClick?: (device: DeviceWithDepartment) => void;
  onQuickRequest?: (device: DeviceWithDepartment) => void;
  onFavoriteToggle?: (deviceId: number) => void;
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
  const [imageError, setImageError] = useState(false);

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

  const handleImageError = () => {
    setImageError(true);
  };

  // Get the appropriate image URL with fallback to category placeholder
  const imageUrl = imageError
    ? getDeviceImageUrl(null, device.category)
    : getDeviceImageUrl(device.image_url, device.category);

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
          src={imageUrl}
          alt=""
          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          onError={handleImageError}
          aria-hidden="true"
        />
        {imageError && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-muted/80"
            aria-hidden="true"
          >
            <ImageOff className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
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
              "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              isFavorite && "text-red-500",
            )}
            aria-label={
              isFavorite ? "Remove from favorites" : "Add to favorites"
            }
            aria-pressed={isFavorite}
          >
            <Heart
              className={cn(
                "h-4 w-4 transition-all",
                isFavorite ? "fill-current scale-110" : "group-hover:scale-110",
              )}
              aria-hidden="true"
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
                aria-label={`Quick request ${device.name}`}
              >
                <Zap className="h-3.5 w-3.5" aria-hidden="true" />
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

        {/* Quick Specs - Category Specific */}
        <div
          className="mt-3 flex flex-wrap gap-2"
          aria-label="Device specifications"
        >
          {getCategorySpecsDisplay(device).map((spec, index) => (
            <span
              key={index}
              className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-md"
              title={spec.label}
            >
              {spec.value}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
