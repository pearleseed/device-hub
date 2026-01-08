import React from "react";
import type { DeviceCategory, DeviceStatus, RequestStatus } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, RotateCcw } from "lucide-react";
import { format, differenceInDays, parseISO, isAfter } from "date-fns";
import { cn } from "@/lib/utils";

// Legacy interfaces for backward compatibility
interface Device {
  id: string;
  name: string;
  category: DeviceCategory;
  brand: string;
  model: string;
  assetTag: string;
  status: DeviceStatus;
  assignedTo: string | null;
  specs: Record<string, string | undefined>;
  image: string;
  addedDate: string;
}

interface BookingRequest {
  id: string;
  deviceId: string;
  userId: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: RequestStatus;
  createdAt: string;
}

interface ActiveLoanCardProps {
  loan: BookingRequest;
  device: Device;
  onReturn?: (loanId: string) => void;
}

export const ActiveLoanCard: React.FC<ActiveLoanCardProps> = ({
  loan,
  device,
  onReturn,
}) => {
  const startDate = parseISO(loan.startDate);
  const endDate = parseISO(loan.endDate);
  const today = new Date();

  const totalDays = differenceInDays(endDate, startDate);
  const daysUsed = differenceInDays(today, startDate);
  const daysRemaining = differenceInDays(endDate, today);
  const progress = Math.min(Math.max((daysUsed / totalDays) * 100, 0), 100);

  const isOverdue = isAfter(today, endDate);
  const isNearDue = !isOverdue && daysRemaining <= 3;

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all",
        isOverdue && "border-destructive",
        isNearDue && !isOverdue && "border-yellow-500",
      )}
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
            <img
              src={device.image}
              alt={device.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-semibold truncate">{device.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {device.assetTag}
                </p>
              </div>
              {isOverdue && <Badge variant="destructive">Overdue</Badge>}
              {isNearDue && !isOverdue && (
                <Badge
                  variant="outline"
                  className="border-yellow-500 text-yellow-600"
                >
                  Due Soon
                </Badge>
              )}
            </div>

            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{format(startDate, "MMM d")}</span>
                </div>
                <span className="text-muted-foreground">→</span>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <span>{format(endDate, "MMM d, yyyy")}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Loan progress</span>
                  <span
                    className={cn(
                      "font-medium",
                      isOverdue ? "text-destructive" : "text-muted-foreground",
                    )}
                  >
                    {isOverdue
                      ? `${Math.abs(daysRemaining)} days overdue`
                      : `${daysRemaining} days left`}
                  </span>
                </div>
                <Progress
                  value={progress}
                  className={cn("h-2", isOverdue && "[&>div]:bg-destructive")}
                />
              </div>
            </div>

            {onReturn && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                onClick={() => onReturn(loan.id)}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Return Device
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
