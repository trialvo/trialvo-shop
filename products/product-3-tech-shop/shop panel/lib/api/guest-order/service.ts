"use client";

import { api } from "../client";

export type ApiError = {
  flag?: number;
  error?: string;
  message?: string;
};

export interface ApiResponse<T = unknown> {
  success?: boolean;
  error?: string;
  message?: string;
  data?: T;
  flag?: number;
}

export type GuestOrderItemPayload = {
  product_sku_id: number;
  quantity: number;
};

export type CreateGuestOrderPayload = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  full_address?: string;
  city?: string;
  zip_code?: string;
  location_mapping_id?: number | null;
  delivery_charge_id?: number;
  payment_type?: "gateway" | "cod" | "mixed" | string;
  // Analytics: FB CAPI cookie handoff (from useCookieIds hook)
  fbp?: string | null;
  fbc?: string | null;
  capi_event_id?: string | null;
  items: GuestOrderItemPayload[];
};

export type UpdateGuestOrderPayload = {
  name?: string;
  email?: string;
  phone?: string;
  full_address?: string;
  city?: string;
  zip_code?: string;
  location_mapping_id?: number | null;
};

export type VerifyGuestPhonePayload = {
  otp: number | string;
};

export type InitiateGuestOrderPayload = {
  payment_type: "gateway" | "cod" | "mixed" | string;
  delivery_charge_id: number;
  coupon_code?: string;
  name?: string;
  email?: string;
  phone?: string;
  full_address?: string;
  city?: string;
  zip_code?: string;
  note?: string;
};

export type InitiateGuestPaymentPayload = {
  payment_method: string;
};

export type GuestOrderPermissions = {
  success?: boolean;
  email_required: boolean;
  email_verification_required?: boolean;
  phone_verification_required: boolean;
};

export type ReplaceGuestOrderItemsPayload = {
  items: GuestOrderItemPayload[];
};

export type ReplaceGuestOrderItemsResponse = ApiResponse<{
  items_count?: number;
  [key: string]: unknown;
}>;


export type GuestOrderBaseData = Record<string, unknown>;

export type CreateGuestOrderResponse = ApiResponse<GuestOrderBaseData> & {
  guest_order_id?: string;
  id?: string;
};

export type UpdateGuestOrderResponse = ApiResponse<GuestOrderBaseData>;

export type ResendOtpResponse = ApiResponse<{
  otp_sent?: boolean;
  [key: string]: unknown;
}>;

export type VerifyPhoneResponse = ApiResponse<{
  verified?: boolean;
  [key: string]: unknown;
}>;

// Updated to match actual API response structure
export type InitiateGuestOrderResponse = {
  success?: boolean;
  error?: string;
  message?: string;
  data?: {
    order_id?: number;
    customer_linked?: {
      user_id?: number;
      email?: string;
      name?: string;
      note?: string;
    };
    totals?: {
      subtotal?: number;
      sku_discount?: number;
      coupon_discount?: number;
      discount_total?: number;
      delivery?: number;
      grand_total?: number;
    };
    delivery_info?: {
      free_delivery?: boolean;
      message?: string;
    };
    order_details?: {
      name?: string;
      phone?: string;
      address?: string;
      items_count?: number;
      payment_type?: string;
      delivery_charge?: number;
      customer_id?: number;
    };
    coupon_applied?: unknown;
    payment?: {
      type?: string;
      advance_required?: boolean;
      url?: string;
    };
    next_steps?: string;
    next?: string;
    [key: string]: unknown;
  };
  // These fields are at root level in API response
  order_id?: number;
  payment?: {
    type?: string;
    advance_required?: boolean;
    url?: string;
  };
  flag?: number;
  [key: string]: unknown;
};

export type InitiateGuestPaymentResponse = ApiResponse<{
  url?: string;
  [key: string]: unknown;
}>;

const getServerErrorMessage = (err: unknown, fallback: string) => {
  const e = err as {
    response?: { data?: ApiError };
    message?: string;
  };

  return e?.response?.data?.error || e?.response?.data?.message || e?.message || fallback;
};

class GuestOrderService {
  async createGuestOrder(payload: CreateGuestOrderPayload): Promise<CreateGuestOrderResponse> {
    try {
      const res = await api.post<CreateGuestOrderResponse>("/guest/order", payload);
      return res.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Guest order create failed"));
    }
  }

  async updateGuestOrder(id: string, payload: UpdateGuestOrderPayload): Promise<UpdateGuestOrderResponse> {
    try {
      const res = await api.put<UpdateGuestOrderResponse>(`/guest/order/${id}`, payload);
      return res.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Guest order update failed"));
    }
  }

  async resendOtp(id: string): Promise<ResendOtpResponse> {
    try {
      const res = await api.post<ResendOtpResponse>(`/guest/order/${id}/resend-otp`);
      return res.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Resend OTP failed"));
    }
  }

  async verifyPhone(id: string, payload: VerifyGuestPhonePayload): Promise<VerifyPhoneResponse> {
    try {
      const res = await api.post<VerifyPhoneResponse>(`/guest/order/${id}/verify-phone`, payload);
      return res.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Phone verification failed"));
    }
  }

  async initiate(id: string, payload: InitiateGuestOrderPayload): Promise<InitiateGuestOrderResponse> {
    try {
      const res = await api.post<InitiateGuestOrderResponse>(`/guest/order/${id}/initiate`, payload);
      return res.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Guest order initiate failed"));
    }
  }

  async initiatePayment(id: string, payload: InitiateGuestPaymentPayload): Promise<InitiateGuestPaymentResponse> {
    try {
      const res = await api.post<InitiateGuestPaymentResponse>(`/guest/order/${id}/initiate-payment`, payload);
      return res.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Guest initiate payment failed"));
    }
  }

  async replaceItems(
    id: string,
    payload: ReplaceGuestOrderItemsPayload,
  ): Promise<ReplaceGuestOrderItemsResponse> {
    try {
      const res = await api.post<ReplaceGuestOrderItemsResponse>(
        `/guest/order/${id}/items/replace`,
        payload,
      );
      return res.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to sync guest order items"));
    }
  }

  async getOrderPermissions(): Promise<GuestOrderPermissions> {
    try {
      const res = await api.get<GuestOrderPermissions>("/guest/orderPermissions");
      return res.data;
    } catch {
      // Fail closed: require email + phone verify when permissions API is down
      return { email_required: true, phone_verification_required: true };
    }
  }

}



export const guestOrderService = new GuestOrderService();

export const guestOrderKeys = {
  all: ["guest-order"] as const,
  detail: (id: string) => [...guestOrderKeys.all, "detail", id] as const,
};
