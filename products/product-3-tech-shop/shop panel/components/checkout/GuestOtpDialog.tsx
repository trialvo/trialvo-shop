"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AppButton } from "@/components/shared/AppButton";
import { AuthOtpInput } from "@/components/auth/AuthOtpInput";
import { AuthResendTimer } from "@/components/auth/AuthResendTimer";
import { guestPhoneOtpSchema } from "@/lib/checkout/schemas";
import { sanitizeOtp } from "@/lib/security/auth";
import { verifyGuestPhoneOtp } from "@/lib/checkout/placeCheckoutOrder";
import { guestOrderService } from "@/lib/api/guest-order/service";

export type GuestOtpDialogState = {
  open: boolean;
  guestOrderId: string;
  phone: string;
};

type GuestOtpDialogProps = {
  state: GuestOtpDialogState | null;
  onResolved: (verified: boolean) => void;
};

/**
 * Modal OTP verify — same UX idea as graduate fashion `openVerifyIdentity`,
 * styled with shop Dialog + AppButton.
 */
export function GuestOtpDialog({ state, onResolved }: GuestOtpDialogProps) {
  const open = Boolean(state?.open);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setOtp("");
      setError(null);
      setBusy(false);
    }
  }, [open, state?.guestOrderId]);

  const handleClose = () => {
    if (busy) return;
    onResolved(false);
  };

  const handleVerify = async () => {
    if (!state?.guestOrderId) return;
    setError(null);
    const clean = sanitizeOtp(otp);
    const parsed = guestPhoneOtpSchema.safeParse({ code: clean });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid code");
      return;
    }

    setBusy(true);
    try {
      await verifyGuestPhoneOtp(state.guestOrderId, parsed.data.code);
      onResolved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setBusy(false);
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
            <span className="font-medium text-foreground">
              {state?.phone || "your phone"}
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
            onClick={() => void handleVerify()}
            isLoading={busy}
            disabled={otp.length !== 6}
            loadingText="Verifying…"
          >
            Verify & continue
          </AppButton>

          <AuthResendTimer
            disabled={busy}
            onResend={async () => {
              if (!state?.guestOrderId) return;
              await guestOrderService.resendOtp(state.guestOrderId);
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
