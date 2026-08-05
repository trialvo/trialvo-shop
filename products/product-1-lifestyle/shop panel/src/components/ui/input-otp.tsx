"use client";

import { useContext, type ComponentPropsWithoutRef, type Ref } from "react";
import { OTPInput, OTPInputContext } from "input-otp";
import { Dot } from "lucide-react";

import { cn } from "@/lib/utils";

function InputOTP({
  className,
  containerClassName,
  ref,
  ...props
}: ComponentPropsWithoutRef<typeof OTPInput> & { ref?: Ref<HTMLInputElement> }) {
  return (
    <OTPInput
      ref={ref}
      containerClassName={cn("flex items-center gap-2 has-[:disabled]:opacity-50", containerClassName)}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
    />
  );
}

function InputOTPGroup({ className, ref, ...props }: ComponentPropsWithoutRef<"div"> & { ref?: Ref<HTMLDivElement> }) {
  return <div ref={ref} className={cn("flex items-center", className)} {...props} />;
}

function InputOTPSlot({
  index,
  className,
  ref,
  ...props
}: ComponentPropsWithoutRef<"div"> & { index: number; ref?: Ref<HTMLDivElement> }) {
  const inputOTPContext = useContext(OTPInputContext);
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
          <div className="animate-caret-blink h-4 w-px bg-foreground duration-1000" />
        </div>
      )}
    </div>
  );
}

function InputOTPSeparator({ ref, ...props }: ComponentPropsWithoutRef<"div"> & { ref?: Ref<HTMLDivElement> }) {
  return (
    <div ref={ref} role="separator" {...props}>
      <Dot />
    </div>
  );
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
