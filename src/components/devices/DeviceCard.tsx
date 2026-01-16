import React, { useState, memo, useCallback, useMemo } from "react";
import type { DeviceWithDepartment, DeviceCategory } from "@/types/api";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, getDeviceImageUrl } from "@/lib/utils";
import { Heart, Zap, ImageOff } from "lucide-react";

const CATEGORY_ICONS: Record<DeviceCategory, string> = {
  laptop: "💻", mobile: "📱", tablet: "📲", monitor: "🖥️",
  accessories: "🎧", storage: "💾", ram: "🧠",
};

interface DeviceSpecs {
  os?: string; processor?: string; ram?: string; storage?: string;
  display?: string; battery?: string; capacity?: string; speed?: string;
  type?: string; busSpeed?: string; interface?: string; formFactor?: string;
  latency?: string; voltage?: string;
}

const parseSpecs = (specsJson: string | Record<string, string> | undefined | null): DeviceSpecs => {
  if (!specsJson) return {};
  if (typeof specsJson !== "string") return specsJson as DeviceSpecs;
  try { return JSON.parse(specsJson) as DeviceSpecs; } catch { return {}; }
};

const getCategorySpecsDisplay = (device: DeviceWithDepartment): { label: string; value: string }[] => {
  const specs = parseSpecs(device.specs_json);
  const result: { label: string; value: string }[] = [];
  
  const addSpec = (label: string, value?: string) => value && result.push({ label, value });
  
  switch (device.category) {
    case "storage":
      addSpec("Capacity", specs.capacity); addSpec("Speed", specs.speed); addSpec("Type", specs.type);
      break;
    case "ram":
      addSpec("Capacity", specs.capacity); addSpec("Bus Speed", specs.busSpeed); addSpec("Type", specs.type);
      break;
    case "laptop": case "tablet": case "mobile":
      addSpec("CPU", specs.processor); addSpec("RAM", specs.ram); addSpec("Storage", specs.storage);
      break;
    case "monitor":
      addSpec("Display", specs.display);
      break;
    default:
      addSpec("OS", specs.os); addSpec("RAM", specs.ram);
  }
  return result.slice(0, 3);
};

interface DeviceCardProps {
  device: DeviceWithDepartment;
  onClick?: (device: DeviceWithDepartment) => void;
  onQuickRequest?: (device: DeviceWithDepartment) => void;
  onFavoriteToggle?: (deviceId: number) => void;
  isFavorite?: boolean;
  className?: string;
  showQuickRequest?: boolean;
  /** Override device status for display (e.g., when device has pending request) */
  effectiveStatus?: DeviceWithDepartment["status"] | "pending";
}

export const DeviceCard: React.FC<DeviceCardProps> = memo(({
  device, onClick, onQuickRequest, onFavoriteToggle,
  isFavorite = false, className, showQuickRequest = true,
  effectiveStatus,
}) => {
  const [imageError, setImageError] = useState(false);
  
  // Use effective status if provided, otherwise use device status
  const displayStatus = effectiveStatus ?? device.status;

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick?.(device); }
  }, [onClick, device]);

  const handleFavoriteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); onFavoriteToggle?.(device.id);
  }, [onFavoriteToggle, device.id]);

  const handleQuickRequest = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); onQuickRequest?.(device);
  }, [onQuickRequest, device]);

  const imageUrl = imageError
    ? getDeviceImageUrl(null, device.category)
    : getDeviceImageUrl(device.image_url, device.category);

  const specsDisplay = useMemo(() => getCategorySpecsDisplay(device), [device]);

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
      aria-label={`${device.name} by ${device.brand}, status: ${displayStatus}`}
    >
      <div className="aspect-4/3 relative overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt=""
          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          onError={() => setImageError(true)}
          aria-hidden="true"
        />
        {imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/80" aria-hidden="true">
            <ImageOff className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        <div className="absolute top-3 left-3"><StatusBadge status={displayStatus} /></div>

        {onFavoriteToggle && (
          <button
            onClick={handleFavoriteClick}
            className={cn(
              "absolute top-3 right-3 h-8 w-8 rounded-full flex items-center justify-center transition-all",
              "bg-background/80 backdrop-blur-sm hover:bg-background shadow-sm",
              "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              isFavorite && "text-red-500",
            )}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            aria-pressed={isFavorite}
          >
            <Heart className={cn("h-4 w-4 transition-all", isFavorite ? "fill-current scale-110" : "group-hover:scale-110")} aria-hidden="true" />
          </button>
        )}

        {showQuickRequest && displayStatus === "available" && onQuickRequest && (
          <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="sm" className="w-full gap-1.5 shadow-lg" onClick={handleQuickRequest} aria-label={`Quick request ${device.name}`}>
              <Zap className="h-3.5 w-3.5" aria-hidden="true" />Quick Request
            </Button>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg" aria-hidden="true">{CATEGORY_ICONS[device.category]}</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">{device.category}</span>
            </div>
            <h3 className="font-semibold text-foreground truncate">{device.name}</h3>
            <p className="text-sm text-muted-foreground truncate">{device.brand} • {device.model}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Device specifications">
          {specsDisplay.map((spec, i) => (
            <span key={i} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-md" title={spec.label}>{spec.value}</span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});
