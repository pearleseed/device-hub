import React from "react";
import { CheckCircle2, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuccessAnimationProps {
  title: string;
  description?: string;
  variant?: "checkmark" | "celebrate";
  className?: string;
}

export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  title,
  description,
  variant = "checkmark",
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-8",
        className,
      )}
    >
      {variant === "checkmark" ? (
        <div className="relative">
          {/* Outer ring animation */}
          <div className="absolute inset-0 w-20 h-20 rounded-full bg-green-500/20 animate-ping" />

          {/* Main icon */}
          <div className="relative w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center animate-success-pulse">
            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
        </div>
      ) : (
        <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center animate-celebrate">
          <PartyPopper className="h-10 w-10 text-amber-600 dark:text-amber-400" />
        </div>
      )}

      <h3 className="text-xl font-bold mt-6 mb-2 animate-fade-in">{title}</h3>

      {description && (
        <p className="text-muted-foreground max-w-sm animate-fade-in">
          {description}
        </p>
      )}
    </div>
  );
};

// Inline success checkmark for forms
export const InlineSuccess: React.FC<{
  message: string;
  className?: string;
}> = ({ message, className }) => {
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm text-green-600 dark:text-green-400 animate-fade-in",
        className,
      )}
    >
      <CheckCircle2 className="h-4 w-4" />
      <span>{message}</span>
    </div>
  );
};
