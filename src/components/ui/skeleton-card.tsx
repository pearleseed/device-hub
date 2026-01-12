import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ className }) => {
  return (
    <div className={cn("rounded-lg border bg-card overflow-hidden", className)}>
      {/* Image placeholder */}
      <div className="aspect-[4/3] bg-muted animate-shimmer" />

      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded bg-muted animate-shimmer" />
          <div className="h-3 w-16 rounded bg-muted animate-shimmer" />
        </div>
        <div className="h-5 w-3/4 rounded bg-muted animate-shimmer" />
        <div className="h-4 w-1/2 rounded bg-muted animate-shimmer" />
        <div className="flex gap-2 pt-2">
          <div className="h-6 w-16 rounded-md bg-muted animate-shimmer" />
          <div className="h-6 w-12 rounded-md bg-muted animate-shimmer" />
        </div>
      </div>
    </div>
  );
};

export const SkeletonListItem: React.FC<SkeletonCardProps> = ({
  className,
}) => {
  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-lg border bg-card",
        className,
      )}
    >
      <div className="h-16 w-16 rounded-lg bg-muted animate-shimmer flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-5 w-1/3 rounded bg-muted animate-shimmer" />
        <div className="h-4 w-1/4 rounded bg-muted animate-shimmer" />
      </div>
      <div className="hidden sm:block h-4 w-16 rounded bg-muted animate-shimmer" />
      <div className="h-6 w-20 rounded-full bg-muted animate-shimmer" />
    </div>
  );
};

export const SkeletonKPICard: React.FC<SkeletonCardProps> = ({ className }) => {
  return (
    <div className={cn("rounded-lg border bg-card p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-24 rounded bg-muted animate-shimmer" />
        <div className="h-4 w-4 rounded bg-muted animate-shimmer" />
      </div>
      <div className="h-8 w-16 rounded bg-muted animate-shimmer mb-2" />
      <div className="h-3 w-32 rounded bg-muted animate-shimmer" />
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number; className?: string }> = ({
  rows = 5,
  className,
}) => {
  return (
    <div className={cn("rounded-lg border bg-card overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b bg-muted/30">
        <div className="h-4 w-24 rounded bg-muted animate-shimmer" />
        <div className="h-4 w-20 rounded bg-muted animate-shimmer" />
        <div className="h-4 w-16 rounded bg-muted animate-shimmer" />
        <div className="h-4 w-20 rounded bg-muted animate-shimmer ml-auto" />
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 border-b last:border-0"
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="h-10 w-10 rounded-lg bg-muted animate-shimmer" />
            <div className="space-y-1.5">
              <div className="h-4 w-32 rounded bg-muted animate-shimmer" />
              <div className="h-3 w-20 rounded bg-muted animate-shimmer" />
            </div>
          </div>
          <div className="h-4 w-24 rounded bg-muted animate-shimmer hidden sm:block" />
          <div className="h-6 w-16 rounded-full bg-muted animate-shimmer" />
        </div>
      ))}
    </div>
  );
};

export const SkeletonAvatar: React.FC<{
  size?: "sm" | "md" | "lg";
  className?: string;
}> = ({ size = "md", className }) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-16 w-16",
  };

  return (
    <div
      className={cn(
        "rounded-full bg-muted animate-shimmer",
        sizeClasses[size],
        className,
      )}
    />
  );
};

// Alias for backward compatibility
export const SkeletonDeviceCard = SkeletonCard;
