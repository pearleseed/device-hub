import React, { memo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Package, Search, Heart, FileText, Inbox, Clock, Sparkles, ArrowRight } from "lucide-react";

type EmptyStateType = "no-devices" | "no-results" | "no-favorites" | "no-requests" | "no-notifications" | "no-loans" | "coming-soon";

interface EmptyStateProps {
  type: EmptyStateType;
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

const emptyStateConfig: Record<EmptyStateType, { icon: React.ElementType; defaultTitle: string; defaultDescription: string; iconBgColor: string; iconColor: string }> = {
  "no-devices": { icon: Package, defaultTitle: "No devices available", defaultDescription: "Check back later for new devices in the catalog.", iconBgColor: "bg-blue-100 dark:bg-blue-900/30", iconColor: "text-blue-600 dark:text-blue-400" },
  "no-results": { icon: Search, defaultTitle: "No results found", defaultDescription: "Try adjusting your search or filter criteria.", iconBgColor: "bg-muted", iconColor: "text-muted-foreground" },
  "no-favorites": { icon: Heart, defaultTitle: "No favorites yet", defaultDescription: "Click the heart icon on any device to add it to your favorites.", iconBgColor: "bg-pink-100 dark:bg-pink-900/30", iconColor: "text-pink-600 dark:text-pink-400" },
  "no-requests": { icon: FileText, defaultTitle: "No requests yet", defaultDescription: "Browse the catalog to request your first device.", iconBgColor: "bg-purple-100 dark:bg-purple-900/30", iconColor: "text-purple-600 dark:text-purple-400" },
  "no-notifications": { icon: Inbox, defaultTitle: "All caught up!", defaultDescription: "You don't have any notifications right now.", iconBgColor: "bg-green-100 dark:bg-green-900/30", iconColor: "text-green-600 dark:text-green-400" },
  "no-loans": { icon: Clock, defaultTitle: "No active loans", defaultDescription: "Request a device from the catalog to get started.", iconBgColor: "bg-orange-100 dark:bg-orange-900/30", iconColor: "text-orange-600 dark:text-orange-400" },
  "coming-soon": { icon: Sparkles, defaultTitle: "Coming soon", defaultDescription: "This feature is currently under development.", iconBgColor: "bg-amber-100 dark:bg-amber-900/30", iconColor: "text-amber-600 dark:text-amber-400" },
};

export const EmptyState: React.FC<EmptyStateProps> = memo(({ type, title, description, actionLabel, actionHref, onAction, className }) => {
  const config = emptyStateConfig[type];
  const Icon = config.icon;
  const displayTitle = title || config.defaultTitle;

  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)} role="status" aria-label={displayTitle}>
      <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mb-6 animate-fade-in", config.iconBgColor)} aria-hidden="true">
        <Icon className={cn("h-10 w-10", config.iconColor)} />
      </div>
      <h3 className="text-lg font-semibold mb-2 animate-fade-in">{displayTitle}</h3>
      <p className="text-muted-foreground max-w-sm mb-6 animate-fade-in">{description || config.defaultDescription}</p>
      {(actionLabel || actionHref) && (
        <div className="animate-fade-in">
          {actionHref ? (
            <Button asChild><Link to={actionHref}>{actionLabel || "Get Started"}<ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Link></Button>
          ) : onAction ? (
            <Button onClick={onAction}>{actionLabel || "Get Started"}<ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Button>
          ) : null}
        </div>
      )}
    </div>
  );
});
