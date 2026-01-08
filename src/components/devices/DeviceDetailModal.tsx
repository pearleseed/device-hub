import React, { useState, useEffect } from "react";
import { usersAPI, borrowingAPI } from "@/lib/api";
import type {
  DeviceCategory,
  DeviceStatus,
  User,
  BorrowingRequest,
} from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Calendar as CalendarIcon,
  User as UserIcon,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { SuccessAnimation } from "@/components/ui/success-animation";

// Legacy Device interface
interface Device {
  id: string;
  name: string;
  category: DeviceCategory;
  brand: string;
  model: string;
  assetTag: string;
  status: DeviceStatus;
  assignedTo: string | null;
  specs: Record<string, string | undefined>;
  image: string;
  addedDate: string;
}

interface DeviceDetailModalProps {
  device: Device | null;
  open: boolean;
  onClose: () => void;
}

export const DeviceDetailModal: React.FC<DeviceDetailModalProps> = ({
  device,
  open,
  onClose,
}) => {
  const { user } = useAuth();
  const [assignedUser, setAssignedUser] = useState<User | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetchAssignedUser = async () => {
      if (device?.assignedTo) {
        const response = await usersAPI.getById(parseInt(device.assignedTo));
        if (response.success && response.data) {
          setAssignedUser(response.data);
        }
      } else {
        setAssignedUser(null);
      }
    };

    fetchAssignedUser();
  }, [device?.assignedTo]);

  if (!device) return null;

  const statusColors: Record<DeviceStatus, string> = {
    available: "bg-status-available text-status-available-foreground",
    borrowed: "bg-status-borrowed text-status-borrowed-foreground",
    maintenance: "bg-status-maintenance text-status-maintenance-foreground",
  };

  const specLabels: Record<string, string> = {
    os: "Operating System",
    processor: "Processor",
    ram: "RAM",
    storage: "Storage",
    display: "Display",
    battery: "Battery",
  };

  const handleSubmitBooking = async () => {
    if (!startDate || !endDate || !reason.trim() || !user) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await borrowingAPI.create({
        equipment_id: parseInt(device.id),
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: format(endDate, "yyyy-MM-dd"),
        reason: reason.trim(),
      });

      if (response.success) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setIsBooking(false);
          setStartDate(undefined);
          setEndDate(undefined);
          setReason("");
          onClose();
        }, 2000);
      } else {
        toast.error(response.error || "Failed to submit request");
      }
    } catch (error) {
      toast.error("An error occurred while submitting the request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {showSuccess ? (
          <div className="py-12">
            <SuccessAnimation
              title="Request Submitted!"
              description="Your booking request has been sent for approval."
            />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">{device.name}</DialogTitle>
            </DialogHeader>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="aspect-[4/3] rounded-lg overflow-hidden bg-muted">
                  <img
                    src={device.image}
                    alt={device.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusColors[device.status]}>
                    {device.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {device.assetTag}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Details</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Brand</dt>
                      <dd>{device.brand}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Model</dt>
                      <dd>{device.model}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Category</dt>
                      <dd className="capitalize">{device.category}</dd>
                    </div>
                  </dl>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2">Specifications</h3>
                  <dl className="space-y-2 text-sm">
                    {Object.entries(device.specs).map(
                      ([key, value]) =>
                        value && (
                          <div key={key} className="flex justify-between">
                            <dt className="text-muted-foreground">
                              {specLabels[key] || key}
                            </dt>
                            <dd className="text-right max-w-[60%]">{value}</dd>
                          </div>
                        ),
                    )}
                  </dl>
                </div>

                {device.status === "borrowed" && assignedUser && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-background">
                        <img
                          src={assignedUser.avatar_url || ""}
                          alt={assignedUser.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          Currently assigned to
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {assignedUser.name}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {device.status === "available" && (
              <>
                <Separator className="my-4" />

                {!isBooking ? (
                  <Button className="w-full" onClick={() => setIsBooking(true)}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Request to Borrow
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <h3 className="font-semibold">Book this Device</h3>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !startDate && "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {startDate
                                ? format(startDate, "PPP")
                                : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={startDate}
                              onSelect={setStartDate}
                              disabled={(date) => date < new Date()}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !endDate && "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {endDate ? format(endDate, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={endDate}
                              onSelect={setEndDate}
                              disabled={(date) =>
                                date < (startDate || new Date()) ||
                                date < addDays(startDate || new Date(), 1)
                              }
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reason">Reason for borrowing</Label>
                      <Textarea
                        id="reason"
                        placeholder="Please describe why you need this device..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setIsBooking(false);
                          setStartDate(undefined);
                          setEndDate(undefined);
                          setReason("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={handleSubmitBooking}
                        disabled={
                          !startDate ||
                          !endDate ||
                          !reason.trim() ||
                          isSubmitting
                        }
                      >
                        {isSubmitting ? (
                          <Clock className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                        )}
                        Submit Request
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
