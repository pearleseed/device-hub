import * as React from "react";
import { OTPInput, OTPInputContext } from "input-otp";
import { Dot } from "lucide-react";

import { cn } from "@/lib/utils";

// React 19: ref is now a regular prop

interface InputOTPProps extends React.ComponentPropsWithoutRef<
  typeof OTPInput
> {
  ref?: React.Ref<React.ComponentRef<typeof OTPInput>>;
}

function InputOTP({
  className,
  containerClassName,
  ref,
  ...props
}: InputOTPProps) {
  return (
    <OTPInput
      ref={ref}
      containerClassName={cn(
        "flex items-center gap-2 has-[:disabled]:opacity-50",
        containerClassName,
      )}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
    />
  );
}
InputOTP.displayName = "InputOTP";

interface InputOTPGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>;
}

function InputOTPGroup({ className, ref, ...props }: InputOTPGroupProps) {
  return (
    <div ref={ref} className={cn("flex items-center", className)} {...props} />
  );
}
InputOTPGroup.displayName = "InputOTPGroup";

interface InputOTPSlotProps extends React.HTMLAttributes<HTMLDivElement> {
  index: number;
  ref?: React.Ref<HTMLDivElement>;
}

function InputOTPSlot({ index, className, ref, ...props }: InputOTPSlotProps) {
  const inputOTPContext = React.useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index];

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center border-y border-r border-input text-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
        isActive && "z-10 ring-2 ring-ring ring-offset-background",
        className,
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-[caret-blink_1s_ease-out_infinite] h-4 w-px bg-foreground" />
        </div>
      )}
    </div>
  );
}
InputOTPSlot.displayName = "InputOTPSlot";

interface InputOTPSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>;
}

function InputOTPSeparator({ ref, ...props }: InputOTPSeparatorProps) {
  return (
    <div ref={ref} role="separator" {...props}>
      <Dot />
    </div>
  );
}
InputOTPSeparator.displayName = "InputOTPSeparator";

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
