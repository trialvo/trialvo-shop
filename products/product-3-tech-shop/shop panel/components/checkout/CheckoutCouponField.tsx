"use client";

import { useState, type ReactElement } from "react";
import { Tag, X } from "lucide-react";
import { AppButton } from "@/components/shared/AppButton";
import { useCoupon } from "@/hooks/useCoupon";
import type { CartItem } from "@/store/cart/types";
import { buildCartOrderItems } from "@/lib/checkout/buildCartOrderItems";
import { toast } from "sonner";
import { sanitizeAuthText } from "@/lib/security/auth";
import { cn } from "@/lib/utils";

type CheckoutCouponFieldProps = Readonly<{
  items: CartItem[];
  customerId?: number;
  value?: string;
  onApplied?: (code: string, discountAmount: number) => void;
  onCleared?: () => void;
  /** Compact row for cart drawer */
  compact?: boolean;
  /** Graduate OrderSummary coupon band */
  variant?: "default" | "summary";
}>;

/**
 * Coupon apply/remove — graduate OrderSummary `#F3FAFF` band when variant=summary.
 */
export function CheckoutCouponField({
  items,
  customerId,
  value,
  onApplied,
  onCleared,
  compact = false,
  variant = "default",
}: CheckoutCouponFieldProps): ReactElement {
  const { applied, applyCoupon, removeCoupon, isValidating } = useCoupon();
  const [draft, setDraft] = useState(value ?? applied?.code ?? "");

  const handleApply = async () => {
    try {
      const { authItems } = buildCartOrderItems(items);
      const data = await applyCoupon({
        code: draft,
        orderItems: authItems,
        customerId,
      });
      const code = sanitizeAuthText(draft, 40);
      const discount = Number(data.totals?.total_coupon_discount) || 0;
      onApplied?.(code, discount);
      toast.success(data.coupon_title || "Coupon applied");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not apply coupon",
      );
    }
  };

  const handleRemove = () => {
    removeCoupon();
    setDraft("");
    onCleared?.();
  };

  const isSummary = variant === "summary";

  const inner =
    applied ? (
      <div
        className={cn(
          "flex items-center justify-between gap-2",
          isSummary
            ? "bg-white border border-green-500 p-3 rounded"
            : compact
              ? "text-sm"
              : "text-sm pt-1",
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          {isSummary ? (
            <span className="text-green-600 font-medium shrink-0">Applied</span>
          ) : null}
          <span className="font-semibold truncate">{applied.code}</span>
          {!isSummary && applied.discountAmount > 0 ? (
            <span className="text-[11px] text-muted-foreground">
              −BDT {applied.discountAmount.toLocaleString()}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={handleRemove}
          className="text-gray-500 hover:text-red-500 transition-colors p-1 cursor-pointer shrink-0"
          aria-label="Remove coupon"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    ) : (
      <div className={cn("flex gap-2", !isSummary && !compact && "pt-1")}>
        <input
          type="text"
          placeholder={compact ? "Enter coupon code" : "Enter coupon code"}
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, 40))}
          className={cn(
            "flex-1 px-3 text-sm bg-white",
            compact ? "h-9 rounded-sm border border-border" : "h-10",
            !compact &&
              "rounded-none border border-[#999999] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black",
            compact &&
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
          )}
          maxLength={40}
        />
        <AppButton
          type="button"
          variant={compact ? "outline" : "primary"}
          size="sm"
          className={cn(
            !compact &&
              "h-10 rounded-none bg-black text-white hover:bg-black/90 px-5",
            compact && "px-5",
          )}
          disabled={!draft.trim()}
          isLoading={isValidating}
          loadingText="…"
          onClick={() => void handleApply()}
        >
          Apply
        </AppButton>
      </div>
    );

  if (!isSummary) return inner;

  return (
    <div className="bg-[#F3FAFF] p-4">
      <div className="flex items-center gap-1.5 text-sm text-[#343434] font-semibold mb-2">
        <Tag className="h-5 w-5" />
        Coupon code
      </div>
      {inner}
    </div>
  );
}

export default CheckoutCouponField;
