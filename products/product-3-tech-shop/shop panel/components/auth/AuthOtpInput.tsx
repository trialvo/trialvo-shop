"use client";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

type AuthOtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
};

export function AuthOtpInput({
  value,
  onChange,
  disabled,
  autoFocus,
}: AuthOtpInputProps) {
  return (
    <InputOTP
      maxLength={6}
      value={value}
      onChange={onChange}
      disabled={disabled}
      autoFocus={autoFocus}
      containerClassName="justify-center gap-1.5"
    >
      <InputOTPGroup className="gap-1.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <InputOTPSlot
            key={i}
            index={i}
            className="h-11 w-10 rounded-sm border border-border bg-secondary/50 text-sm first:rounded-sm first:border-l last:rounded-sm data-[active=true]:ring-2 data-[active=true]:ring-primary/30"
          />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
}
