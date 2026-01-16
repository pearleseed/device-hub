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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
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
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { enUS, vi, ja } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";

const locales: Record<string, any> = { en: enUS, vi: vi, ja: ja };

const typeConfig: Record<
  NotificationType,
  {
    icon: React.ElementType;
    color: string;
  }
> = {
  request_approved: {
    icon: CheckCircle,
    color: "text-emerald-500",
  },
  request_rejected: {
    icon: XCircle,
    color: "text-red-500",
  },
  new_request: {
    icon: Package,
    color: "text-blue-500",
  },
  overdue: {
    icon: AlertTriangle,
    color: "text-amber-500",
  },
  device_returned: {
    icon: RotateCcw,
    color: "text-slate-500",
  },
  renewal_approved: {
    icon: CheckCircle,
    color: "text-emerald-500",
  },
  renewal_rejected: {
    icon: XCircle,
    color: "text-red-500",
  },
  info: {
    icon: Info,
    color: "text-sky-500",
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
  const { t, language } = useLanguage();
  const config = typeConfig[notification.type];
  const Icon = config.icon;

  const renderTranslatedMessage = (message: string) => {
    if (!message.includes("|")) return message;

    const [key, ...paramPairs] = message.split("|");
    const params: Record<string, string | number> = {};

    paramPairs.forEach((pair) => {
      const [k, v] = pair.split(":").map(s => s.trim());
      if (k && v !== undefined) {
        const value = isNaN(Number(v)) ? v : Number(v);
        params[k] = value;
        if (k === "days") {
          params.count = value;
        }
      }
    });

    return t(key, params);
  };

  const link =
    notification.link || getNotificationLink(notification.type, isAdmin);

  return (
    <div
      className={cn(
        "group relative flex items-start gap-3 p-3 hover:bg-muted/40 transition-colors border-b last:border-0 border-border/40",
        !notification.read && "bg-primary/5 hover:bg-primary/10",
      )}
    >
      <Icon className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", config.color)} />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {link ? (
            <Link
              to={link}
              onClick={() => onMarkAsRead(notification.id)}
              className="text-xs font-semibold hover:underline truncate text-foreground"
            >
              {t(notification.title)}
            </Link>
          ) : (
            <p
              className={cn(
                "text-xs font-semibold truncate",
                notification.read && "text-muted-foreground",
              )}
            >
              {t(notification.title)}
            </p>
          )}
          {!notification.read && (
            <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
          )}
        </div>

        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-tight">
          {renderTranslatedMessage(notification.message)}
        </p>

        <span className="text-[10px] text-muted-foreground/60 mt-1 block">
          {formatDistanceToNow(notification.timestamp, {
            addSuffix: true,
            locale: locales[language as string] || locales.en,
          })}
        </span>
      </div>

      <div className={cn(
        "flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity",
      )}>
        {!notification.read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onMarkAsRead(notification.id)}
            aria-label={t("notifications.markAsRead")}
          >
            <Check className="h-3 w-3" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:text-destructive"
          onClick={() => onClear(notification.id)}
          aria-label={t("notifications.delete")}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

const EmptyNotifications: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="relative mb-4">
        <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center">
          <Bell className="h-8 w-8 text-muted-foreground/40" />
        </div>
        <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-3 w-3 text-primary" />
        </div>
      </div>
      <h4 className="text-sm font-medium text-foreground mb-1">
        {t("notifications.allCaughtUp")}
      </h4>
      <p className="text-xs text-muted-foreground max-w-[200px]">
        {t("notifications.noNotifications")}
      </p>
    </div>
  );
};

export const NotificationCenter: React.FC = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
  } = useNotifications();
  const { isAdmin } = useAuth();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  // Use notifications directly (already filtered by backend for current user)
  const roleFilteredNotifications = notifications;
  const roleUnreadCount = unreadCount;

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
          aria-label={`${t("notifications.title")}${roleUnreadCount > 0 ? `, ${roleUnreadCount} ${t("notifications.new")}` : ""}`}
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
        className="w-[320px] p-0 rounded-lg shadow-lg border-border/40 overflow-hidden"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm">{t("notifications.title")}</h4>
            {roleUnreadCount > 0 && (
              <Badge
                variant="secondary"
                className="h-5 px-1.5 text-xs font-medium"
              >
                {roleUnreadCount} {t("notifications.new")}
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
              {t("notifications.markAllRead")}
            </Button>
          )}
        </div>

        {/* Content */}
        <ScrollArea className="max-h-[320px]">
          {roleFilteredNotifications.length > 0 ? (
            <div className="divide-y divide-border/50">
              {roleFilteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onClear={clearNotification}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          ) : (
            <EmptyNotifications />
          )}
        </ScrollArea>

        {/* Footer */}
        {roleFilteredNotifications.length > 0 && (
          <div className="px-4 py-2.5 border-t bg-muted/20">
            <p className="text-xs text-center text-muted-foreground">
              {t("notifications.showing")} {roleFilteredNotifications.length}{" "}
              {roleFilteredNotifications.length !== 1
                ? t("notifications.notifications")
                : t("notifications.notification")}
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
