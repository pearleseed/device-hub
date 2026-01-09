import React, { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { format, differenceInDays, addDays, startOfDay, isBefore, isAfter, isSameDay, eachDayOfInterval, startOfMonth, endOfMonth, getDay, addMonths, subMonths, isToday } from "date-fns";
import { UserNavbar } from "@/components/layout/UserNavbar";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  getUserById,
  getCategoryIcon,
} from "@/lib/mockData";
import { useDevice, useDevices } from "@/hooks/use-data-cache";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useFavorites } from "@/hooks/use-favorites";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import type { DateRange } from "react-day-picker";
import {
  ArrowLeft,
  CalendarIcon,
  Cpu,
  HardDrive,
  Battery,
  Monitor,
  CheckCircle2,
  Sparkles,
  Clock,
  ArrowRight,
  Heart,
  Share2,
  Info,
  Package,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CalendarDays,
  X,
} from "lucide-react";

type PageStep = "details" | "confirm" | "success";

const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

// Compact collapsible calendar component for date range selection
interface CompactDateRangeCalendarProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  disabledBefore?: Date;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const CompactDateRangeCalendar: React.FC<CompactDateRangeCalendarProps> = ({
  dateRange,
  onDateRangeChange,
  disabledBefore = new Date(),
  isOpen,
  onOpenChange,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

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
    return isBefore(startOfDay(date), startOfDay(disabledBefore));
  };

  const isInRange = (date: Date) => {
    if (!dateRange?.from) return false;
    const end = dateRange.to || hoverDate;
    if (!end) return false;
    return (isAfter(date, dateRange.from) || isSameDay(date, dateRange.from)) &&
           (isBefore(date, end) || isSameDay(date, end));
  };

  const isRangeStart = (date: Date) => {
    return dateRange?.from && isSameDay(date, dateRange.from);
  };

  const isRangeEnd = (date: Date) => {
    return dateRange?.to && isSameDay(date, dateRange.to);
  };

  const handleDateClick = (date: Date) => {
    if (isDisabled(date)) return;

    if (!dateRange?.from || dateRange.to) {
      // Start new selection
      onDateRangeChange({ from: date, to: undefined });
    } else {
      // Complete selection
      if (isBefore(date, dateRange.from)) {
        onDateRangeChange({ from: date, to: dateRange.from });
      } else {
        onDateRangeChange({ from: dateRange.from, to: date });
      }
      // Close calendar after selection is complete
      onOpenChange(false);
    }
  };

  const loanDuration = dateRange?.from && dateRange?.to
    ? differenceInDays(dateRange.to, dateRange.from) + 1
    : 0;

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDateRangeChange(undefined);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={cn(
            "w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200",
            "hover:border-primary/50 hover:bg-muted/30",
            "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1",
            isOpen 
              ? "border-primary/50 bg-primary/5" 
              : "border-border bg-card",
            dateRange?.from && dateRange?.to && "border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg transition-colors",
              dateRange?.from && dateRange?.to 
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "bg-muted text-muted-foreground"
            )}>
              <CalendarDays className="h-4 w-4" />
            </div>
            <div className="text-left">
              {dateRange?.from ? (
                <>
                  <p className="text-sm font-medium">
                    {format(dateRange.from, "MMM d")}
                    {dateRange.to && (
                      <>
                        <span className="text-muted-foreground mx-1">→</span>
                        {format(dateRange.to, "MMM d, yyyy")}
                      </>
                    )}
                    {!dateRange.to && (
                      <span className="text-muted-foreground ml-1">
                        – Select end date
                      </span>
                    )}
                  </p>
                  {loanDuration > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {loanDuration} day{loanDuration !== 1 ? "s" : ""} selected
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Click to select dates
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {dateRange?.from && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded-md hover:bg-muted transition-colors"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
            <ChevronDown className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180"
            )} />
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
            <span className="font-semibold text-sm">{format(currentMonth, "MMM yyyy")}</span>
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
              {weekDays.map((day, i) => (
                <div
                  key={i}
                  className="py-1.5 text-center text-[10px] font-semibold text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                const disabled = isDisabled(day);
                const inRange = isInRange(day);
                const rangeStart = isRangeStart(day);
                const rangeEnd = isRangeEnd(day);
                const isTodayDate = isToday(day);

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => handleDateClick(day)}
                    onMouseEnter={() => {
                      if (dateRange?.from && !dateRange.to) {
                        setHoverDate(day);
                      }
                    }}
                    onMouseLeave={() => setHoverDate(null)}
                    disabled={disabled}
                    className={cn(
                      "aspect-square text-xs font-medium transition-all duration-150",
                      "flex items-center justify-center",
                      "focus:outline-none focus:ring-1 focus:ring-primary/30",
                      disabled && "opacity-30 cursor-not-allowed",
                      !disabled && "hover:bg-muted/80 cursor-pointer",
                      inRange && !rangeStart && !rangeEnd && "bg-primary/10",
                      rangeStart && "bg-primary text-primary-foreground rounded-l-md",
                      rangeEnd && "bg-primary text-primary-foreground rounded-r-md",
                      rangeStart && rangeEnd && "rounded-md",
                      isTodayDate && !rangeStart && !rangeEnd && "ring-1 ring-primary/50 font-bold"
                    )}
                  >
                    {format(day, "d")}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hint */}
          <div className="px-3 py-2 border-t border-border/30 bg-muted/10">
            <p className="text-[10px] text-muted-foreground text-center">
              {!dateRange?.from 
                ? "Select start date" 
                : !dateRange?.to 
                  ? "Now select end date"
                  : "Date range selected ✓"}
            </p>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

const DeviceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addToRecentlyViewed } = useRecentlyViewed();

  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [reason, setReason] = useState("");
  const [step, setStep] = useState<PageStep>("details");
  const [calendarOpen, setCalendarOpen] = useState(false);

  const { data: device, isLoading } = useDevice(id);
  const { data: allDevices = [] } = useDevices();

  // Track view
  React.useEffect(() => {
    if (device) {
      addToRecentlyViewed(device.id);
    }
  }, [device, addToRecentlyViewed]);

  const assignedUser = device?.assignedTo
    ? getUserById(device.assignedTo)
    : null;

  // Get similar devices
  const similarDevices = useMemo(() => {
    if (!device) return [];
    return allDevices
      .filter(
        (d) =>
          d.category === device.category &&
          d.id !== device.id &&
          d.status === "available"
      )
      .slice(0, 4);
  }, [device, allDevices]);

  if (!device) {
    return (
      <div className="min-h-screen bg-background">
        <UserNavbar />
        <div className="container px-4 md:px-6 py-8">
          <div className="text-center py-20">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Device Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The device you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate("/catalog")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Catalog
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const specItems = [
    { icon: Cpu, label: "Processor", value: device.specs.processor },
    { icon: HardDrive, label: "Storage", value: device.specs.storage },
    { icon: Monitor, label: "Display", value: device.specs.display },
    { icon: Battery, label: "Battery", value: device.specs.battery },
  ].filter((item) => item.value);

  const loanDuration =
    dateRange?.from && dateRange?.to
      ? differenceInDays(dateRange.to, dateRange.from) + 1
      : 0;

  const handleProceedToConfirm = () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast({
        title: "Please select dates",
        description: "Both start and end dates are required.",
        variant: "destructive",
      });
      return;
    }

    if (!reason.trim()) {
      toast({
        title: "Please provide a reason",
        description: "A reason for the request is required.",
        variant: "destructive",
      });
      return;
    }

    setStep("confirm");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleConfirmRequest = () => {
    setStep("success");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReset = () => {
    setDateRange(undefined);
    setReason("");
    setStep("details");
  };

  const handleQuickDateSelect = (days: number) => {
    const from = new Date();
    const to = addDays(from, days);
    setDateRange({ from, to });
    setCalendarOpen(false);
  };

  const handleFavoriteToggle = () => {
    toggleFavorite(device.id);
    toast({
      title: isFavorite(device.id)
        ? "Removed from favorites"
        : "Added to favorites",
      description: device.name,
    });
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Device link has been copied to clipboard.",
      });
    } catch {
      toast({
        title: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  // Success Step
  if (step === "success") {
    return (
      <div className="min-h-screen bg-background">
        <UserNavbar />
        <div className="container px-4 md:px-6 py-8">
          <div className="max-w-lg mx-auto text-center py-12">
            <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-8 animate-scale-in">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold mb-3 animate-fade-in">
              Request Submitted!
            </h1>
            <p className="text-lg text-muted-foreground mb-8 animate-fade-in">
              Your request for{" "}
              <span className="font-medium text-foreground">{device.name}</span>{" "}
              has been sent for approval.
            </p>

            <Card className="mb-8 animate-fade-in">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 text-left">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Estimated approval time
                    </p>
                    <p className="font-semibold">1-2 business days</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3 animate-fade-in">
              <Button
                onClick={() => navigate("/dashboard")}
                className="w-full"
                size="lg"
              >
                Go to Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/catalog")}
                className="w-full"
                size="lg"
              >
                Browse More Devices
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Confirmation Step
  if (step === "confirm") {
    return (
      <div className="min-h-screen bg-background">
        <UserNavbar />
        <div className="container px-4 md:px-6 py-8">
          <div className="max-w-2xl mx-auto">
            <Button
              variant="ghost"
              onClick={() => setStep("details")}
              className="mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Details
            </Button>

            <h1 className="text-2xl font-bold mb-2">Confirm Your Request</h1>
            <p className="text-muted-foreground mb-8">
              Please review the details before submitting.
            </p>

            <div className="space-y-6">
              {/* Device Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Device</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted shrink-0">
                      <img
                        src={device.image}
                        alt={device.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{device.name}</h3>
                      <p className="text-muted-foreground">
                        {device.brand} • {device.model}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {device.assetTag}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Loan Period */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Loan Period
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold text-lg">
                    {dateRange?.from && format(dateRange.from, "MMMM d, yyyy")}{" "}
                    – {dateRange?.to && format(dateRange.to, "MMMM d, yyyy")}
                  </p>
                  <p className="text-muted-foreground mt-1">
                    {loanDuration} day{loanDuration !== 1 ? "s" : ""}
                  </p>
                </CardContent>
              </Card>

              {/* Reason */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Reason for Request
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground">{reason}</p>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep("details")}
                  className="flex-1"
                  size="lg"
                >
                  Edit Request
                </Button>
                <Button
                  onClick={handleConfirmRequest}
                  className="flex-1"
                  size="lg"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Submit Request
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Details Step (default)
  return (
    <div className="min-h-screen bg-background">
      <UserNavbar />

      <div className="container px-4 md:px-6 pt-4">
        <BreadcrumbNav
          items={[
            { label: "Catalog", href: "/catalog" },
            { label: device.name },
          ]}
        />
      </div>

      <div className="container px-4 md:px-6 py-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/catalog")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Catalog
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Image and Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Image */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
              <img
                src={device.image}
                alt={device.name}
                className="object-cover w-full h-full"
              />
              <div className="absolute top-4 left-4">
                <StatusBadge
                  status={device.status}
                  className="text-sm px-3 py-1"
                />
              </div>

              {/* Action Buttons */}
              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                  onClick={handleFavoriteToggle}
                >
                  <Heart
                    className={cn(
                      "h-5 w-5",
                      isFavorite(device.id) && "fill-red-500 text-red-500"
                    )}
                  />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                  onClick={handleShare}
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Device Info */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">
                  {getCategoryIcon(device.category)}
                </span>
                <span className="text-sm text-muted-foreground uppercase tracking-wide">
                  {device.category}
                </span>
              </div>
              <h1 className="text-3xl font-bold mb-2">{device.name}</h1>
              <p className="text-lg text-muted-foreground">
                {device.brand} • {device.model}
              </p>
              <p className="text-muted-foreground mt-1 font-mono">
                {device.assetTag}
              </p>
            </div>

            {/* Specifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Specifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {device.specs.os && (
                  <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg mb-4">
                    <span className="text-sm font-medium">
                      Operating System:
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {device.specs.os}
                    </span>
                  </div>
                )}
                <div className="grid sm:grid-cols-2 gap-4">
                  {specItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-secondary rounded-lg"
                    >
                      <item.icon className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">
                          {item.label}
                        </p>
                        <p className="font-medium truncate">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* RAM if available */}
                {device.specs.ram && (
                  <div className="mt-4 flex items-center gap-3 p-3 bg-secondary rounded-lg">
                    <div className="h-5 w-5 flex items-center justify-center text-muted-foreground shrink-0">
                      <span className="text-xs font-bold">RAM</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Memory</p>
                      <p className="font-medium">{device.specs.ram}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Current Assignment */}
            {assignedUser && (
              <Card>
                <CardHeader>
                  <CardTitle>Currently Assigned</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <img
                      src={assignedUser.avatar}
                      alt={assignedUser.name}
                      className="h-10 w-10 rounded-full"
                    />
                    <div>
                      <p className="font-medium">{assignedUser.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {assignedUser.department}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Similar Devices */}
            {similarDevices.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Also Available
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {similarDevices.map((similarDevice) => (
                      <Link
                        key={similarDevice.id}
                        to={`/device/${similarDevice.id}`}
                        className="p-3 border rounded-lg hover:bg-muted transition-colors group"
                      >
                        <div className="aspect-4/3 rounded-lg overflow-hidden bg-muted mb-2">
                          <img
                            src={similarDevice.image}
                            alt={similarDevice.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <h5 className="font-medium text-sm truncate">
                          {similarDevice.name}
                        </h5>
                        <p className="text-xs text-muted-foreground truncate">
                          {similarDevice.brand}
                        </p>
                        <Badge variant="outline" className="mt-2 text-xs">
                          Available
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Booking Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <Card className="overflow-hidden border-0 shadow-xl shadow-black/5">
                <CardHeader className="bg-linear-to-br from-card to-muted/30 border-b border-border/30 py-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    {device.status === "available"
                      ? "Request this Device"
                      : "Device Unavailable"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {device.status === "available" ? (
                    <div className="space-y-4">
                      {/* Quick Date Presets */}
                      <div>
                        <Label className="text-xs text-muted-foreground mb-2 block">
                          Quick select
                        </Label>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { label: "1 Week", days: 7 },
                            { label: "2 Weeks", days: 14 },
                            { label: "1 Month", days: 30 },
                          ].map((preset) => (
                            <Button
                              key={preset.days}
                              variant="outline"
                              size="sm"
                              className={cn(
                                "rounded-lg h-8 text-xs transition-all",
                                loanDuration === preset.days && "bg-primary/10 border-primary/50"
                              )}
                              onClick={() => handleQuickDateSelect(preset.days)}
                            >
                              {preset.label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Collapsible Date Range Calendar */}
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Select Date Range</Label>
                        <CompactDateRangeCalendar
                          dateRange={dateRange}
                          onDateRangeChange={setDateRange}
                          disabledBefore={new Date()}
                          isOpen={calendarOpen}
                          onOpenChange={setCalendarOpen}
                        />
                      </div>

                      {/* Reason */}
                      <div className="space-y-2">
                        <Label htmlFor="reason" className="text-xs font-medium">Reason for Request</Label>
                        <Textarea
                          id="reason"
                          placeholder="Please describe why you need this device..."
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          rows={3}
                          className="resize-none rounded-xl text-sm"
                        />
                      </div>

                      <Button
                        onClick={handleProceedToConfirm}
                        className="w-full rounded-xl h-11"
                        size="lg"
                        disabled={!dateRange?.from || !dateRange?.to || !reason.trim()}
                      >
                        Review Request
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground mb-2">
                        This device is currently{" "}
                        {device.status === "borrowed"
                          ? "borrowed"
                          : "under maintenance"}
                        .
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Check back later or browse other available devices.
                      </p>
                      <Button
                        variant="outline"
                        className="mt-4 w-full"
                        onClick={() => navigate("/catalog")}
                      >
                        Browse Available Devices
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceDetail;
