import React, { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  format,
  differenceInDays,
  addDays,
  startOfDay,
  isBefore,
  isAfter,
  isSameDay,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  getDay,
  addMonths,
  subMonths,
  isToday,
} from "date-fns";
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
import { useDevice, useDevices, useUsers } from "@/hooks/use-api-queries";
import { cn, getDeviceImageUrl, getDeviceThumbnailUrl } from "@/lib/utils";
import { getCategoryIcon } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { useFavorites } from "@/hooks/use-favorites";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import type { DateRange } from "react-day-picker";
import { useLanguage } from "@/contexts/LanguageContext";
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

// Week days mapping for translation
const weekDayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

// Compact collapsible calendar component for date range selection
interface CompactDateRangeCalendarProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  disabledBefore?: Date;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const CompactDateRangeCalendar: React.FC<CompactDateRangeCalendarProps> = ({
  dateRange,
  onDateRangeChange,
  disabledBefore = new Date(),
  isOpen,
  onOpenChange,
  t,
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
    return (
      (isAfter(date, dateRange.from) || isSameDay(date, dateRange.from)) &&
      (isBefore(date, end) || isSameDay(date, end))
    );
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

  const loanDuration =
    dateRange?.from && dateRange?.to
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
            isOpen ? "border-primary/50 bg-primary/5" : "border-border bg-card",
            dateRange?.from &&
              dateRange?.to &&
              "border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20",
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2 rounded-lg transition-colors",
                dateRange?.from && dateRange?.to
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground",
              )}
            >
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
                        – {t("deviceDetail.selectEndDate")}
                      </span>
                    )}
                  </p>
                  {loanDuration > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {t("deviceDetail.daySelected", { count: loanDuration })}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("deviceDetail.clickToSelectDates")}
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
                      rangeStart &&
                        "bg-primary text-primary-foreground rounded-l-md",
                      rangeEnd &&
                        "bg-primary text-primary-foreground rounded-r-md",
                      rangeStart && rangeEnd && "rounded-md",
                      isTodayDate &&
                        !rangeStart &&
                        !rangeEnd &&
                        "ring-1 ring-primary/50 font-bold",
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
                ? t("deviceDetail.selectStartDate")
                : !dateRange?.to
                  ? t("deviceDetail.nowSelectEndDate")
                  : t("deviceDetail.dateRangeSelected")}
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
  const { t } = useLanguage();

  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [reason, setReason] = useState("");
  const [step, setStep] = useState<PageStep>("details");
  const [calendarOpen, setCalendarOpen] = useState(false);

  const deviceId = id ? parseInt(id, 10) : 0;
  const { data: device, isLoading } = useDevice(deviceId);
  const { data: allDevices = [] } = useDevices();
  const { data: users = [] } = useUsers();

  // Create user lookup map
  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const getUserById = (userId: number) => userMap.get(userId);

  // Track view
  React.useEffect(() => {
    if (device) {
      addToRecentlyViewed(String(device.id));
    }
  }, [device, addToRecentlyViewed]);

  const assignedUser = device?.assigned_to_id
    ? getUserById(device.assigned_to_id)
    : null;

  // Get similar devices
  const similarDevices = useMemo(() => {
    if (!device) return [];
    return allDevices
      .filter(
        (d) =>
          d.category === device.category &&
          d.id !== device.id &&
          d.status === "available",
      )
      .slice(0, 4);
  }, [device, allDevices]);

  // Parse specs from JSON string - must be before early returns to maintain hooks order
  const specs = useMemo(() => {
    try {
      return device?.specs_json ? JSON.parse(device.specs_json) : {};
    } catch {
      return {};
    }
  }, [device]);

  // Show loading state while fetching
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <UserNavbar />
        <div className="container px-4 md:px-6 py-8">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">{t("deviceDetail.loading")}</p>
          </div>
        </div>
      </div>
    );
  }

  // Show not found only after loading is complete
  if (!device) {
    return (
      <div className="min-h-screen bg-background">
        <UserNavbar />
        <div className="container px-4 md:px-6 py-8">
          <div className="text-center py-20">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">
              {t("deviceDetail.deviceNotFound")}
            </h1>
            <p className="text-muted-foreground mb-6">
              {t("deviceDetail.deviceNotFoundDesc")}
            </p>
            <Button onClick={() => navigate("/catalog")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("deviceDetail.backToCatalog")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const specItems = [
    { icon: Cpu, label: t("deviceDetail.processor"), value: specs.processor },
    { icon: HardDrive, label: t("deviceDetail.storage"), value: specs.storage },
    { icon: Monitor, label: t("deviceDetail.display"), value: specs.display },
    { icon: Battery, label: t("deviceDetail.battery"), value: specs.battery },
  ].filter((item) => item.value);

  const loanDuration =
    dateRange?.from && dateRange?.to
      ? differenceInDays(dateRange.to, dateRange.from) + 1
      : 0;

  const handleProceedToConfirm = () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast({
        title: t("deviceDetail.pleaseSelectDatesTitle"),
        description: t("deviceDetail.bothDatesRequiredDesc"),
        variant: "destructive",
      });
      return;
    }

    if (!reason.trim()) {
      toast({
        title: t("deviceDetail.pleaseProvideReasonTitle"),
        description: t("deviceDetail.reasonRequiredDesc"),
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
    toggleFavorite(String(device.id));
    toast({
      title: isFavorite(String(device.id))
        ? t("deviceDetail.removedFromFavorites")
        : t("deviceDetail.addedToFavorites"),
      description: device.name,
    });
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: t("deviceDetail.linkCopied"),
        description: t("deviceDetail.linkCopiedDesc"),
      });
    } catch {
      toast({
        title: t("deviceDetail.failedToCopyLink"),
        variant: "destructive",
      });
    }
  };

  // Success Step
  if (step === "success") {
    // Calculate estimated pickup time (next business day 9 AM - 5 PM)
    const getEstimatedPickupTime = () => {
      const now = new Date();
      let pickupDate = addDays(now, 1); // Start with tomorrow

      // Skip weekends
      while (pickupDate.getDay() === 0 || pickupDate.getDay() === 6) {
        pickupDate = addDays(pickupDate, 1);
      }

      return pickupDate;
    };

    const estimatedPickup = getEstimatedPickupTime();

    return (
      <div className="min-h-screen bg-background">
        <UserNavbar />
        <div className="container px-4 md:px-6 py-8">
          <div className="max-w-lg mx-auto text-center py-12">
            <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-8 animate-scale-in">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold mb-3 animate-fade-in">
              {t("deviceDetail.requestSubmittedTitle")}
            </h1>
            <p className="text-lg text-muted-foreground mb-8 animate-fade-in">
              {t("deviceDetail.requestSubmittedDesc", { device: device.name })}
            </p>

            <Card className="mb-8 animate-fade-in">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3 text-left">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t("deviceDetail.estimatedApprovalTime")}
                    </p>
                    <p className="font-semibold">
                      {t("deviceDetail.estimatedApprovalDuration")}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3 text-left">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t("deviceDetail.estimatedPickup")}
                    </p>
                    <p className="font-semibold">
                      {format(estimatedPickup, "EEEE, MMMM d, yyyy")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("deviceDetail.pickupAvailability")}
                    </p>
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
                {t("deviceDetail.goToDashboard")}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/catalog")}
                className="w-full"
                size="lg"
              >
                {t("deviceDetail.browseMoreDevices")}
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
              {t("deviceDetail.backToDetails")}
            </Button>

            <h1 className="text-2xl font-bold mb-2">
              {t("deviceDetail.confirmRequestTitle")}
            </h1>
            <p className="text-muted-foreground mb-8">
              {t("deviceDetail.confirmRequestDesc")}
            </p>

            <div className="space-y-6">
              {/* Device Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {t("deviceDetail.deviceLabel")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted shrink-0">
                      <img
                        src={getDeviceThumbnailUrl(
                          device.image_thumbnail_url,
                          device.image_url,
                          device.category,
                        )}
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
                        {device.asset_tag}
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
                    {t("deviceDetail.loanPeriod")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold text-lg">
                    {dateRange?.from && format(dateRange.from, "MMMM d, yyyy")}{" "}
                    – {dateRange?.to && format(dateRange.to, "MMMM d, yyyy")}
                  </p>
                  <p className="text-muted-foreground mt-1">
                    {t("deviceDetail.daySelected", { count: loanDuration })}
                  </p>
                </CardContent>
              </Card>

              {/* Reason */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {t("deviceDetail.reasonLabel")}
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
                  {t("deviceDetail.editRequest")}
                </Button>
                <Button
                  onClick={handleConfirmRequest}
                  className="flex-1"
                  size="lg"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t("deviceDetail.submitRequest")}
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
            { label: t("common.catalog"), href: "/catalog" },
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
          {t("deviceDetail.backToCatalog")}
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Image and Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Image */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
              <img
                src={getDeviceImageUrl(device.image_url, device.category)}
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
                      isFavorite(String(device.id)) &&
                        "fill-red-500 text-red-500",
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
                  {t(`category.${device.category}` as any)}
                </span>
              </div>
              <h1 className="text-3xl font-bold mb-2">{device.name}</h1>
              <p className="text-lg text-muted-foreground">
                {device.brand} • {device.model}
              </p>
              <p className="text-muted-foreground mt-1 font-mono">
                {device.asset_tag}
              </p>
            </div>

            {/* Specifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  {t("deviceDetail.specifications")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {specs.os && (
                  <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg mb-4">
                    <span className="text-sm font-medium">
                      {t("deviceDetail.operatingSystemLabel")}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {specs.os}
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
                {specs.ram && (
                  <div className="mt-4 flex items-center gap-3 p-3 bg-secondary rounded-lg">
                    <div className="h-5 w-5 flex items-center justify-center text-muted-foreground shrink-0">
                      <span className="text-xs font-bold">
                        {t("deviceDetail.ram")}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">
                        {t("deviceDetail.memory")}
                      </p>
                      <p className="font-medium">{specs.ram}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Current Assignment */}
            {assignedUser && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("deviceDetail.currentlyAssignedTo")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <img
                      src={assignedUser.avatar_url || ""}
                      alt={assignedUser.name}
                      className="h-10 w-10 rounded-full"
                    />
                    <div>
                      <p className="font-medium">{assignedUser.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {assignedUser.department_name}
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
                    {t("deviceDetail.alsoAvailableTitle")}
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
                            src={getDeviceThumbnailUrl(
                              similarDevice.image_thumbnail_url,
                              similarDevice.image_url,
                              similarDevice.category,
                            )}
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
                          {t("deviceCatalog.available")}
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
                      ? t("deviceDetail.requestThisDevice")
                      : t("deviceDetail.deviceUnavailableTitle")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {device.status === "available" ? (
                    <div className="space-y-4">
                      {/* Quick Date Presets */}
                      <div>
                        <Label className="text-xs text-muted-foreground mb-2 block">
                          {t("deviceDetail.quickSelectLabel")}
                        </Label>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { label: t("deviceDetail.oneWeek"), days: 7 },
                            { label: t("deviceDetail.twoWeeks"), days: 14 },
                            { label: t("deviceDetail.oneMonth"), days: 30 },
                          ].map((preset) => (
                            <Button
                              key={preset.days}
                              variant="outline"
                              size="sm"
                              className={cn(
                                "rounded-lg h-8 text-xs transition-all",
                                loanDuration === preset.days &&
                                  "bg-primary/10 border-primary/50",
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
                        <Label className="text-xs font-medium">
                          {t("deviceDetail.selectDateRangeLabel")}
                        </Label>
                        <CompactDateRangeCalendar
                          dateRange={dateRange}
                          onDateRangeChange={setDateRange}
                          disabledBefore={new Date()}
                          isOpen={calendarOpen}
                          onOpenChange={setCalendarOpen}
                          t={t}
                        />
                      </div>

                      {/* Reason */}
                      <div className="space-y-2">
                        <Label htmlFor="reason" className="text-xs font-medium">
                          {t("deviceDetail.reasonForRequestLabel")}
                        </Label>
                        <Textarea
                          id="reason"
                          placeholder={t("deviceDetail.reasonPlaceholderText")}
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
                        disabled={
                          !dateRange?.from || !dateRange?.to || !reason.trim()
                        }
                      >
                        {t("deviceDetail.reviewRequestButton")}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground mb-2">
                        {t("deviceDetail.thisDeviceCurrently")}{" "}
                        {device.status === "borrowed"
                          ? t("deviceDetail.borrowedStatus")
                          : t("deviceDetail.underMaintenanceStatus")}
                        .
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t("deviceDetail.checkBackLater")}
                      </p>
                      <Button
                        variant="outline"
                        className="mt-4 w-full"
                        onClick={() => navigate("/catalog")}
                      >
                        {t("deviceDetail.browseAvailableDevices")}
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
