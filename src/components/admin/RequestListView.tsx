import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import type { BookingRequest, RequestStatus } from "@/lib/mockData";
import { getDeviceById, getUserById } from "@/lib/mockData";
import { Check, X } from "lucide-react";
import { format } from "date-fns";

interface RequestListViewProps {
  requests: BookingRequest[];
  onStatusChange: (id: string, status: RequestStatus) => void;
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
            const device = getDeviceById(request.deviceId);
            const user = getUserById(request.userId);
            if (!device || !user) return null;

            return (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={device.image}
                    alt={device.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-medium">{device.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.name} •{" "}
                      {format(new Date(request.startDate), "MMM d")} -{" "}
                      {format(new Date(request.endDate), "MMM d")}
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
