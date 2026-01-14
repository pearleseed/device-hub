import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCreateRenewalRequest } from "@/hooks/use-api-mutations";
import type { BorrowRequestWithDetails } from "@/types/api";
import { cn } from "@/lib/utils";
import { format, addDays } from "date-fns";
import { CompactDatePicker } from "@/components/ui/compact-date-picker";

interface RenewalRequestFormProps {
  loan: BorrowRequestWithDetails;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const RenewalRequestForm: React.FC<RenewalRequestFormProps> = ({
  loan,
  onSuccess,
  onCancel,
}) => {
  const { t } = useLanguage();
  const createRenewalRequest = useCreateRenewalRequest();

  const [renewalDate, setRenewalDate] = useState<Date | undefined>();
  const [renewalReason, setRenewalReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derive min/max logic
  const minDate = loan?.end_date ? addDays(new Date(loan.end_date), 1) : undefined;

  const handleSubmit = async () => {
    if (!renewalDate) return;
    
    setIsSubmitting(true);
    try {
      await createRenewalRequest.mutateAsync({
        borrow_request_id: loan.id,
        requested_end_date: format(renewalDate, "yyyy-MM-dd"),
        reason: renewalReason,
      });
      if (onSuccess) onSuccess();
      // Reset
      setRenewalDate(undefined);
      setRenewalReason("");
    } catch (error) {
      console.error("Failed to submit renewal request:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t("loans.newEndDate")}</Label>
        <CompactDatePicker
          selected={renewalDate}
          onSelect={setRenewalDate}
          disabled={(date) => {
            if (!minDate) return false;
            return date < minDate;
          }}
          placeholder={t("common.pickDate")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">{t("loans.reasonForRenewal")}</Label>
        <Textarea
          id="reason"
          placeholder={t("loans.reasonPlaceholder")}
          value={renewalReason}
          onChange={(e) => setRenewalReason(e.target.value)}
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          {t("loans.minCharacters")}
        </p>
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
          disabled={renewalReason.length < 10 || isSubmitting || !renewalDate}
          className={cn(onCancel ? "flex-1" : "w-full")}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              {t("loans.submitting") || "Submitting..."}
            </>
          ) : (
            t("loans.submitRequest")
          )}
        </Button>
      </div>
    </div>
  );
};
