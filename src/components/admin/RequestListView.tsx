import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import type { BorrowRequestWithDetails, RequestStatus } from "@/types/api";
import { Check, X } from "lucide-react";
import { format } from "date-fns";

interface RequestListViewProps {
  requests: BorrowRequestWithDetails[];
  onStatusChange: (id: number, status: RequestStatus) => void;
}

export const RequestListView: React.FC<RequestListViewProps> = ({
  requests,
  onStatusChange,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>All Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {requests.map((request) => {
            const deviceName = request.device_name || "Unknown Device";
            const deviceImage = request.device_image || "/placeholder.svg";
            const userName = request.user_name || "Unknown User";

            return (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={deviceImage}
                    alt={deviceName}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-medium">{deviceName}</p>
                    <p className="text-sm text-muted-foreground">
                      {userName} •{" "}
                      {format(new Date(request.start_date), "MMM d")} -{" "}
                      {format(new Date(request.end_date), "MMM d")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={request.status} />
                  {request.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-status-available hover:text-status-available hover:bg-status-available/10"
                        onClick={() => onStatusChange(request.id, "approved")}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => onStatusChange(request.id, "rejected")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
