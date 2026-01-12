import React from "react";
import type {
  BorrowRequestWithDetails,
  DeviceWithDepartment,
} from "@/types/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, getDeviceThumbnailUrl } from "@/lib/utils";
import { differenceInDays, format } from "date-fns";
import { RotateCcw, Calendar, CalendarClock } from "lucide-react";

interface ActiveLoanCardProps {
  loan: BorrowRequestWithDetails;
  device: DeviceWithDepartment;
  onReturn?: (loanId: number) => void;
  onRequestRenewal?: (loan: BorrowRequestWithDetails) => void;
  hasPendingRenewal?: boolean;
  className?: string;
}

export const ActiveLoanCard: React.FC<ActiveLoanCardProps> = ({
  loan,
  device,
  onReturn,
  onRequestRenewal,
  hasPendingRenewal = false,
  className,
}) => {
  const daysRemaining = differenceInDays(new Date(loan.end_date), new Date());

  const getUrgencyColor = () => {
    if (daysRemaining < 0) return "bg-destructive text-destructive-foreground";
    if (daysRemaining <= 3) return "bg-orange-500 text-white";
    if (daysRemaining <= 7) return "bg-yellow-500 text-black";
    return "bg-primary text-primary-foreground";
  };

  const getUrgencyLabel = () => {
    if (daysRemaining < 0) return `${Math.abs(daysRemaining)}d overdue`;
    if (daysRemaining === 0) return "Due today";
    if (daysRemaining === 1) return "1 day left";
    return `${daysRemaining} days left`;
  };

  return (
    <div
      className={cn(
        "flex gap-4 p-4 border rounded-lg bg-card transition-shadow hover:shadow-md",
        daysRemaining < 0 && "border-destructive/50",
        className,
      )}
    >
      {/* Device Image */}
      <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
        <img
          src={getDeviceThumbnailUrl(
            device.image_thumbnail_url,
            device.image_url,
            device.category,
          )}
          alt={device.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Device Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-medium truncate">{device.name}</h4>
            <p className="text-sm text-muted-foreground">{device.asset_tag}</p>
          </div>

          {/* Countdown Badge */}
          <Badge className={cn("shrink-0", getUrgencyColor())}>
            {getUrgencyLabel()}
          </Badge>
        </div>

        {/* Return Date */}
        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>
            Return by: {format(new Date(loan.end_date), "MMM d, yyyy")}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => onReturn?.(loan.id)}
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Return
          </Button>
          {onRequestRenewal && (
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => onRequestRenewal(loan)}
              disabled={hasPendingRenewal}
            >
              <CalendarClock className="h-3 w-3 mr-1" />
              {hasPendingRenewal ? "Renewal Pending" : "Request Renewal"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
