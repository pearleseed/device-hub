import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BookingRequest, RequestStatus, getDeviceById, getUserById } from '@/lib/mockData';
import { Check, X, RotateCcw, GripVertical, Calendar, Smartphone } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DraggableRequestCardProps {
  request: BookingRequest;
  onStatusChange: (id: string, status: RequestStatus) => void;
  isSelected?: boolean;
  compact?: boolean;
}

export const DraggableRequestCard: React.FC<DraggableRequestCardProps> = ({
  request,
  onStatusChange,
  isSelected,
  compact = false,
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
        isSelected={isSelected}
        compact={compact}
      />
    </div>
  );
};

interface RequestCardContentProps {
  request: BookingRequest;
  onStatusChange?: (id: string, status: RequestStatus) => void;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  isSelected?: boolean;
  compact?: boolean;
}

export const RequestCardContent: React.FC<RequestCardContentProps> = ({
  request,
  onStatusChange,
  isDragging,
  dragHandleProps,
  isSelected,
  compact = false,
}) => {
  const device = getDeviceById(request.deviceId);
  const user = getUserById(request.userId);

  if (!device || !user) return null;

  const durationDays = differenceInDays(new Date(request.endDate), new Date(request.startDate));

  return (
    <TooltipProvider>
      <Card className={cn(
        "relative transition-all duration-200 cursor-grab active:cursor-grabbing group",
        "hover:shadow-md hover:scale-[1.01]",
        isDragging && "shadow-lg ring-2 ring-primary rotate-2",
        isSelected && "ring-2 ring-primary bg-primary/5"
      )}>
        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute -left-0.5 top-2 bottom-2 w-1 bg-primary rounded-full" />
        )}

        <div className="p-3">
          {/* Compact header row */}
          <div className="flex items-center gap-2">
            {/* Drag Handle */}
            <div
              {...dragHandleProps}
              className="text-muted-foreground/50 hover:text-muted-foreground cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <GripVertical className="h-4 w-4" />
            </div>

            {/* Device thumbnail */}
            <div className="w-8 h-8 rounded-md overflow-hidden bg-muted flex-shrink-0">
              <img src={device.image} alt={device.name} className="w-full h-full object-cover" />
            </div>

            {/* Main info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="font-medium text-sm truncate cursor-default">{device.name}</p>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <div className="space-y-1">
                      <p className="font-medium">{device.name}</p>
                      <p className="text-xs text-muted-foreground">{device.assetTag}</p>
                      <p className="text-xs">{request.reason}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Avatar className="h-4 w-4">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="text-[8px]">{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="truncate">{user.name}</span>
                <span className="text-muted-foreground/50">•</span>
                <span className="flex items-center gap-0.5 whitespace-nowrap">
                  <Calendar className="h-3 w-3" />
                  {durationDays}d
                </span>
              </div>
            </div>

            {/* Quick action buttons - inline for efficiency */}
            {onStatusChange && request.status === 'pending' && (
              <div className="flex gap-1 flex-shrink-0">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Approve Request</AlertDialogTitle>
                      <AlertDialogDescription>
                        Approve {user.name}'s request for {device.name}?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => onStatusChange(request.id, 'approved')}
                      >
                        Approve
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reject Request</AlertDialogTitle>
                      <AlertDialogDescription>
                        Reject {user.name}'s request for {device.name}?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        className="bg-destructive hover:bg-destructive/90"
                        onClick={() => onStatusChange(request.id, 'rejected')}
                      >
                        Reject
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}

            {onStatusChange && request.status === 'approved' && (
              <Button 
                size="sm" 
                variant="ghost"
                className="h-7 text-xs flex-shrink-0"
                onClick={(e) => { e.stopPropagation(); onStatusChange(request.id, 'active'); }}
              >
                Activate
              </Button>
            )}

            {onStatusChange && request.status === 'active' && (
              <Button 
                size="sm" 
                variant="ghost"
                className="h-7 text-xs flex-shrink-0"
                onClick={(e) => { e.stopPropagation(); onStatusChange(request.id, 'returned'); }}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Return
              </Button>
            )}
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
};
