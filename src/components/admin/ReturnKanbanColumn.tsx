import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { DeviceCondition } from "@/types/api";
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  XCircle,
  ArrowDown,
} from "lucide-react";

interface ReturnKanbanColumnProps {
  condition: DeviceCondition;
  label: string;
  color: string;
  count: number;
  isDragging: boolean;
  children: React.ReactNode;
}

const conditionIcons: Record<DeviceCondition, React.ReactNode> = {
  excellent: <CheckCircle className="h-4 w-4 text-green-500" />,
  good: <AlertCircle className="h-4 w-4 text-blue-500" />,
  fair: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
  damaged: <XCircle className="h-4 w-4 text-red-500" />,
};

const dropZoneColors: Record<DeviceCondition, string> = {
  excellent: "border-green-500 bg-green-500/20",
  good: "border-blue-500 bg-blue-500/20",
  fair: "border-yellow-500 bg-yellow-500/20",
  damaged: "border-red-500 bg-red-500/20",
};

export const ReturnKanbanColumn: React.FC<ReturnKanbanColumnProps> = ({
  condition,
  label,
  color,
  count,
  isDragging,
  children,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: condition,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col p-3 rounded-xl transition-all duration-200 min-h-[300px]",
        isDragging && "ring-2 ring-dashed ring-muted-foreground/50",
        isOver && "ring-2 ring-primary ring-offset-2 scale-[1.02]",
        isOver && dropZoneColors[condition],
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center gap-2 pb-2 border-b-2 rounded-t-lg px-2 py-1 mb-3",
          color,
          isOver && "border-primary",
        )}
      >
        {conditionIcons[condition]}
        <span className="font-semibold text-sm">{label}</span>
        <Badge
          variant="secondary"
          className={cn(
            "ml-auto",
            isOver && "bg-primary text-primary-foreground",
          )}
        >
          {count}
        </Badge>
      </div>

      {/* Cards container - scrollable with max height */}
      <div className="space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] px-1 pt-1 pb-1 scrollbar-thin">
        {children}
      </div>

      {/* Drop zone indicator - always visible during drag */}
      {isDragging && (
        <div
          className={cn(
            "mt-2 flex items-center justify-center gap-2 py-4 border-2 border-dashed rounded-lg transition-all duration-200",
            isOver
              ? "border-primary bg-primary/10 text-primary"
              : "border-muted-foreground/30 text-muted-foreground",
          )}
        >
          <ArrowDown className={cn("h-4 w-4", isOver && "animate-bounce")} />
          <span className="text-sm font-medium">
            {isOver
              ? `Drop to ${label.toLowerCase()}`
              : `Move to ${label.toLowerCase()}`}
          </span>
        </div>
      )}

      {/* Empty state when not dragging */}
      {!isDragging && count === 0 && (
        <div className="flex items-center justify-center h-20 border-2 border-dashed border-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            No {label.toLowerCase()} returns
          </p>
        </div>
      )}
    </div>
  );
};
