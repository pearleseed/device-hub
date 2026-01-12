import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import type { RenewalStatus } from "@/types/api";
import { ArrowDown, CheckCircle2, XCircle, Clock } from "lucide-react";

interface RenewalKanbanColumnProps {
  status: RenewalStatus;
  label: string;
  color: string;
  count: number;
  children: React.ReactNode;
  isDragging?: boolean;
}

const statusIcons: Record<RenewalStatus, React.ReactNode> = {
  pending: <Clock className="h-4 w-4" />,
  approved: <CheckCircle2 className="h-4 w-4" />,
  rejected: <XCircle className="h-4 w-4" />,
};

const dropZoneColors: Record<RenewalStatus, string> = {
  pending: "border-yellow-500 bg-yellow-500/20",
  approved: "border-green-500 bg-green-500/20",
  rejected: "border-red-500 bg-red-500/20",
};

export const RenewalKanbanColumn: React.FC<RenewalKanbanColumnProps> = ({
  status,
  label,
  color,
  count,
  children,
  isDragging = false,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: status,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col p-3 rounded-xl transition-all duration-200 min-h-[300px]",
        isDragging && "ring-2 ring-dashed ring-muted-foreground/50",
        isOver && "ring-2 ring-primary ring-offset-2 scale-[1.02]",
        isOver && dropZoneColors[status],
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center gap-2 pb-2 border-b-2 rounded-t-lg px-2 mb-3",
          color,
          isOver && "border-primary",
        )}
      >
        <span className="text-muted-foreground">{statusIcons[status]}</span>
        <h3 className="font-semibold">{label}</h3>
        <span
          className={cn(
            "text-xs px-2 py-0.5 rounded-full font-medium ml-auto",
            "bg-background text-foreground",
            isOver && "bg-primary text-primary-foreground",
          )}
        >
          {count}
        </span>
      </div>

      {/* Cards container - scrollable for many requests */}
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
            No {label.toLowerCase()} renewals
          </p>
        </div>
      )}
    </div>
  );
};
