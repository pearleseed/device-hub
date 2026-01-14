import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCreateReturnRequest } from "@/hooks/use-api-mutations";
import { cn } from "@/lib/utils";
import type { BorrowRequestWithDetails } from "@/types/api";

type ReturnCondition = "excellent" | "good" | "fair" | "damaged";

interface ReturnDeviceFormProps {
  loan: BorrowRequestWithDetails;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ReturnDeviceForm: React.FC<ReturnDeviceFormProps> = ({
  loan,
  onSuccess,
  onCancel,
}) => {
  const { t } = useLanguage();
  const createReturnRequest = useCreateReturnRequest();

  const [returnCondition, setReturnCondition] = useState<ReturnCondition>("good");
  const [returnNotes, setReturnNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await createReturnRequest.mutateAsync({
        borrow_request_id: loan.id,
        condition: returnCondition,
        notes: returnNotes,
      });
      if (onSuccess) onSuccess();
      // Reset form
      setReturnCondition("good");
      setReturnNotes("");
    } catch (error) {
      console.error("Failed to submit return request:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Condition Selection */}
      <div className="space-y-2">
        <Label>{t("loans.deviceCondition")}</Label>
        <div className="grid grid-cols-1 gap-2">
          {[
            {
              value: "excellent",
              label: t("condition.excellent"),
              desc: t("condition.excellentDesc"),
              icon: CheckCircle2,
              color: "text-green-500",
              bg: "bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-800",
            },
            {
              value: "good",
              label: t("condition.good"),
              desc: t("condition.goodDesc"),
              icon: CheckCircle2,
              color: "text-blue-500",
              bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800",
            },
            {
              value: "fair",
              label: t("condition.fair"),
              desc: t("condition.fairDesc"),
              icon: AlertCircle,
              color: "text-yellow-500",
              bg: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-300 dark:border-yellow-800",
            },
            {
              value: "damaged",
              label: t("condition.damaged"),
              desc: t("condition.damagedDesc"),
              icon: XCircle,
              color: "text-red-500",
              bg: "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800",
            },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setReturnCondition(option.value as ReturnCondition)}
              className={cn(
                "flex items-center gap-2 p-3 rounded-lg border text-left transition-all",
                returnCondition === option.value
                  ? option.bg
                  : "bg-background border-border hover:border-muted-foreground/50",
              )}
            >
              <option.icon className={cn("h-4 w-4", option.color)} />
              <div>
                <p className="text-sm font-medium">{option.label}</p>
                <p className="text-xs text-muted-foreground">
                  {option.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">{t("loans.notesOptional")}</Label>
        <Textarea
          id="notes"
          placeholder={t("loans.notesPlaceholder")}
          value={returnNotes}
          onChange={(e) => setReturnNotes(e.target.value)}
          rows={3}
          className="resize-none"
        />
      </div>

      <div className="flex gap-2 pt-2">
        {onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1"
          >
            {t("loans.cancel")}
          </Button>
        )}
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
          className={cn(onCancel ? "flex-1" : "w-full")}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              {t("loans.submitting") || "Submitting..."}
            </>
          ) : (
            t("loans.submitReturn")
          )}
        </Button>
      </div>
    </div>
  );
};
