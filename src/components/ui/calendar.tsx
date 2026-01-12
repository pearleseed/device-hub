import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  fullWidth?: boolean;
  variant?: "default" | "modern" | "minimal";
};

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  fullWidth = false,
  variant = "default",
  ...props
}: CalendarProps) {
  // Use responsive sizing when fullWidth is enabled
  const cellSize = fullWidth
    ? "flex-1 min-w-[44px] aspect-square"
    : "h-10 w-10";
  const buttonSize = fullWidth
    ? "h-full w-full min-h-[44px] p-0 font-normal aria-selected:opacity-100"
    : "h-10 w-10 p-0 font-normal aria-selected:opacity-100";

  const isModern = variant === "modern";
  const isMinimal = variant === "minimal";

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "p-4",
        fullWidth && "w-full",
        isModern &&
          "bg-linear-to-br from-card via-card to-muted/30 rounded-2xl shadow-lg border border-border/50",
        isMinimal && "bg-transparent",
        className,
      )}
      classNames={{
        months: cn(
          "flex flex-col sm:flex-row gap-6",
          fullWidth && "w-full justify-center",
        ),
        month: cn("flex flex-col gap-5", fullWidth && "w-full"),
        month_caption: cn(
          "flex justify-center pt-1 relative items-center h-12 w-full",
          isModern && "mb-2",
        ),
        caption_label: cn(
          "text-sm font-semibold tracking-wide",
          isModern &&
            "text-base bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text",
        ),
        nav: "absolute inset-x-0 flex justify-between items-center px-1 z-10",
        button_previous: cn(
          buttonVariants({ variant: isModern ? "ghost" : "outline" }),
          "h-8 w-8 bg-transparent p-0 opacity-60 hover:opacity-100 z-10",
          isModern &&
            "rounded-xl hover:bg-muted/80 transition-all duration-200",
        ),
        button_next: cn(
          buttonVariants({ variant: isModern ? "ghost" : "outline" }),
          "h-8 w-8 bg-transparent p-0 opacity-60 hover:opacity-100 z-10",
          isModern &&
            "rounded-xl hover:bg-muted/80 transition-all duration-200",
        ),
        month_grid: "w-full border-collapse",
        weekdays: cn(
          "flex w-full",
          isModern && "border-b border-border/30 pb-3 mb-2",
        ),
        weekday: cn(
          "text-muted-foreground font-medium text-[0.75rem] uppercase tracking-wider",
          fullWidth
            ? "flex-1 min-w-[44px] text-center py-2"
            : "w-10 text-center",
          isModern && "text-xs",
        ),
        week: cn("flex w-full", isModern ? "mt-1" : "mt-2"),
        day: cn(
          "text-center text-sm p-0.5 relative",
          "[&:has([aria-selected].day-range-end)]:rounded-r-xl",
          "[&:has([aria-selected].day-outside)]:bg-accent/50",
          "[&:has([aria-selected])]:bg-accent",
          "first:[&:has([aria-selected])]:rounded-l-xl",
          "last:[&:has([aria-selected])]:rounded-r-xl",
          "focus-within:relative focus-within:z-20",
          cellSize,
        ),
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          buttonSize,
          "rounded-xl hover:rounded-xl focus:rounded-xl transition-all duration-200",
          isModern && "hover:bg-primary/10 hover:text-primary font-medium",
        ),
        range_end: "day-range-end",
        selected: cn(
          "bg-primary text-primary-foreground",
          "hover:bg-primary hover:text-primary-foreground",
          "focus:bg-primary focus:text-primary-foreground",
          "rounded-xl shadow-md",
          isModern && "shadow-primary/25",
        ),
        today: cn(
          "relative",
          isModern
            ? "bg-gradient-to-br from-primary/15 to-primary/5 text-primary font-semibold rounded-xl ring-1 ring-primary/30"
            : "bg-accent text-accent-foreground rounded-xl",
        ),
        outside: cn(
          "day-outside text-muted-foreground/40",
          "aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
          isModern && "opacity-30",
        ),
        disabled: "text-muted-foreground opacity-30 cursor-not-allowed",
        range_middle: cn(
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
          isModern && "aria-selected:bg-primary/10",
        ),
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
