import * as React from "react";
import { OTPInput } from "input-otp";

import { InputOTPGroup } from "@/components/ui/input-otp-group";
import { InputOTPSeparator } from "@/components/ui/input-otp-separator";
import { InputOTPSlot } from "@/components/ui/input-otp-slot";
import { cn } from "@/lib/utils";

const InputOTP = React.forwardRef(
  ({ className, containerClassName, ...props }, ref) => (
    <OTPInput
      ref={ref}
      containerClassName={cn(
        "flex items-center gap-2 has-[:disabled]:opacity-50",
        containerClassName,
      )}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
    />
  ),
);
InputOTP.displayName = "InputOTP";

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
