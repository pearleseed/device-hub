import React, { useState } from "react";
import { Link } from "react-router-dom";
import type { NotificationType } from "@/contexts/NotificationContext";
import {
  useNotifications,
  getNotificationLink,
} from "@/contexts/NotificationContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Package,
  Info,
  Sparkles,
  RotateCcw,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const typeConfig: Record<
  NotificationType,
  {
    icon: React.ElementType;
    gradient: string;
    bgColor: string;
    label: string;
  }
> = {
  request_approved: {
    icon: CheckCircle,
    gradient: "from-emerald-500 to-green-600",
    bgColor: "bg-emerald-500/10",
    label: "Approved",
  },
  request_rejected: {
    icon: XCircle,
    gradient: "from-red-500 to-rose-600",
    bgColor: "bg-red-500/10",
    label: "Rejected",
  },
  new_request: {
    icon: Package,
    gradient: "from-blue-500 to-indigo-600",
    bgColor: "bg-blue-500/10",
    label: "New Request",
  },
  overdue: {
    icon: AlertTriangle,
    gradient: "from-amber-500 to-orange-600",
    bgColor: "bg-amber-500/10",
    label: "Overdue",
  },
  device_returned: {
    icon: RotateCcw,
    gradient: "from-slate-500 to-slate-600",
    bgColor: "bg-slate-500/10",
    label: "Returned",
  },
  renewal_approved: {
    icon: CheckCircle,
    gradient: "from-emerald-500 to-green-600",
    bgColor: "bg-emerald-500/10",
    label: "Renewal Approved",
  },
  renewal_rejected: {
    icon: XCircle,
    gradient: "from-red-500 to-rose-600",
    bgColor: "bg-red-500/10",
    label: "Renewal Rejected",
  },
  info: {
    icon: Info,
    gradient: "from-sky-500 to-cyan-600",
    bgColor: "bg-sky-500/10",
    label: "Info",
  },
};

interface NotificationItemProps {
  notification: {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    link?: string;
  };
  onMarkAsRead: (id: string) => void;
  onClear: (id: string) => void;
  isAdmin: boolean;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onClear,
  isAdmin,
}) => {
  const config = typeConfig[notification.type];
  const Icon = config.icon;

  // Get the correct link based on notification type and user role
  const link =
    notification.link || getNotificationLink(notification.type, isAdmin);

  return (
    <div
      className={cn(
        "group relative px-4 py-3 transition-all duration-200 hover:bg-accent/50",
        !notification.read && "bg-primary/3",
      )}
    >
      <div className="flex gap-3">
        {/* Icon with gradient background */}
        <div
          className={cn(
            "relative shrink-0 h-10 w-10 rounded-xl flex items-center justify-center",
            config.bgColor,
          )}
        >
          <div
            className={cn(
              "absolute inset-0 rounded-xl bg-linear-to-br opacity-0 group-hover:opacity-100 transition-opacity",
              config.gradient,
            )}
          />
          <Icon
            className={cn(
              "h-5 w-5 relative z-10 transition-colors",
              `text-${config.gradient.split("-")[1]}-600`,
              "group-hover:text-white",
            )}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <p
                className={cn(
                  "text-sm font-medium leading-tight",
                  !notification.read
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {notification.title}
              </p>
              {!notification.read && (
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              )}
            </div>
          </div>

          <p className="text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed">
            {notification.message}
          </p>

          <div className="flex items-center gap-3 pt-0.5">
            <span className="flex items-center gap-1 text-xs text-muted-foreground/60">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
            </span>
            {link && (
              <Link
                to={link}
                onClick={() => onMarkAsRead(notification.id)}
                className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                View details →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Hover actions */}
      <div
        className={cn(
          "absolute right-3 top-3 flex items-center gap-1",
          "opacity-0 group-hover:opacity-100 transition-all duration-200",
          "translate-x-2 group-hover:translate-x-0",
        )}
      >
        {!notification.read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg hover:bg-primary/10 hover:text-primary"
            onClick={() => onMarkAsRead(notification.id)}
            aria-label="Mark as read"
          >
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-lg hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onClear(notification.id)}
          aria-label="Delete notification"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
};

const EmptyNotifications: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
    <div className="relative mb-4">
      <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center">
        <Bell className="h-8 w-8 text-muted-foreground/40" />
      </div>
      <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
        <Sparkles className="h-3 w-3 text-primary" />
      </div>
    </div>
    <h4 className="text-sm font-medium text-foreground mb-1">All caught up!</h4>
    <p className="text-xs text-muted-foreground max-w-[200px]">
      You don't have any notifications right now. We'll let you know when
      something arrives.
    </p>
  </div>
);

export const NotificationCenter: React.FC = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
  } = useNotifications();
  const { isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Use notifications directly (already filtered by backend for current user)
  const roleFilteredNotifications = notifications;
  const roleUnreadCount = unreadCount;

  const unreadNotifications = roleFilteredNotifications.filter((n) => !n.read);
  const readNotifications = roleFilteredNotifications.filter((n) => n.read);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative rounded-xl transition-all",
            isOpen && "bg-accent",
          )}
          aria-label={`Notifications${roleUnreadCount > 0 ? `, ${roleUnreadCount} unread` : ""}`}
          aria-haspopup="true"
        >
          <Bell
            className={cn(
              "h-5 w-5 transition-transform",
              isOpen && "scale-110",
            )}
            aria-hidden="true"
          />
          {roleUnreadCount > 0 && (
            <span
              className={cn(
                "absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full",
                "bg-linear-to-br from-red-500 to-rose-600",
                "text-white text-xs font-semibold",
                "flex items-center justify-center",
                "shadow-lg shadow-red-500/25",
                "animate-in zoom-in-50 duration-200",
              )}
              aria-hidden="true"
            >
              {roleUnreadCount > 9 ? "9+" : roleUnreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[380px] p-0 rounded-xl shadow-xl border-border/50 overflow-hidden"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm">Notifications</h4>
            {roleUnreadCount > 0 && (
              <Badge
                variant="secondary"
                className="h-5 px-1.5 text-xs font-medium"
              >
                {roleUnreadCount} new
              </Badge>
            )}
          </div>
          {roleUnreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1.5"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Content */}
        <ScrollArea className="max-h-[420px]">
          {roleFilteredNotifications.length > 0 ? (
            <div className="divide-y divide-border/50">
              {/* Unread section */}
              {unreadNotifications.length > 0 && (
                <div>
                  {unreadNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onClear={clearNotification}
                      isAdmin={isAdmin}
                    />
                  ))}
                </div>
              )}

              {/* Read section with header */}
              {readNotifications.length > 0 && (
                <div>
                  {unreadNotifications.length > 0 && (
                    <div className="px-4 py-2 bg-muted/20">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Earlier
                      </span>
                    </div>
                  )}
                  {readNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onClear={clearNotification}
                      isAdmin={isAdmin}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <EmptyNotifications />
          )}
        </ScrollArea>

        {/* Footer */}
        {roleFilteredNotifications.length > 0 && (
          <div className="px-4 py-2.5 border-t bg-muted/20">
            <p className="text-xs text-center text-muted-foreground">
              Showing {roleFilteredNotifications.length} notification
              {roleFilteredNotifications.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
