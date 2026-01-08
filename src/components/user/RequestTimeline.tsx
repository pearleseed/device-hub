import React from "react";
import type { RequestStatus } from "@/lib/types";
import { Check, Clock, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RequestTimelineProps {
  status: RequestStatus;
  createdAt: string;
}

export const RequestTimeline: React.FC<RequestTimelineProps> = ({ status }) => {
  const steps = [
    { id: "submitted", label: "Submitted", icon: FileText },
    { id: "review", label: "Under Review", icon: Loader2 },
    { id: "approved", label: "Approved", icon: Check },
  ];

  const getStepStatus = (
    stepId: string,
  ): "completed" | "current" | "pending" => {
    if (status === "rejected") {
      return stepId === "submitted" ? "completed" : "pending";
    }

    const statusOrder: Record<RequestStatus, number> = {
      pending: 1,
      approved: 2,
      active: 3,
      returned: 3,
      rejected: 0,
    };

    const stepOrder: Record<string, number> = {
      submitted: 0,
      review: 1,
      approved: 2,
    };

    const currentStepIndex = statusOrder[status];
    const thisStepIndex = stepOrder[stepId];

    if (thisStepIndex < currentStepIndex) return "completed";
    if (thisStepIndex === currentStepIndex) return "current";
    return "pending";
  };

  return (
    <div className="flex items-center justify-between relative">
      {/* Progress Line */}
      <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-muted -translate-y-1/2 z-0" />

      {steps.map((step, index) => {
        const stepStatus = getStepStatus(step.id);
        const Icon = step.icon;

        return (
          <div key={step.id} className="flex flex-col items-center z-10">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2 bg-background transition-colors",
                stepStatus === "completed" &&
                  "border-primary bg-primary text-primary-foreground",
                stepStatus === "current" && "border-primary text-primary",
                stepStatus === "pending" &&
                  "border-muted-foreground/30 text-muted-foreground/50",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4",
                  stepStatus === "current" &&
                    step.id === "review" &&
                    "animate-spin",
                )}
              />
            </div>
            <span
              className={cn(
                "text-xs mt-2 font-medium",
                stepStatus === "completed" && "text-primary",
                stepStatus === "current" && "text-foreground",
                stepStatus === "pending" && "text-muted-foreground/50",
              )}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};
