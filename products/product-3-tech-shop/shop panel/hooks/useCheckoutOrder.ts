"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { useAuthContext } from "@/context/AuthContext";
import { useGuestOrder } from "@/hooks/useGuestOrder";
import { useGuestId } from "@/hooks/useGuestId";
import { placeCheckoutOrder } from "@/lib/checkout/placeCheckoutOrder";
import type { CheckoutFormValues } from "@/lib/checkout/schemas";
import type { GuestOrderPermissions } from "@/lib/api/guest-order/service";
import { syncGuestCartOrder } from "@/lib/guest-order/syncGuestCart";
import { getUnknownErrorMessage } from "@/lib/api/errors";
import type { GuestOtpDialogState } from "@/components/checkout/GuestOtpDialog";
import { sanitizePaymentRedirectUrl } from "@/lib/security/paymentUrl";
import { writeLastCheckoutOrder } from "@/lib/checkout/lastCheckoutOrder";

const DEFAULT_PERMISSIONS: GuestOrderPermissions = {
  email_required: true,
  phone_verification_required: true,
};

export type CheckoutLeaveKind = "gateway" | "success";

export function useCheckoutOrder() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const auth = useAuthContext();
  const { permissions, permissionsLoading } = useGuestOrder();
  const { id: guestId, loading: guestIdLoading, refresh: refreshGuestId } =
    useGuestId({ auto: !auth.isAuthenticated });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncingGuest, setIsSyncingGuest] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpDialog, setOtpDialog] = useState<GuestOtpDialogState | null>(null);
  const [isLeavingCheckout, setIsLeavingCheckout] = useState(false);
  const [leaveKind, setLeaveKind] = useState<CheckoutLeaveKind | null>(null);

  const otpResolverRef = useRef<((verified: boolean) => void) | null>(null);
  const lastCartSigRef = useRef<string>("");
  const isLeavingRef = useRef(false);

  const resolvedPermissions = permissions ?? DEFAULT_PERMISSIONS;

  // Browser back / bfcache restore — never keep the "redirecting" overlay.
  useEffect(() => {
    const resetLeaving = () => {
      if (!isLeavingRef.current && !isLeavingCheckout) return;
      isLeavingRef.current = false;
      setIsLeavingCheckout(false);
      setLeaveKind(null);
      setIsSubmitting(false);
    };

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) resetLeaving();
    };

    window.addEventListener("popstate", resetLeaving);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("popstate", resetLeaving);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [isLeavingCheckout]);

  const cartSig = items
    .map(
      (i) =>
        `${i.productVariationId ?? i.product.defaultSkuId ?? "?"}:${i.quantity}`,
    )
    .join("|");

  // Early guest order create/sync
  useEffect(() => {
    if (auth.isAuthenticated) return;
    if (guestIdLoading) return;
    if (!items.length) return;
    if (lastCartSigRef.current === cartSig) return;

    let cancelled = false;
    lastCartSigRef.current = cartSig;
    setIsSyncingGuest(true);

    (async () => {
      try {
        if (!guestId) await refreshGuestId();
        await syncGuestCartOrder(items);
      } catch (err) {
        console.error(
          getUnknownErrorMessage(err, "Guest cart sync failed"),
        );
        lastCartSigRef.current = "";
      } finally {
        if (!cancelled) setIsSyncingGuest(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    auth.isAuthenticated,
    cartSig,
    guestId,
    guestIdLoading,
    items,
    refreshGuestId,
  ]);

  const requestPhoneOtp = useCallback(
    (guestOrderId: string, phone: string) =>
      new Promise<boolean>((resolve) => {
        otpResolverRef.current = resolve;
        setOtpDialog({ open: true, guestOrderId, phone });
      }),
    [],
  );

  const resolveOtpDialog = useCallback((verified: boolean) => {
    setOtpDialog(null);
    otpResolverRef.current?.(verified);
    otpResolverRef.current = null;
  }, []);

  const beginLeaving = useCallback((kind: CheckoutLeaveKind) => {
    isLeavingRef.current = true;
    setLeaveKind(kind);
    setIsLeavingCheckout(true);
  }, []);

  const submitCheckout = useCallback(
    async (values: CheckoutFormValues) => {
      setError(null);
      setIsSubmitting(true);
      try {
        const result = await placeCheckoutOrder({
          values,
          items,
          isAuthenticated: Boolean(auth.isAuthenticated),
          permissions: resolvedPermissions,
          requestPhoneOtp,
        });

        // Mark leaving BEFORE clearCart so CheckoutPage never flashes empty-cart UI.
        if (result.paymentType === "gateway") {
          const safeUrl = sanitizePaymentRedirectUrl(result.paymentUrl);
          if (!safeUrl) {
            throw new Error(
              "Payment gateway did not return a valid payment link. Your cart was kept.",
            );
          }
          writeLastCheckoutOrder({
            orderId: result.orderId,
            mode: result.mode,
            paymentType: result.paymentType,
          });
          beginLeaving("gateway");
          clearCart();
          window.location.assign(safeUrl);
          return result;
        }

        writeLastCheckoutOrder({
          orderId: result.orderId,
          mode: result.mode,
          paymentType: result.paymentType,
        });
        beginLeaving("success");
        clearCart();
        router.push(
          `/checkout/success?orderId=${encodeURIComponent(result.orderId)}`,
        );
        return result;
      } catch (err) {
        const message = getUnknownErrorMessage(
          err,
          "Failed to place order. Please try again.",
        );
        setError(message);
        isLeavingRef.current = false;
        setIsLeavingCheckout(false);
        setLeaveKind(null);
        throw new Error(message);
      } finally {
        // Keep submit/leave state while the browser navigates away.
        if (!isLeavingRef.current) {
          setIsSubmitting(false);
        }
      }
    },
    [
      auth.isAuthenticated,
      beginLeaving,
      clearCart,
      items,
      requestPhoneOtp,
      resolvedPermissions,
      router,
    ],
  );

  return {
    items,
    totalPrice,
    isSubmitting: isSubmitting || isSyncingGuest || isLeavingCheckout,
    isSyncingGuest,
    isLeavingCheckout,
    leaveKind,
    error,
    isAuthenticated: Boolean(auth.isAuthenticated),
    permissions: resolvedPermissions,
    permissionsLoading,
    guestIdLoading,
    otpDialog,
    resolveOtpDialog,
    submitCheckout,
    authUser: auth.user,
  };
}
