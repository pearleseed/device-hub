import React from "react";
import type { RequestStatus } from "@/types/api";
import { cn } from "@/lib/utils";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Package,
  RotateCcw,
  Circle,
} from "lucide-react";

interface RequestTimelineProps {
  status: RequestStatus;
  createdAt: string;
  className?: string;
}

const steps = [
  { key: "submitted", label: "Submitted", icon: Clock },
  { key: "review", label: "Under Review", icon: Circle },
  { key: "decision", label: "Decision", icon: CheckCircle2 },
  { key: "active", label: "Active", icon: Package },
  { key: "returned", label: "Returned", icon: RotateCcw },
];

function getActiveStep(status: RequestStatus): number {
  switch (status) {
    case "pending":
      return 1; // Under Review
    case "approved":
      return 2; // Decision (approved)
    case "rejected":
      return 2; // Decision (rejected)
    case "active":
      return 3; // Active
    case "returned":
      return 4; // Returned
    default:
      return 0;
  }
}

function getStepStatus(
  stepIndex: number,
  activeStep: number,
  requestStatus: RequestStatus,
): "completed" | "current" | "upcoming" | "rejected" {
  if (stepIndex < activeStep) return "completed";
  if (stepIndex === activeStep) {
    if (requestStatus === "rejected" && stepIndex === 2) return "rejected";
    return "current";
  }
  return "upcoming";
}

export const RequestTimeline: React.FC<RequestTimelineProps> = ({
  status,
  createdAt,
  className,
}) => {
  const activeStep = getActiveStep(status);

  // Filter steps based on status - if rejected, don't show active/returned
  const visibleSteps = status === "rejected" ? steps.slice(0, 3) : steps;

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {visibleSteps.map((step, index) => {
          const stepStatus = getStepStatus(index, activeStep, status);
          const Icon = stepStatus === "rejected" ? XCircle : step.icon;

          return (
            <React.Fragment key={step.key}>
              {/* Step */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                    stepStatus === "completed" &&
                      "bg-primary text-primary-foreground",
                    stepStatus === "current" &&
                      "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    stepStatus === "upcoming" &&
                      "bg-muted text-muted-foreground",
                    stepStatus === "rejected" &&
                      "bg-destructive text-destructive-foreground ring-4 ring-destructive/20",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span
                  className={cn(
                    "text-xs font-medium text-center",
                    stepStatus === "current" && "text-primary",
                    stepStatus === "upcoming" && "text-muted-foreground",
                    stepStatus === "rejected" && "text-destructive",
                  )}
                >
                  {stepStatus === "rejected" && index === 2
                    ? "Rejected"
                    : step.label}
                </span>
              </div>

              {/* Connector */}
              {index < visibleSteps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 transition-colors",
                    index < activeStep ? "bg-primary" : "bg-muted",
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
