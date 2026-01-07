import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BookingRequest, RequestStatus, getDeviceById, getUserById } from '@/lib/mockData';
import { Check, X, RotateCcw, GripVertical } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DraggableRequestCardProps {
  request: BookingRequest;
  onStatusChange: (id: string, status: RequestStatus) => void;
}

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
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "touch-none",
        isDragging && "opacity-50 z-50"
      )}
    >
      <RequestCardContent
        request={request}
        onStatusChange={onStatusChange}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
};

interface RequestCardContentProps {
  request: BookingRequest;
  onStatusChange?: (id: string, status: RequestStatus) => void;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

export const RequestCardContent: React.FC<RequestCardContentProps> = ({
  request,
  onStatusChange,
  isDragging,
  dragHandleProps,
}) => {
  const device = getDeviceById(request.deviceId);
  const user = getUserById(request.userId);

  if (!device || !user) return null;

  return (
    <Card className={cn(
      "shadow-soft hover:shadow-medium transition-all duration-200 cursor-grab active:cursor-grabbing",
      isDragging && "shadow-elevated ring-2 ring-primary"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-2">
          {/* Drag Handle */}
          <div
            {...dragHandleProps}
            className="mt-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Device Info */}
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                <img src={device.image} alt={device.name} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate text-sm">{device.name}</p>
                <p className="text-xs text-muted-foreground">{device.assetTag}</p>
              </div>
            </div>
            
            {/* User */}
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="text-[10px]">{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">{user.name}</span>
            </div>

            {/* Dates & Reason */}
            <div className="text-xs text-muted-foreground mb-3">
              <p>{format(new Date(request.startDate), 'MMM d')} - {format(new Date(request.endDate), 'MMM d, yyyy')}</p>
              <p className="mt-1 line-clamp-1">{request.reason}</p>
            </div>

            {/* Action Buttons */}
            {onStatusChange && request.status === 'pending' && (
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  className="flex-1 h-8 text-xs bg-status-available hover:bg-status-available/90" 
                  onClick={(e) => { e.stopPropagation(); onStatusChange(request.id, 'approved'); }}
                >
                  <Check className="h-3 w-3 mr-1" /> Approve
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  className="flex-1 h-8 text-xs" 
                  onClick={(e) => { e.stopPropagation(); onStatusChange(request.id, 'rejected'); }}
                >
                  <X className="h-3 w-3 mr-1" /> Reject
                </Button>
              </div>
            )}
            {onStatusChange && request.status === 'approved' && (
              <Button 
                size="sm" 
                className="w-full h-8 text-xs" 
                onClick={(e) => { e.stopPropagation(); onStatusChange(request.id, 'active'); }}
              >
                Mark as Active
              </Button>
            )}
            {onStatusChange && request.status === 'active' && (
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full h-8 text-xs" 
                onClick={(e) => { e.stopPropagation(); onStatusChange(request.id, 'returned'); }}
              >
                <RotateCcw className="h-3 w-3 mr-1" /> Mark Returned
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
