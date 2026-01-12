import React, { useMemo, memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type {
  BorrowRequestWithDetails,
  RequestStatus,
  DeviceCategory,
} from "@/types/api";
import {
  Check,
  X,
  RotateCcw,
  GripVertical,
  Calendar,
  Laptop,
  Smartphone,
  Tablet,
  Monitor,
  Headphones,
} from "lucide-react";
import { format, differenceInDays, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
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
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const categoryIcons: Record<DeviceCategory, React.ReactNode> = {
  laptop: <Laptop className="h-3 w-3" />,
  mobile: <Smartphone className="h-3 w-3" />,
  tablet: <Tablet className="h-3 w-3" />,
  monitor: <Monitor className="h-3 w-3" />,
  accessories: <Headphones className="h-3 w-3" />,
  storage: "",
  ram: "",
};

interface DraggableRequestCardProps {
  request: BorrowRequestWithDetails;
  onStatusChange: (id: number, status: RequestStatus) => void;
  isSelected?: boolean;
  compact?: boolean;
}

// Memoized component to prevent unnecessary re-renders
export const DraggableRequestCard = memo<DraggableRequestCardProps>(
  ({ request, onStatusChange, isSelected, compact = false }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: request.id });

    // Memoize style object to prevent re-creation
    const style = useMemo(
      () => ({
        transform: CSS.Transform.toString(transform),
        transition,
      }),
      [transform, transition],
    );

    // Memoize drag handle props to prevent re-creation
    const dragHandleProps = useMemo(
      () => ({ ...attributes, ...listeners }),
      [attributes, listeners],
    );

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn("touch-none", isDragging && "opacity-50 z-50")}
      >
        <RequestCardContent
          request={request}
          onStatusChange={onStatusChange}
          dragHandleProps={dragHandleProps}
          isSelected={isSelected}
          compact={compact}
        />
      </div>
    );
  },
);

DraggableRequestCard.displayName = "DraggableRequestCard";

interface RequestCardContentProps {
  request: BorrowRequestWithDetails;
  onStatusChange?: (id: number, status: RequestStatus) => void;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  isSelected?: boolean;
  compact?: boolean;
}

// Memoized card content component
export const RequestCardContent = memo<RequestCardContentProps>(
  ({
    request,
    onStatusChange,
    isDragging,
    dragHandleProps,
    isSelected,
    compact = false,
  }) => {
    // Use data from the joined response (BorrowRequestWithDetails)
    const deviceName = request.device_name || "Unknown Device";
    const deviceAssetTag = request.device_asset_tag || "N/A";
    const deviceImage = request.device_image || "/placeholder.svg";
    const deviceCategory = request.device_category || "laptop";
    const userName = request.user_name || "Unknown User";

    // Memoize expensive date calculations
    const { durationDays, submittedAgo, startFormatted, endFormatted } =
      useMemo(() => {
        const startDate = new Date(request.start_date);
        const endDate = new Date(request.end_date);
        const createdAt = new Date(request.created_at);

        return {
          durationDays: differenceInDays(endDate, startDate),
          submittedAgo: formatDistanceToNow(createdAt, { addSuffix: true }),
          startFormatted: format(startDate, "MMM d"),
          endFormatted: format(endDate, "MMM d"),
        };
      }, [request.start_date, request.end_date, request.created_at]);

    // Memoize user initial
    const userInitial = useMemo(() => userName.charAt(0), [userName]);

    return (
      <Card
        className={cn(
          "relative transition-all duration-200 cursor-grab active:cursor-grabbing group",
          "hover:shadow-md hover:scale-[1.01]",
          isDragging && "shadow-lg ring-2 ring-primary rotate-2",
          isSelected && "ring-2 ring-primary bg-primary/5",
        )}
      >
        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute -left-0.5 top-2 bottom-2 w-1 bg-primary rounded-full" />
        )}

        <div className="p-3">
          {/* Header row with drag handle and device info */}
          <div className="flex items-start gap-2">
            {/* Drag Handle */}
            <div
              {...dragHandleProps}
              className="text-muted-foreground/50 hover:text-muted-foreground cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity mt-1"
            >
              <GripVertical className="h-4 w-4" />
            </div>

            {/* Device thumbnail */}
            <div className="w-10 h-10 rounded-md overflow-hidden bg-muted shrink-0">
              <img
                src={deviceImage}
                alt={deviceName}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Main info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Badge
                  variant="outline"
                  className="h-5 px-1.5 text-[10px] font-normal gap-1"
                >
                  {categoryIcons[deviceCategory]}
                  <span className="capitalize">{deviceCategory}</span>
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  {deviceAssetTag}
                </span>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="font-medium text-sm truncate cursor-default mt-0.5">
                    {deviceName}
                  </p>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <div className="space-y-1">
                    <p className="font-medium">{deviceName}</p>
                    <p className="text-xs">{request.reason}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Quick action buttons */}
            <div className="shrink-0">
              {onStatusChange && request.status === "pending" && (
                <div className="flex gap-1">
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
                          Approve {userName}'s request for {deviceName}?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => onStatusChange(request.id, "approved")}
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
                          Reject {userName}'s request for {deviceName}?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive hover:bg-destructive/90"
                          onClick={() => onStatusChange(request.id, "rejected")}
                        >
                          Reject
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}

              {onStatusChange && request.status === "approved" && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(request.id, "active");
                  }}
                >
                  Activate
                </Button>
              )}

              {onStatusChange && request.status === "active" && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(request.id, "returned");
                  }}
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Return
                </Button>
              )}
            </div>
          </div>

          {/* User and date info row */}
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[9px]">
                {userInitial}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{userName}</p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-right shrink-0 cursor-default">
                  <p className="text-xs font-medium flex items-center gap-1 justify-end">
                    <Calendar className="h-3 w-3" />
                    {startFormatted} - {endFormatted}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {durationDays} days • {submittedAgo}
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Submitted {submittedAgo}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </Card>
    );
  },
);

RequestCardContent.displayName = "RequestCardContent";
