"use client";

/**
 * hooks/useSingleOrderCheckout.ts — Checkout flow orchestration for SOP
 *
 * Manages the multi-step OTP verification flow, form validation,
 * order placement, and payment initiation.
 */

import { useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";

import { singleOrderService } from "@/lib/api/single-order/service";
import { clearCartStorage } from "@/hooks/useSingleOrderCart";
import type {
  SOPCheckoutStep,
  SOPOrderPermissions,
  SOPMiniCart,
} from "@/types/single-order";

// ── Hook ─────────────────────────────────────────────────────────────────────

type CheckoutConfig = {
  slug: string;
  id: string;
  cart: SOPMiniCart | null;
  grandTotal: number;
};

export function useSingleOrderCheckout({
  slug,
  id,
  cart,
  grandTotal,
}: CheckoutConfig) {
  const router = useRouter();

  const [step, setStep] = useState<SOPCheckoutStep>("form");
  const [sessionId, setSessionId] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [orderId, setOrderId] = useState<number | null>(null);

  // Permissions
  const [permissions, setPermissions] = useState<SOPOrderPermissions>({
    emailRequired: true,
    phoneVerifyRequired: true,
    emailVerifyRequired: false,
  });

  const capiEventIdRef = useRef("");

  // ── Fetch Permissions ────────────────────────────────────────────────────

  const fetchPermissions = useCallback(async (): Promise<SOPOrderPermissions> => {
    const perms = await singleOrderService.getOrderPermissions();
    setPermissions(perms);
    return perms;
  }, []);

  // ── Generate Event ID (for analytics) ──────────────────────────────────

  const generateEventId = useCallback((): string => {
    return `sop_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }, []);

  // ── Get FB Cookies ─────────────────────────────────────────────────────

  const getFbCookies = useCallback(() => {
    if (typeof document === "undefined") return { fbp: "", fbc: "" };
    const cookies = document.cookie;
    return {
      fbp: cookies.match(/_fbp=([^;]+)/)?.[1] ?? "",
      fbc: cookies.match(/_fbc=([^;]+)/)?.[1] ?? "",
    };
  }, []);

  // ── Place Order (core) ────────────────────────────────────────────────

  const placeOrderCore = useCallback(
    async (
      sid: string,
      formData: {
        name: string;
        phone: string;
        email: string;
        addressType: "home" | "office" | "na";
        address: string;
        city: string;
        locationMappingId: number | null;
        deliveryChargeId: string;
        note: string;
        paymentProvider: string;
      },
    ) => {
      if (!cart) return;
      setStep("placing");
      try {
        const eventId = generateEventId();
        capiEventIdRef.current = eventId;
        const { fbp, fbc } = getFbCookies();

        const orderRes = await singleOrderService.placeOrder({
          session_id: sid,
          product_id: cart.productId,
          items: cart.items.map((i) => ({
            product_sku_id: i.skuId,
            quantity: i.qty,
          })),
          name: formData.name,
          phone: formData.phone,
          email: formData.email || undefined,
          address_type: formData.addressType,
          full_address: formData.address,
          city: formData.city,
          location_mapping_id: formData.locationMappingId ?? undefined,
          delivery_charge_id: Number(formData.deliveryChargeId),
          note: formData.note || undefined,
          payment_type: formData.paymentProvider === "cod" ? "cod" : "gateway",
          capi_event_id: eventId,
          fbp,
          fbc,
        });

        if (orderRes.success && orderRes.order_id) {
          setOrderId(orderRes.order_id);

          // Handle payment gateway redirect
          if (
            formData.paymentProvider !== "cod" &&
            orderRes.payment?.needs_initiation
          ) {
            try {
              const payRes = await singleOrderService.initiatePayment(
                orderRes.order_id,
                sid,
                formData.paymentProvider,
              );
              const gatewayUrl =
                typeof payRes?.url === "string" ? payRes.url.trim() : "";
              if (gatewayUrl) {
                globalThis.location.href = gatewayUrl;
                return;
              }
            } catch {
              // Fall through to success page if payment initiation fails
            }
          }

          clearCartStorage();
          router.push(`/checkout/success?orderId=${orderRes.order_id}`);
        } else {
          setOtpError(orderRes.message || "Order failed");
          setStep("form");
        }
      } catch (err) {
        setOtpError(
          err instanceof Error ? err.message : "Network error",
        );
        setStep("form");
      }
    },
    [cart, generateEventId, getFbCookies, router],
  );

  // ── Send Phone OTP ────────────────────────────────────────────────────

  const sendPhoneOtp = useCallback(
    async (phone: string) => {
      setOtpSending(true);
      setOtpError("");
      try {
        const res = await singleOrderService.sendPhoneOtp(phone);
        if (res.success && res.session_id) {
          setSessionId(res.session_id);
          setOtp("");
          setStep("phone_otp");
        } else {
          setOtpError(res.message || "Failed to send OTP");
        }
      } catch (err) {
        setOtpError(
          err instanceof Error ? err.message : "Network error",
        );
      } finally {
        setOtpSending(false);
      }
    },
    [],
  );

  // ── Send Email OTP ────────────────────────────────────────────────────

  const sendEmailOtp = useCallback(
    async (email: string, sid?: string) => {
      const s = sid || sessionId;
      if (!s || !email) return;
      setOtpSending(true);
      setOtpError("");
      try {
        const res = await singleOrderService.sendEmailOtp(s, email);
        if (res.success) {
          setOtp("");
          setStep("email_otp");
        } else {
          setOtpError(res.message || "Failed to send email OTP");
        }
      } catch (err) {
        setOtpError(
          err instanceof Error ? err.message : "Network error",
        );
      } finally {
        setOtpSending(false);
      }
    },
    [sessionId],
  );

  // ── Verify Phone OTP ──────────────────────────────────────────────────

  const verifyPhoneOtp = useCallback(
    async (
      email: string,
      formData: Parameters<typeof placeOrderCore>[1],
    ) => {
      if (!otp || otp.length < 6 || !sessionId) return;
      setOtpVerifying(true);
      setOtpError("");
      try {
        const res = await singleOrderService.verifyPhoneOtp(sessionId, otp);
        if (!res.success) {
          setOtpError(res.message || "Invalid OTP");
          return;
        }

        // Phone verified → check if email verification is needed
        if (permissions.emailVerifyRequired && email) {
          await sendEmailOtp(email);
        } else {
          await placeOrderCore(sessionId, formData);
        }
      } catch (err) {
        setOtpError(
          err instanceof Error ? err.message : "Network error",
        );
      } finally {
        setOtpVerifying(false);
      }
    },
    [otp, sessionId, permissions.emailVerifyRequired, sendEmailOtp, placeOrderCore],
  );

  // ── Verify Email OTP ──────────────────────────────────────────────────

  const verifyEmailOtp = useCallback(
    async (formData: Parameters<typeof placeOrderCore>[1]) => {
      if (!otp || otp.length < 6 || !sessionId) return;
      setOtpVerifying(true);
      setOtpError("");
      try {
        const res = await singleOrderService.verifyEmailOtp(sessionId, otp);
        if (!res.success) {
          setOtpError(res.message || "Invalid OTP");
          return;
        }
        await placeOrderCore(sessionId, formData);
      } catch (err) {
        setOtpError(
          err instanceof Error ? err.message : "Network error",
        );
      } finally {
        setOtpVerifying(false);
      }
    },
    [otp, sessionId, placeOrderCore],
  );

  // ── Handle Place Order (entry point) ───────────────────────────────────

  const handlePlaceOrder = useCallback(
    async (formData: Parameters<typeof placeOrderCore>[1]) => {
      const latestPerms = await fetchPermissions();
      setOtpError("");

      if (latestPerms.phoneVerifyRequired) {
        await sendPhoneOtp(formData.phone);
      } else if (latestPerms.emailVerifyRequired && formData.email) {
        // Create session then send email OTP
        setOtpSending(true);
        try {
          const sessionRes = await singleOrderService.createSession(
            formData.phone,
            formData.email || undefined,
          );
          if (sessionRes.success && sessionRes.session_id) {
            setSessionId(sessionRes.session_id);
            await sendEmailOtp(formData.email, sessionRes.session_id);
          } else {
            setOtpError(sessionRes.message || "Failed to start session");
          }
        } finally {
          setOtpSending(false);
        }
      } else {
        // No verification required — create session and place order directly
        setOtpSending(true);
        try {
          const sessionRes = await singleOrderService.createSession(
            formData.phone,
            formData.email || undefined,
          );
          if (sessionRes.success && sessionRes.session_id) {
            setSessionId(sessionRes.session_id);
            await placeOrderCore(sessionRes.session_id, formData);
          } else {
            setOtpError(sessionRes.message || "Failed to start session");
          }
        } finally {
          setOtpSending(false);
        }
      }
    },
    [fetchPermissions, sendPhoneOtp, sendEmailOtp, placeOrderCore],
  );

  // ── Form Validation Helpers ────────────────────────────────────────────

  const phoneError = useCallback((phone: string): string => {
    if (!phone) return "";
    if (!/^01\d{9}$/.test(phone))
      return "Enter a valid BD mobile number (01XXXXXXXXX)";
    return "";
  }, []);

  const emailError = useCallback((email: string): string => {
    if (!email) return "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return "Enter a valid email address";
    return "";
  }, []);

  const canSubmit = useCallback(
    (formData: {
      name: string;
      phone: string;
      email: string;
      locationMappingId: number | null;
      address: string;
      deliveryChargeId: string;
      paymentProvider: string;
    }): boolean => {
      return !!(
        formData.name.trim().length >= 2 &&
        /^01\d{9}$/.test(formData.phone) &&
        (!permissions.emailRequired ||
          (formData.email.trim().length > 0 && !emailError(formData.email))) &&
        (!formData.email || !emailError(formData.email)) &&
        formData.locationMappingId &&
        formData.address.trim().length >= 10 &&
        formData.deliveryChargeId &&
        formData.paymentProvider
      );
    },
    [permissions.emailRequired, emailError],
  );

  // ── Navigation ─────────────────────────────────────────────────────────

  const goBackToForm = useCallback(() => {
    setStep("form");
    setOtp("");
    setOtpError("");
  }, []);

  const goBackFromEmailOtp = useCallback(() => {
    setStep(permissions.phoneVerifyRequired ? "phone_otp" : "form");
    setOtp("");
    setOtpError("");
  }, [permissions.phoneVerifyRequired]);

  return {
    // State
    step,
    otp,
    setOtp,
    otpSending,
    otpVerifying,
    otpError,
    setOtpError,
    orderId,
    permissions,

    // Actions
    fetchPermissions,
    handlePlaceOrder,
    sendPhoneOtp,
    sendEmailOtp,
    verifyPhoneOtp,
    verifyEmailOtp,
    goBackToForm,
    goBackFromEmailOtp,

    // Validators
    phoneError,
    emailError,
    canSubmit,
  };
}
