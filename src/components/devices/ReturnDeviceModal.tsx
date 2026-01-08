import React, { useState } from "react";
import { getCategoryIcon } from "@/lib/types";
import type {
  DeviceCategory,
  DeviceStatus,
  RequestStatus,
  DeviceCondition,
} from "@/lib/types";
import { returnsAPI } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";
import { SuccessAnimation } from "@/components/ui/success-animation";

// Legacy interfaces
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

interface BookingRequest {
  id: string;
  deviceId: string;
  userId: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: RequestStatus;
  createdAt: string;
}

interface ReturnDeviceModalProps {
  device: Device | null;
  loan: BookingRequest | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const conditionOptions: {
  value: DeviceCondition;
  label: string;
  description: string;
}[] = [
  {
    value: "excellent",
    label: "Excellent",
    description: "Like new, no visible wear",
  },
  { value: "good", label: "Good", description: "Minor wear, fully functional" },
  { value: "fair", label: "Fair", description: "Noticeable wear, works fine" },
  {
    value: "damaged",
    label: "Damaged",
    description: "Needs repair or maintenance",
  },
];

export const ReturnDeviceModal: React.FC<ReturnDeviceModalProps> = ({
  device,
  loan,
  open,
  onClose,
  onSuccess,
}) => {
  const [condition, setCondition] = useState<DeviceCondition>("good");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!device || !loan) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const response = await returnsAPI.create({
        borrowing_request_id: parseInt(loan.id),
        condition,
        notes: notes.trim() || undefined,
      });

      if (response.success) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setCondition("good");
          setNotes("");
          onSuccess?.();
          onClose();
        }, 2000);
      } else {
        toast.error(response.error || "Failed to submit return request");
      }
    } catch (error) {
      toast.error("An error occurred while submitting the return");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        {showSuccess ? (
          <div className="py-8">
            <SuccessAnimation
              title="Return Submitted!"
              description="The device has been marked as returned."
            />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Return Device</DialogTitle>
              <DialogDescription>
                Please provide information about the device condition.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Device Info */}
              <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-background">
                  <img
                    src={device.image}
                    alt={device.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {getCategoryIcon(device.category)}
                    </span>
                    <h4 className="font-semibold">{device.name}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {device.assetTag}
                  </p>
                </div>
              </div>

              {/* Condition Selection */}
              <div className="space-y-3">
                <Label>Device Condition</Label>
                <RadioGroup
                  value={condition}
                  onValueChange={(value) =>
                    setCondition(value as DeviceCondition)
                  }
                  className="grid grid-cols-2 gap-3"
                >
                  {conditionOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`flex flex-col p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        condition === option.value
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:border-muted-foreground/20"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem
                          value={option.value}
                          id={option.value}
                        />
                        <span className="font-medium text-sm">
                          {option.label}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground mt-1 pl-6">
                        {option.description}
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any issues or comments about the device..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Confirm Return
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
