"use client";

import { useEffect, useState } from "react";
import { AppButton } from "@/components/shared/AppButton";

type AuthResendTimerProps = {
  seconds?: number;
  onResend: () => Promise<void> | void;
  disabled?: boolean;
  label?: string;
};

export function AuthResendTimer({
  seconds = 60,
  onResend,
  disabled,
  label = "Resend code",
}: AuthResendTimerProps) {
  const [left, setLeft] = useState(seconds);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  const handleResend = async () => {
    if (left > 0 || busy || disabled) return;
    setBusy(true);
    try {
      await onResend();
      setLeft(seconds);
    } finally {
      setBusy(false);
    }
  };

  return (
    <p className="text-center text-xs text-muted-foreground">
      Didn&apos;t get the code?{" "}
      {left > 0 ? (
        <span className="font-medium text-foreground">Resend in {left}s</span>
      ) : (
        <button
          type="button"
          onClick={() => {
            void handleResend();
          }}
          disabled={busy || disabled}
          className="text-primary font-medium hover:underline disabled:opacity-50"
        >
          {busy ? "Sending…" : label}
        </button>
      )}
    </p>
  );
}

/** Small helper button row used across auth steps */
export function AuthBackButton({
  onClick,
  children = "Back",
}: {
  onClick: () => void;
  children?: string;
}) {
  return (
    <AppButton
      type="button"
      variant="ghost"
      fullWidth
      className="text-sm text-muted-foreground"
      onClick={onClick}
    >
      {children}
    </AppButton>
  );
}
