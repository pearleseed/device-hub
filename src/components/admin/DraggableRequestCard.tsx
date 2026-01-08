import React, { useEffect, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { equipmentAPI, usersAPI } from "@/lib/api";
import type { Equipment, User, RequestStatus } from "@/lib/types";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { GripVertical, Calendar, User as UserIcon } from "lucide-react";

// Legacy request type
interface BookingRequest {
  id: string;
  deviceId: string;
  userId: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: RequestStatus;
  createdAt: string;
}

interface DraggableRequestCardProps {
  request: BookingRequest;
  onStatusChange: (id: string, status: RequestStatus) => void;
}

// Separate content component for drag overlay
export const RequestCardContent: React.FC<{
  request: BookingRequest;
  isDragging?: boolean;
}> = ({ request, isDragging }) => {
  const [device, setDevice] = useState<Equipment | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [deviceRes, userRes] = await Promise.all([
        equipmentAPI.getById(parseInt(request.deviceId)),
        usersAPI.getById(parseInt(request.userId)),
      ]);
      if (deviceRes.success && deviceRes.data) setDevice(deviceRes.data);
      if (userRes.success && userRes.data) setUser(userRes.data);
    };
    fetchData();
  }, [request.deviceId, request.userId]);

  return (
    <Card
      className={cn(
        "cursor-grab active:cursor-grabbing transition-shadow",
        isDragging && "shadow-xl",
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {device && (
                <div className="w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                  <img
                    src={device.image_url}
                    alt={device.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">
                  {device?.name || "Loading..."}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {device?.asset_tag}
                </p>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-1 text-muted-foreground">
                <UserIcon className="h-3 w-3" />
                <span className="truncate">{user?.name || "Loading..."}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>
                  {format(new Date(request.startDate), "MMM d")} -{" "}
                  {format(new Date(request.endDate), "MMM d")}
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
              {request.reason}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const DraggableRequestCard: React.FC<DraggableRequestCardProps> = ({
  request,
  onStatusChange,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: request.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <RequestCardContent request={request} isDragging={isDragging} />
    </div>
  );
};
