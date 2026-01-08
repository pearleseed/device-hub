import React from "react";
import { useDroppable } from "@dnd-kit/core";
import type { RequestStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  status: RequestStatus;
  label: string;
  color: string;
  count: number;
  isDragging: boolean;
  children: React.ReactNode;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  label,
  color,
  count,
  isDragging,
  children,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-lg border-2 border-dashed p-4 min-h-[400px] transition-colors",
        color,
        isOver && "ring-2 ring-primary ring-offset-2",
        isDragging && "bg-opacity-50",
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">{label}</h3>
        <span className="text-sm text-muted-foreground bg-background/80 px-2 py-0.5 rounded-full">
          {count}
        </span>
      </div>
      <div className="flex-1 space-y-3">{children}</div>
    </div>
  );
};
