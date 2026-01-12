import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ReturnRequestWithDetails, DeviceCondition } from "@/types/api";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";

interface ReturnListViewProps {
  returns: ReturnRequestWithDetails[];
  onConditionChange: (id: number, condition: DeviceCondition) => void;
}

const conditionColors: Record<DeviceCondition, string> = {
  excellent: "bg-green-500/10 text-green-700 border-green-500/30",
  good: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  fair: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30",
  damaged: "bg-red-500/10 text-red-700 border-red-500/30",
};

export const ReturnListView: React.FC<ReturnListViewProps> = ({ returns }) => {
  const { t } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t("requests.allReturns") || "All Return Requests"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {returns.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {t("requests.noReturns") || "No return requests found"}
            </p>
          ) : (
            returns.map((returnRequest) => {
              const deviceName = returnRequest.device_name || "Unknown Device";
              const userName = returnRequest.user_name || "Unknown User";

              return (
                <div
                  key={returnRequest.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      <span className="text-lg font-semibold text-muted-foreground">
                        {deviceName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{deviceName}</p>
                      <p className="text-sm text-muted-foreground">
                        {userName} •{" "}
                        {format(
                          new Date(returnRequest.return_date),
                          "MMM d, yyyy",
                        )}
                      </p>
                      {returnRequest.notes && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {returnRequest.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={conditionColors[returnRequest.device_condition]}
                  >
                    {returnRequest.device_condition}
                  </Badge>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};
