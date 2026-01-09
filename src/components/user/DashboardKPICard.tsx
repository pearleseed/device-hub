import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface DashboardKPICardProps {
  title: string;
  value: number | string;
  description: string;
  icon: LucideIcon;
  onClick?: () => void;
  className?: string;
  accentColor?: "default" | "success" | "warning" | "info";
}

export const DashboardKPICard: React.FC<DashboardKPICardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  onClick,
  className,
  accentColor = "default",
}) => {
  const isClickable = !!onClick;

  const accentStyles = {
    default: "border-l-muted-foreground/20",
    success: "border-l-green-500",
    warning: "border-l-yellow-500",
    info: "border-l-blue-500",
  };

  return (
    <Card
      className={cn(
        "border-l-4 transition-all duration-200",
        accentStyles[accentColor],
        isClickable &&
          "cursor-pointer hover:shadow-md hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-primary",
        className,
      )}
      onClick={onClick}
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? "button" : undefined}
      onKeyDown={(e) => {
        if (isClickable && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
};
