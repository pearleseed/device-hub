import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type {
  RenewalRequest,
  RenewalStatus,
  BookingRequest,
} from "@/lib/mockData";
import { getDeviceById, getUserById } from "@/lib/mockData";
import {
  Check,
  X,
  GripVertical,
  CalendarClock,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
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
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DraggableRenewalCardProps {
  renewal: RenewalRequest;
  borrowRequest?: BookingRequest;
  onStatusChange: (id: string, status: RenewalStatus) => void;
  isSelected?: boolean;
}

export const DraggableRenewalCard: React.FC<DraggableRenewalCardProps> = ({
  renewal,
  borrowRequest,
  onStatusChange,
  isSelected,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: renewal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("touch-none p-2", isDragging && "opacity-50 z-50")}
    >
      <RenewalCardContent
        renewal={renewal}
        borrowRequest={borrowRequest}
        onStatusChange={onStatusChange}
        dragHandleProps={{ ...attributes, ...listeners }}
        isSelected={isSelected}
      />
    </div>
  );
};

interface RenewalCardContentProps {
  renewal: RenewalRequest;
  borrowRequest?: BookingRequest;
  onStatusChange?: (id: string, status: RenewalStatus) => void;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  isSelected?: boolean;
}

export const RenewalCardContent: React.FC<RenewalCardContentProps> = ({
  renewal,
  borrowRequest,
  onStatusChange,
  isDragging,
  dragHandleProps,
  isSelected,
}) => {
  const device = borrowRequest ? getDeviceById(borrowRequest.deviceId) : null;
  const user = getUserById(renewal.userId);

  if (!user) return null;

  const statusColors: Record<RenewalStatus, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
    approved: "bg-green-100 text-green-800 border-green-300",
    rejected: "bg-red-100 text-red-800 border-red-300",
  };

  return (
    <TooltipProvider>
      <Card
        className={cn(
          "relative transition-all duration-200 cursor-grab active:cursor-grabbing group origin-center",
          "hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5",
          isDragging && "shadow-lg ring-2 ring-primary rotate-2",
          isSelected && "ring-2 ring-primary bg-primary/5",
        )}
      >
        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute -left-0.5 top-2 bottom-2 w-1 bg-primary rounded-full" />
        )}

        <div className="p-4">
          {/* Header row with drag handle and device info */}
          <div className="flex items-start gap-3">
            {/* Drag Handle */}
            <div
              {...dragHandleProps}
              className="text-muted-foreground/50 hover:text-muted-foreground cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity mt-1"
            >
              <GripVertical className="h-5 w-5" />
            </div>

            {/* Device thumbnail */}
            {device && (
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted shrink-0">
                <img
                  src={device.image}
                  alt={device.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Main info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="h-6 px-2 text-xs font-normal gap-1.5"
                >
                  <CalendarClock className="h-3.5 w-3.5" />
                  <span>Renewal</span>
                </Badge>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="font-semibold text-base truncate cursor-default mt-1">
                    {device?.name || "Unknown Device"}
                  </p>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <div className="space-y-1">
                    <p className="font-medium">{device?.name}</p>
                    {device && (
                      <p className="text-xs text-muted-foreground">
                        {device.brand} • {device.model}
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
              {device && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {device.assetTag} • {device.brand}
                </p>
              )}
            </div>

            {/* Quick action buttons */}
            <div className="shrink-0">
              {onStatusChange && renewal.status === "pending" && (
                <div className="flex gap-1">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Check className="h-5 w-5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Approve Renewal</AlertDialogTitle>
                        <AlertDialogDescription>
                          Approve {user.name}'s renewal request for {device?.name || "this device"}?
                          The loan will be extended to {format(new Date(renewal.requestedEndDate), "MMM d, yyyy")}.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => onStatusChange(renewal.id, "approved")}
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
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reject Renewal</AlertDialogTitle>
                        <AlertDialogDescription>
                          Reject {user.name}'s renewal request for {device?.name || "this device"}?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive hover:bg-destructive/90"
                          onClick={() => onStatusChange(renewal.id, "rejected")}
                        >
                          Reject
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}

              {renewal.status !== "pending" && (
                <Badge
                  variant="outline"
                  className={cn("text-sm px-3 py-1", statusColors[renewal.status])}
                >
                  {renewal.status === "approved" ? "Approved" : "Rejected"}
                </Badge>
              )}
            </div>
          </div>

          {/* User info row */}
          <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border/50">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="text-xs">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">
                {user.department}
              </p>
            </div>
          </div>

          {/* Date extension info */}
          <div className="mt-3 p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Extension Request</p>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Current End</span>
                <span className="font-medium">
                  {format(new Date(renewal.currentEndDate), "MMM d, yyyy")}
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Requested End</span>
                <span className="font-semibold text-primary">
                  {format(new Date(renewal.requestedEndDate), "MMM d, yyyy")}
                </span>
              </div>
            </div>
          </div>

          {/* Reason section */}
          <div className="mt-3">
            <p className="text-xs text-muted-foreground mb-1 font-medium">Reason</p>
            <p className="text-sm text-foreground leading-relaxed">
              {renewal.reason}
            </p>
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
};
