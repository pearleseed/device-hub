import React from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { AlertTriangle, Clock, ArrowRight, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { OverdueItem } from "@/hooks/use-overdue-alerts";
import { useOverdueAlerts } from "@/hooks/use-overdue-alerts";
import { cn } from "@/lib/utils";

interface OverdueAlertsBannerProps {
  compact?: boolean;
  className?: string;
}

const getSeverityColor = (daysOverdue: number) => {
  if (daysOverdue >= 7) return "border-red-500 bg-red-500/10";
  if (daysOverdue >= 3) return "border-orange-500 bg-orange-500/10";
  return "border-yellow-500 bg-yellow-500/10";
};

const getSeverityBadge = (daysOverdue: number) => {
  if (daysOverdue >= 7) return "bg-red-500 text-white";
  if (daysOverdue >= 3) return "bg-orange-500 text-white";
  return "bg-yellow-500 text-white";
};

export const OverdueAlertsBanner: React.FC<OverdueAlertsBannerProps> = ({
  compact = false,
  className,
}) => {
  const { t } = useLanguage();
  const { overdueItems, totalOverdue, criticalOverdue } = useOverdueAlerts();

  if (totalOverdue === 0) return null;

  if (compact) {
    return (
      <Alert className={cn("border-red-500 bg-red-500/10", className)}>
        <AlertTriangle className="h-4 w-4 text-red-500" />
        <AlertTitle className="text-red-600 dark:text-red-400">
          {totalOverdue} {t("overdue.overdueDevices")}
        </AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span className="text-muted-foreground">
            {criticalOverdue.length > 0 && (
              <span className="text-red-500 font-medium">
                {criticalOverdue.length} {t("overdue.critical")}
              </span>
            )}
          </span>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-red-500 hover:text-red-600"
          >
            <Link to="/admin/requests?tab=borrow">
              {t("overdue.viewAll")} <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={cn("space-y-3 overflow-hidden", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <h3 className="font-medium text-xl">{t("overdue.title")}</h3>
          <Badge variant="destructive" className="text-xs px-1.5 py-0">
            {totalOverdue}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
          <Link to="/admin/requests?tab=borrow">
            {t("overdue.viewAll")} <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </div>

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-3 pb-2 w-max">
          {overdueItems.map((item) => (
            <OverdueCard key={item.booking.id} item={item} />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

const OverdueCard: React.FC<{ item: OverdueItem }> = ({ item }) => {
  return (
    <div
      className={cn(
        "shrink-0 w-52 p-3 rounded-md border transition-all hover:shadow-sm",
        getSeverityColor(item.daysOverdue),
      )}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-medium text-xs truncate flex-1">
          {item.device.name}
        </span>
        <Badge
          className={cn(
            "ml-1.5 shrink-0 text-[10px] px-1.5 py-0",
            getSeverityBadge(item.daysOverdue),
          )}
        >
          {item.daysOverdue}d
        </Badge>
      </div>

      <div className="space-y-1 text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <User className="h-3 w-3" />
          <span className="truncate">{item.user.name}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{format(new Date(item.booking.end_date), "MMM d, yyyy")}</span>
        </div>
      </div>
    </div>
  );
};
