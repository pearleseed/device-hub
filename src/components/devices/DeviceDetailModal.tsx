import React, { useState } from "react";
import { format, differenceInDays } from "date-fns";
import type { DeviceWithDepartment } from "@/types/api";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CalendarIcon,
  Cpu,
  HardDrive,
  Battery,
  Monitor,
  CheckCircle2,
  Sparkles,
  Clock,
  ArrowRight,
} from "lucide-react";
import { cn, getDeviceImageUrl, getDeviceThumbnailUrl, parseSpecs } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useCreateBorrowRequest } from "@/hooks/use-api-mutations";
import type { DateRange } from "react-day-picker";

interface DeviceDetailModalProps {
  device: DeviceWithDepartment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ModalStep = "details" | "confirm" | "success";

export const DeviceDetailModal: React.FC<DeviceDetailModalProps> = ({
  device,
  open,
  onOpenChange,
}) => {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [reason, setReason] = useState("");
  const [step, setStep] = useState<ModalStep>("details");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Mutation hook for creating borrow request
  const createBorrowRequest = useCreateBorrowRequest();

  if (!device) return null;

  const specs = parseSpecs(device.specs_json);

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
  };

  const handleConfirmRequest = async () => {
    if (!device || !dateRange?.from || !dateRange?.to) return;
    
    setIsSubmitting(true);
    
    try {
      await createBorrowRequest.mutateAsync({
        device_id: device.id,
        start_date: format(dateRange.from, "yyyy-MM-dd"),
        end_date: format(dateRange.to, "yyyy-MM-dd"),
        reason: reason.trim(),
      });
      
      setStep("success");
    } catch (error) {
      // Error is already handled by the mutation hook's onError
      console.error("Failed to submit borrow request:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setDateRange(undefined);
    setReason("");
    setStep("details");
    onOpenChange(false);
  };

  const handleQuickDateSelect = (days: number) => {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + days);
    setDateRange({ from, to });
  };

  const loanDuration =
    dateRange?.from && dateRange?.to
      ? differenceInDays(dateRange.to, dateRange.from) + 1
      : 0;

  // Success Step
  if (step === "success") {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Request Submitted!</h2>
            <p className="text-muted-foreground mb-6">
              Your request for{" "}
              <span className="font-medium text-foreground">{device.name}</span>{" "}
              has been sent for approval.
            </p>

            <div className="bg-muted rounded-lg p-4 mb-6 text-left">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Clock className="h-4 w-4" />
                <span>Estimated approval time</span>
              </div>
              <p className="font-medium">1-2 business days</p>
            </div>

            <div className="space-y-3">
              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
                className="w-full"
              >
                View My Requests
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Confirmation Step
  if (step === "confirm") {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Your Request</DialogTitle>
            <DialogDescription>
              Please review the details before submitting.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex gap-4 p-4 bg-muted rounded-lg">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-background shrink-0">
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
                <h4 className="font-medium">{device.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {device.brand} • {device.model}
                </p>
                <p className="text-sm text-muted-foreground">
                  {device.asset_tag}
                </p>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <CalendarIcon className="h-4 w-4" />
                <span>Loan Period</span>
              </div>
              <p className="font-medium">
                {dateRange?.from && format(dateRange.from, "MMM d, yyyy")} –{" "}
                {dateRange?.to && format(dateRange.to, "MMM d, yyyy")}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {loanDuration} day{loanDuration !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Reason</p>
              <p className="text-sm">{reason}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep("details")}
              className="flex-1"
              disabled={isSubmitting}
            >
              Back
            </Button>
            <Button onClick={handleConfirmRequest} className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Details Step (default)
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">{device.name}</DialogTitle>
              <DialogDescription>
                {device.brand} • {device.model}
              </DialogDescription>
            </div>
            <StatusBadge status={device.status} />
          </div>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 mt-4">
          <div className="aspect-4/3 rounded-lg overflow-hidden bg-muted">
            <img
              src={getDeviceImageUrl(device.image_url, device.category)}
              alt={device.name}
              className="object-cover w-full h-full"
            />
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground">Asset Tag</p>
              <p className="font-mono text-lg">{device.asset_tag}</p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                Specifications
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(specs).map(([key, value]) => {
                  if (!value) return null;
                  const Icon = key.toLowerCase().includes("cpu") || key.toLowerCase().includes("processor") ? Cpu :
                               key.toLowerCase().includes("storage") || key.toLowerCase().includes("ssd") || key.toLowerCase().includes("hdd") ? HardDrive :
                               key.toLowerCase().includes("display") || key.toLowerCase().includes("screen") || key.toLowerCase().includes("resolution") ? Monitor :
                               key.toLowerCase().includes("battery") ? Battery : Cpu;
                  
                  return (
                    <div
                      key={key}
                      className="flex items-center gap-2 bg-secondary rounded-lg p-3"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground capitalize">
                          {key.replace(/_/g, " ")}
                        </p>
                        <p className="text-sm font-medium truncate" title={value}>
                          {value}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {device.assigned_to_name && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Currently assigned to
                </p>
                <p className="font-medium">{device.assigned_to_name}</p>
                {device.department_name && (
                  <p className="text-sm text-muted-foreground">
                    {device.department_name}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {device.status === "available" && (
          <div className="border-t pt-6 mt-6 space-y-4">
            <h4 className="font-semibold">Request this Device</h4>

            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground mr-2">
                Quick select:
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickDateSelect(7)}
              >
                1 Week
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickDateSelect(14)}
              >
                2 Weeks
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickDateSelect(30)}
              >
                1 Month
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Select Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "MMM d, yyyy")} –{" "}
                          {format(dateRange.to, "MMM d, yyyy")}
                          {loanDuration > 0 && (
                            <Badge variant="secondary" className="ml-auto">
                              {loanDuration} day{loanDuration !== 1 ? "s" : ""}
                            </Badge>
                          )}
                        </>
                      ) : (
                        format(dateRange.from, "MMM d, yyyy")
                      )
                    ) : (
                      <span>Select start and end dates</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    disabled={(date) => date < new Date()}
                    numberOfMonths={2}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Request</Label>
              <Textarea
                id="reason"
                placeholder="Please describe why you need this device..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>

            <Button onClick={handleProceedToConfirm} className="w-full">
              Review Request
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {device.status !== "available" && (
          <div className="border-t pt-6 mt-6">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-muted-foreground">
                This device is currently{" "}
                {device.status === "inuse"
                  ? "in use"
                  : "under maintenance"}
                .
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Check back later or browse other available devices.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
