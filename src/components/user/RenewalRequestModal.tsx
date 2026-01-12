import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { CalendarClock, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { BorrowRequestWithDetails } from "@/types/api";

const renewalSchema = z.object({
  requestedEndDate: z.string().min(1, "New end date is required"),
  reason: z
    .string()
    .min(10, "Please provide a reason (at least 10 characters)")
    .max(500),
});

type RenewalFormData = z.infer<typeof renewalSchema>;

interface RenewalRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  borrowRequest: BorrowRequestWithDetails | null;
  deviceName: string;
  onSubmit: (data: { requestedEndDate: string; reason: string }) => void;
}

export const RenewalRequestModal: React.FC<RenewalRequestModalProps> = ({
  open,
  onOpenChange,
  borrowRequest,
  deviceName,
  onSubmit,
}) => {
  const currentEndDate = borrowRequest?.end_date
    ? new Date(borrowRequest.end_date)
    : new Date();

  const minNewDate = format(addDays(currentEndDate, 1), "yyyy-MM-dd");
  const maxNewDate = format(addDays(currentEndDate, 90), "yyyy-MM-dd");

  const form = useForm<RenewalFormData>({
    resolver: zodResolver(renewalSchema),
    defaultValues: {
      requestedEndDate: format(addDays(currentEndDate, 14), "yyyy-MM-dd"),
      reason: "",
    },
  });

  const handleSubmit = (data: RenewalFormData) => {
    onSubmit(data);
    form.reset();
    onOpenChange(false);
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  if (!borrowRequest) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            Request Loan Renewal
          </DialogTitle>
          <DialogDescription>
            Request to extend your borrowing period for {deviceName}
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Current loan ends on{" "}
            <strong>{format(currentEndDate, "MMMM d, yyyy")}</strong>
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="requestedEndDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New End Date *</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      min={minNewDate}
                      max={maxNewDate}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum extension: 90 days from current end date
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Extension *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please explain why you need to extend this loan..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a clear reason for the extension request
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit">Submit Request</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
