import React, { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  subMonths,
  addMonths,
  isBefore,
  startOfDay,
  isSameDay,
  isToday,
} from "date-fns";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  CalendarIcon
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface CompactDatePickerProps {
  selected: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  placeholder?: string;
  className?: string;
}

const weekDayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export const CompactDatePicker: React.FC<CompactDatePickerProps> = ({
  selected,
  onSelect,
  disabled,
  placeholder,
  className,
}) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(selected || new Date());

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startPadding = getDay(monthStart);
    const paddingDays: (Date | null)[] = Array(startPadding).fill(null);
    return [...paddingDays, ...days];
  }, [currentMonth]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const isDisabled = (date: Date) => {
    return disabled ? disabled(date) : false;
  };

  const handleDateClick = (date: Date) => {
    if (isDisabled(date)) return;
    onSelect(date);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(undefined);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={cn(
            "w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200",
            "hover:border-primary/50 hover:bg-muted/30",
            "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1",
            isOpen ? "border-primary/50 bg-primary/5" : "border-border bg-card",
            selected &&
              "border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20",
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2 rounded-lg transition-colors",
                selected
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <CalendarDays className="h-4 w-4" />
            </div>
            <div className="text-left">
              {selected ? (
                <p className="text-sm font-medium">
                  {format(selected, "PPP")}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {placeholder || t("common.pickDate")}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selected && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleClear(e as unknown as React.MouseEvent);
                  }
                }}
                className="p-1 rounded-md hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </span>
            )}
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                isOpen && "rotate-180",
              )}
            />
          </div>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
        <div className="mt-3 bg-card rounded-xl border border-border/50 shadow-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 bg-muted/20">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={handlePrevMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold text-sm">
              {format(currentMonth, "MMM yyyy")}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={handleNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="p-2">
            {/* Week days header */}
            <div className="grid grid-cols-7 mb-1">
              {weekDayKeys.map((key) => (
                <div
                  key={key}
                  className="py-1.5 text-center text-[10px] font-semibold text-muted-foreground"
                >
                  {t(`weekdays.${key}` as any)}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {calendarDays.map((day, index) => {
                if (!day) {
                  return (
                    <div key={`empty-${index}`} className="aspect-square" />
                  );
                }

                const disabled = isDisabled(day);
                const isSelected = selected ? isSameDay(day, selected) : false;
                const isTodayDate = isToday(day);

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => handleDateClick(day)}
                    disabled={disabled}
                    className={cn(
                      "aspect-square text-xs font-medium transition-all duration-150",
                      "flex items-center justify-center rounded-md",
                      "focus:outline-none focus:ring-1 focus:ring-primary/30",
                      disabled && "opacity-30 cursor-not-allowed",
                      !disabled && "hover:bg-muted/80 cursor-pointer",
                      isSelected &&
                        "bg-primary text-primary-foreground font-semibold shadow-sm hover:bg-primary/90",
                      !isSelected && isTodayDate &&
                        "ring-1 ring-primary/50 font-bold text-primary",
                    )}
                  >
                    {format(day, "d")}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
