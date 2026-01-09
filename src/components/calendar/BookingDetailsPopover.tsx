import React from "react";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, MessageSquare, Check, X } from "lucide-react";
import type { BookingRequest } from "@/lib/mockData";
import { getDeviceById, getUserById } from "@/lib/mockData";
import { useLanguage } from "@/contexts/LanguageContext";

interface BookingDetailsPopoverProps {
  booking: BookingRequest;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onClose?: () => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-500";
    case "approved":
      return "bg-blue-500";
    case "active":
      return "bg-orange-500";
    case "returned":
      return "bg-green-500";
    case "rejected":
      return "bg-gray-400";
    default:
      return "bg-gray-400";
  }
};

export const BookingDetailsPopover: React.FC<BookingDetailsPopoverProps> = ({
  booking,
  onApprove,
  onReject,
  onClose,
}) => {
  const { t } = useLanguage();
  const device = getDeviceById(booking.deviceId);
  const user = getUserById(booking.userId);

  if (!device || !user) return null;

  return (
    <Card className="w-80 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base font-semibold">
            {device.name}
          </CardTitle>
          <Badge className={`${getStatusColor(booking.status)} text-white`}>
            {t(`requests.${booking.status}`)}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {device.brand} {device.model}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Info */}
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.department}</p>
          </div>
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>
            {format(parseISO(booking.startDate), "MMM d, yyyy")} -{" "}
            {format(parseISO(booking.endDate), "MMM d, yyyy")}
          </span>
        </div>

        {/* Reason */}
        <div className="flex items-start gap-2 text-sm">
          <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
          <p className="text-muted-foreground">{booking.reason}</p>
        </div>

        {/* Created At */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            {t("calendar.requestedOn")}{" "}
            {format(parseISO(booking.createdAt), "MMM d, yyyy")}
          </span>
        </div>

        {/* Actions for Pending Requests */}
        {booking.status === "pending" && (onApprove || onReject) && (
          <div className="flex gap-2 pt-2 border-t border-border">
            {onApprove && (
              <Button
                size="sm"
                className="flex-1"
                onClick={() => onApprove(booking.id)}
              >
                <Check className="h-4 w-4 mr-1" />
                {t("requests.approve")}
              </Button>
            )}
            {onReject && (
              <Button
                size="sm"
                variant="destructive"
                className="flex-1"
                onClick={() => onReject(booking.id)}
              >
                <X className="h-4 w-4 mr-1" />
                {t("requests.reject")}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
