"use client";

import type { ReactElement } from "react";
import { BadgeCheck, Phone, ShieldAlert } from "lucide-react";
import { AppButton } from "@/components/shared/AppButton";
import { cn } from "@/lib/utils";

type AddressPhoneStatusProps = Readonly<{
  phoneLabel: string;
  hasPhone: boolean;
  isPhoneVerified: boolean;
  isSendingOtp?: boolean;
  disabled?: boolean;
  onVerify: () => void;
}>;

/**
 * Phone row on an address card — number + verified badge, or verify CTA.
 */
export function AddressPhoneStatus({
  phoneLabel,
  hasPhone,
  isPhoneVerified,
  isSendingOtp = false,
  disabled = false,
  onVerify,
}: AddressPhoneStatusProps): ReactElement {
  if (!hasPhone) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Phone className="h-3 w-3 shrink-0" aria-hidden />
        <span>No phone</span>
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
      <p className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
        <Phone className="h-3 w-3 shrink-0" aria-hidden />
        <span className="truncate">{phoneLabel}</span>
      </p>

      {isPhoneVerified ? (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-sm bg-emerald-600/10 px-1.5 py-0.5",
            "text-[10px] font-semibold uppercase tracking-wide text-emerald-700",
          )}
        >
          <BadgeCheck className="h-3 w-3" aria-hidden />
          Verified
        </span>
      ) : (
        <div className="inline-flex items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-sm bg-amber-500/10 px-1.5 py-0.5",
              "text-[10px] font-semibold uppercase tracking-wide text-amber-700",
            )}
          >
            <ShieldAlert className="h-3 w-3" aria-hidden />
            Unverified
          </span>
          <AppButton
            type="button"
            variant="outline"
            size="sm"
            className="cursor-pointer h-7 rounded-sm px-2 text-[11px] font-medium"
            disabled={disabled || isSendingOtp}
            isLoading={isSendingOtp}
            loadingText="Sending…"
            onClick={onVerify}
          >
            Verify
          </AppButton>
        </div>
      )}
    </div>
  );
}
