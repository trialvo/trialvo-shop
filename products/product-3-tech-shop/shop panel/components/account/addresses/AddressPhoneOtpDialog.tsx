"use client";

import { useEffect, useState, type ReactElement } from "react";
import { toast } from "sonner";
import { AuthOtpInput } from "@/components/auth/AuthOtpInput";
import { AuthResendTimer } from "@/components/auth/AuthResendTimer";
import { AppButton } from "@/components/shared/AppButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePhone } from "@/hooks/usePhone";
import { assertValidPhoneId } from "@/lib/adapters/accountAddress";
import { getUnknownErrorMessage } from "@/lib/api/errors";
import { phoneOtpSchema } from "@/lib/phone/schema";
import { sanitizeOtp } from "@/lib/security/auth";

export type AddressPhoneOtpDialogState = {
  open: boolean;
  phoneId: number;
  phoneLabel: string;
};

type AddressPhoneOtpDialogProps = Readonly<{
  state: AddressPhoneOtpDialogState | null;
  onOpenChange: (open: boolean) => void;
  onVerified?: () => void;
}>;

/**
 * OTP modal for verifying an address phone (`phone_id` → sendPhoneOtp / verifyPhoneOtp).
 */
export function AddressPhoneOtpDialog({
  state,
  onOpenChange,
  onVerified,
}: AddressPhoneOtpDialogProps): ReactElement {
  const open = Boolean(state?.open);
  const { sendPhoneOtp, verifyPhoneOtp } = usePhone();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setOtp("");
      setError(null);
    }
  }, [open, state?.phoneId]);

  const busy = verifyPhoneOtp.isPending;

  const handleClose = () => {
    if (busy) return;
    onOpenChange(false);
  };

  const handleVerify = async () => {
    if (!state) return;
    setError(null);

    const clean = sanitizeOtp(otp);
    const parsed = phoneOtpSchema.safeParse({ code: clean });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid code");
      return;
    }

    try {
      const phoneId = assertValidPhoneId(state.phoneId);
      await verifyPhoneOtp.mutateAsync({
        phoneId,
        otp: parsed.data.code,
      });
      toast.success("Phone verified successfully");
      onVerified?.();
      onOpenChange(false);
    } catch (err) {
      setError(getUnknownErrorMessage(err, "Verification failed"));
    }
  };

  const handleResend = async () => {
    if (!state) return;
    setError(null);
    try {
      const phoneId = assertValidPhoneId(state.phoneId);
      await sendPhoneOtp.mutateAsync({ phoneId });
      toast.success("OTP resent");
    } catch (err) {
      setError(getUnknownErrorMessage(err, "Failed to resend OTP"));
      throw err;
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose();
      }}
    >
      <DialogContent className="sm:max-w-md rounded-sm">
        <DialogHeader>
          <DialogTitle className="font-heading">Verify phone number</DialogTitle>
          <DialogDescription>
            Enter the 6-digit code sent to{" "}
            <span className="font-medium text-foreground tabular-nums">
              {state?.phoneLabel || "your phone"}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <AuthOtpInput
            value={otp}
            onChange={(value) => setOtp(sanitizeOtp(value))}
            autoFocus
          />
          {error ? (
            <p className="text-[11px] text-destructive text-center" role="alert">
              {error}
            </p>
          ) : null}

          <AppButton
            fullWidth
            className="cursor-pointer"
            onClick={() => void handleVerify()}
            isLoading={busy}
            disabled={otp.length !== 6 || sendPhoneOtp.isPending}
            loadingText="Verifying…"
          >
            Verify phone
          </AppButton>

          <AuthResendTimer
            disabled={busy || sendPhoneOtp.isPending}
            onResend={handleResend}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
