import React, { useMemo, memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";

import type { ReturnRequestWithDetails, DeviceCondition } from "@/types/api";
import { format } from "date-fns";
import { Calendar, User, Package, GripVertical } from "lucide-react";

interface DraggableReturnCardProps {
  returnRequest: ReturnRequestWithDetails;
  onConditionChange: (id: number, condition: DeviceCondition) => void;
}



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

  // Memoize drag handle props
  const dragHandleProps = useMemo(
    () => ({ ...attributes, ...listeners }),
    [attributes, listeners],
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "opacity-50" : ""}
    >
      <ReturnCardContent
        returnRequest={returnRequest}
        isDragging={isDragging}
        dragHandleProps={dragHandleProps}
      />
    </div>
  );
};

interface ReturnCardContentProps {
  returnRequest: ReturnRequestWithDetails;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

export const ReturnCardContent: React.FC<ReturnCardContentProps> = ({
  returnRequest,
  isDragging,
  dragHandleProps,
}) => {
  const deviceName = returnRequest.device_name || "Unknown Device";
  const userName = returnRequest.user_name || "Unknown User";

  return (
    <Card
      className={`cursor-grab active:cursor-grabbing transition-all group ${
        isDragging ? "shadow-lg scale-105" : "hover:shadow-md"
      }`}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          {/* Drag Handle */}
          <div
            {...dragHandleProps}
            className="text-muted-foreground/50 hover:text-muted-foreground cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity mt-1"
          >
            <GripVertical className="h-4 w-4" />
          </div>

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



        {returnRequest.notes && (
          <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
            {returnRequest.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
