/**
 * lib/api/single-order/service.ts — API service for Single Order Page
 *
 * Uses the shared `api` client (Axios via BFF proxy) for all requests.
 * All endpoints are proxied through /api/v1/single-page/... to the backend.
 */

import { api } from "../client";
import type {
  SOPProductResponse,
  SOPPermissionsResponse,
  SOPSessionResponse,
  SOPOtpResponse,
  SOPVerifyResponse,
  SOPPlaceOrderPayload,
  SOPPlaceOrderResponse,
  SOPPaymentResponse,
  SOPOrderPermissions,
} from "@/types/single-order";

// ── Query Keys ───────────────────────────────────────────────────────────────

export const sopKeys = {
  all: ["single-order"] as const,
  product: (id: number) => [...sopKeys.all, "product", id] as const,
  permissions: () => [...sopKeys.all, "permissions"] as const,
};

// ── Response Helpers ─────────────────────────────────────────────────────────

const extractError = (err: unknown, fallback: string): string => {
  const e = err as {
    response?: { data?: { error?: string; message?: string } };
    message?: string;
  };
  return (
    e?.response?.data?.error ??
    e?.response?.data?.message ??
    e?.message ??
    fallback
  );
};

// ── Service ──────────────────────────────────────────────────────────────────

class SingleOrderService {
  /**
   * Fetch product data for the single order page.
   * Endpoint: GET /user/product/:id/single-page-data
   */
  async getProduct(id: number): Promise<SOPProductResponse> {
    try {
      const res = await api.get<SOPProductResponse>(
        `/user/product/${id}/single-page-data`,
      );
      return res.data;
    } catch (err) {
      throw new Error(extractError(err, "Failed to load product"));
    }
  }

  /**
   * Fetch order permissions (email required, phone/email verification required).
   * Endpoint: GET /single-page/order-permissions
   */
  async getOrderPermissions(): Promise<SOPOrderPermissions> {
    try {
      const res = await api.get<SOPPermissionsResponse>(
        "/single-page/order-permissions",
      );

      if (!res.data.success) {
        return {
          emailRequired: true,
          phoneVerifyRequired: true,
          emailVerifyRequired: false,
        };
      }

      return {
        emailRequired: res.data.email_required !== false,
        phoneVerifyRequired: res.data.phone_verification_required === true,
        emailVerifyRequired: res.data.email_verification_required === true,
      };
    } catch {
      // Fallback to safe defaults
      return {
        emailRequired: true,
        phoneVerifyRequired: true,
        emailVerifyRequired: false,
      };
    }
  }

  /**
   * Create a session without OTP verification (for no-verification flows).
   * Endpoint: POST /single-page/session
   */
  async createSession(
    phone: string,
    email?: string,
  ): Promise<SOPSessionResponse> {
    try {
      const res = await api.post<SOPSessionResponse>(
        "/single-page/session",
        { phone, email: email || undefined },
      );
      return res.data;
    } catch (err) {
      throw new Error(extractError(err, "Failed to create session"));
    }
  }

  /**
   * Send phone OTP.
   * Endpoint: POST /single-page/send-phone-otp
   */
  async sendPhoneOtp(phone: string): Promise<SOPOtpResponse> {
    try {
      const res = await api.post<SOPOtpResponse>(
        "/single-page/send-phone-otp",
        { phone },
      );
      return res.data;
    } catch (err) {
      throw new Error(extractError(err, "Failed to send OTP"));
    }
  }

  /**
   * Verify phone OTP.
   * Endpoint: POST /single-page/verify-phone-otp
   */
  async verifyPhoneOtp(
    sessionId: string,
    otp: string,
  ): Promise<SOPVerifyResponse> {
    try {
      const res = await api.post<SOPVerifyResponse>(
        "/single-page/verify-phone-otp",
        { session_id: sessionId, otp },
      );
      return res.data;
    } catch (err) {
      throw new Error(extractError(err, "OTP verification failed"));
    }
  }

  /**
   * Send email OTP.
   * Endpoint: POST /single-page/send-email-otp
   */
  async sendEmailOtp(
    sessionId: string,
    email: string,
  ): Promise<SOPOtpResponse> {
    try {
      const res = await api.post<SOPOtpResponse>(
        "/single-page/send-email-otp",
        { session_id: sessionId, email },
      );
      return res.data;
    } catch (err) {
      throw new Error(extractError(err, "Failed to send email OTP"));
    }
  }

  /**
   * Verify email OTP.
   * Endpoint: POST /single-page/verify-email-otp
   */
  async verifyEmailOtp(
    sessionId: string,
    otp: string,
  ): Promise<SOPVerifyResponse> {
    try {
      const res = await api.post<SOPVerifyResponse>(
        "/single-page/verify-email-otp",
        { session_id: sessionId, otp },
      );
      return res.data;
    } catch (err) {
      throw new Error(extractError(err, "Email OTP verification failed"));
    }
  }

  /**
   * Place the order.
   * Endpoint: POST /single-page/place-order
   */
  async placeOrder(
    payload: SOPPlaceOrderPayload,
  ): Promise<SOPPlaceOrderResponse> {
    try {
      const res = await api.post<SOPPlaceOrderResponse>(
        "/single-page/place-order",
        payload,
      );
      return res.data;
    } catch (err) {
      throw new Error(extractError(err, "Failed to place order"));
    }
  }

  /**
   * Initiate payment for an SOP order.
   * Endpoint: POST /single-page/initiate-payment/:orderId
   */
  async initiatePayment(
    orderId: number,
    sessionId: string,
    paymentMethod: string,
  ): Promise<SOPPaymentResponse> {
    try {
      const res = await api.post<SOPPaymentResponse>(
        `/single-page/initiate-payment/${orderId}`,
        { session_id: sessionId, payment_method: paymentMethod },
      );
      return res.data;
    } catch (err) {
      throw new Error(extractError(err, "Payment initiation failed"));
    }
  }
}

export const singleOrderService = new SingleOrderService();
