import React, { memo, useCallback } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  accentColor?: "primary" | "destructive" | "warning" | "success" | "default";
  href?: string;
  onClick?: () => void;
  className?: string;
}

const colorMap = {
  primary: { bg: "bg-primary/10", text: "text-primary", circle: "bg-primary/10", border: "" },
  destructive: { bg: "bg-destructive/10", text: "text-destructive", circle: "bg-destructive/10", border: "border-destructive/50" },
  warning: { bg: "bg-orange-500/10", text: "text-orange-500", circle: "bg-orange-500/10", border: "border-orange-500/50" },
  success: { bg: "bg-green-500/10", text: "text-green-600", circle: "bg-green-500/10", border: "" },
  default: { bg: "bg-muted", text: "text-foreground", circle: "bg-primary/10", border: "" },
};

export const StatsCard: React.FC<StatsCardProps> = memo(({
  title, value, subtitle, icon: Icon, accentColor = "default", href, onClick, className,
}) => {
  const colors = colorMap[accentColor];
  const ariaLabel = `${title}: ${value}${subtitle ? `, ${subtitle}` : ""}`;

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (onClick && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onClick(); }
  }, [onClick]);

  const content = (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-200",
        (href || onClick) && "cursor-pointer hover:shadow-md hover:-translate-y-0.5",
        colors.border, className,
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
      aria-label={ariaLabel}
    >
      <div className={cn("absolute top-0 right-0 w-20 h-20 rounded-full -mr-10 -mt-10", colors.circle)} aria-hidden="true" />
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className={cn("text-3xl font-bold", colors.text)} aria-live="polite">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={cn("h-12 w-12 rounded-full flex items-center justify-center", colors.circle)} aria-hidden="true">
            <Icon className={cn("h-6 w-6", colors.text)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return href ? <Link to={href} className="block" aria-label={ariaLabel}>{content}</Link> : content;
});
