import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { RequestStatus } from '@/lib/mockData';

interface KanbanColumnProps {
  status: RequestStatus;
  label: string;
  color: string;
  count: number;
  children: React.ReactNode;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  label,
  color,
  count,
  children,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: status,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "space-y-3 p-3 rounded-xl transition-all duration-200 min-h-[300px]",
        isOver && "ring-2 ring-primary ring-offset-2 bg-primary/5"
      )}
    >
      <div className={cn("flex items-center gap-2 pb-2 border-b-2 rounded-t-lg px-2", color)}>
        <h3 className="font-semibold">{label}</h3>
        <span className="bg-background text-foreground text-xs px-2 py-0.5 rounded-full font-medium">
          {count}
        </span>
      </div>
      <div className="space-y-3 min-h-[200px]">
        {children}
      </div>
    </div>
  );
};
