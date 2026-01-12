import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ReturnRequestWithDetails, DeviceCondition } from "@/types/api";
import { format } from "date-fns";
import { Calendar, User, Package } from "lucide-react";

interface DraggableReturnCardProps {
  returnRequest: ReturnRequestWithDetails;
  onConditionChange: (id: number, condition: DeviceCondition) => void;
}

const conditionColors: Record<DeviceCondition, string> = {
  excellent: "bg-green-500/10 text-green-700 border-green-500/30",
  good: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  fair: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30",
  damaged: "bg-red-500/10 text-red-700 border-red-500/30",
};

export const DraggableReturnCard: React.FC<DraggableReturnCardProps> = ({
  returnRequest,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: returnRequest.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={isDragging ? "opacity-50" : ""}
    >
      <ReturnCardContent
        returnRequest={returnRequest}
        isDragging={isDragging}
      />
    </div>
  );
};

interface ReturnCardContentProps {
  returnRequest: ReturnRequestWithDetails;
  isDragging?: boolean;
}

export const ReturnCardContent: React.FC<ReturnCardContentProps> = ({
  returnRequest,
  isDragging,
}) => {
  const deviceName = returnRequest.device_name || "Unknown Device";
  const userName = returnRequest.user_name || "Unknown User";

  return (
    <Card
      className={`cursor-grab active:cursor-grabbing transition-all ${
        isDragging ? "shadow-lg scale-105" : "hover:shadow-md"
      }`}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{deviceName}</p>
            <p className="text-xs text-muted-foreground truncate">
              {returnRequest.device_asset_tag}
            </p>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span className="truncate">{userName}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>
              {format(new Date(returnRequest.return_date), "MMM d, yyyy")}
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <Badge
            variant="outline"
            className={conditionColors[returnRequest.device_condition]}
          >
            {returnRequest.device_condition}
          </Badge>
        </div>

        {returnRequest.notes && (
          <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
            {returnRequest.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
