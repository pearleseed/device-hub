import React, { useEffect, useState } from "react";
import { equipmentAPI } from "@/lib/api";
import type { Equipment } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { History, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecentlyViewedSectionProps {
  deviceIds: string[];
  onClear?: () => void;
  onDeviceClick?: (device: { id: number }) => void;
  className?: string;
}

export const RecentlyViewedSection: React.FC<RecentlyViewedSectionProps> = ({
  deviceIds,
  onClear,
  onDeviceClick,
  className,
}) => {
  const [devices, setDevices] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDevices = async () => {
      if (deviceIds.length === 0) {
        setDevices([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const devicePromises = deviceIds.map((id) =>
          equipmentAPI.getById(parseInt(id)),
        );
        const results = await Promise.all(devicePromises);
        const fetchedDevices = results
          .filter((r) => r.success && r.data)
          .map((r) => r.data as Equipment);
        setDevices(fetchedDevices);
      } catch (error) {
        console.error("Error fetching recently viewed devices:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDevices();
  }, [deviceIds]);

  if (deviceIds.length === 0 || devices.length === 0) {
    return null;
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <History className="h-4 w-4" />
          Recently Viewed
        </CardTitle>
        {onClear && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-muted-foreground hover:text-foreground"
            onClick={onClear}
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </CardHeader>
      <CardContent className="pb-4">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-4">
            {devices.map((device) => (
              <button
                key={device.id}
                className="shrink-0 group cursor-pointer text-left"
                onClick={() => onDeviceClick?.({ id: device.id })}
              >
                <div className="w-32 space-y-2">
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img
                      src={device.image_url}
                      alt={device.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {device.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {device.brand}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
