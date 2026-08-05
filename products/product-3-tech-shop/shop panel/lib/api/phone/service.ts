import type { ApiError } from "@/lib/api/auth/service";
import { api } from "../client";

export type PhoneItem = {
  id: number;
  phone_number?: string;
  is_verified: boolean;
  is_default: 1 | 0;
};

export type Pagination = {
  limit: number;
  offset: number;
  total: number;
};

export type PhoneListResponse = {
  success: boolean;
  phones: PhoneItem[];
  message?: string;
  error?: string;
  flag?: number;
};

export type SinglePhoneResponse = {
  success: boolean;
  phone: PhoneItem;
  message?: string;
  error?: string;
  flag?: number;
};

export type PhoneMutationResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  flag?: number;
  data?: unknown;
};

export type CreatePhonePayload = {
  phone_number: string;
};

export type UpdatePhonePayload = Partial<CreatePhonePayload>;

const getServerErrorMessage = (err: unknown, fallback: string) => {
  const e = err as {
    response?: { data?: ApiError };
    message?: string;
  };

  return e?.response?.data?.error || e?.response?.data?.message || e?.message || fallback;
};

const PHONE_BASE = "/user/phone";
const PHONE_VERIFY = "/user/sendPhoneOtp";
const PHONE_OTP_VERIFY = "/user/verifyPhoneOtp";
const PHONE_INSERT = "/user/insertPhone";
const PHONE_LIST = "/user/phones";
const SET_DEFAULT_PHONE = "/user/setDefaultPhone";

class PhoneService {
  async getPhones(): Promise<PhoneListResponse> {
    try {
      const response = await api.get<PhoneListResponse>(PHONE_LIST);

      return response.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to get phones"));
    }
  }

  async getPhoneById(id: number): Promise<SinglePhoneResponse> {
    try {
      const response = await api.get<SinglePhoneResponse>(`${PHONE_BASE}/${id}`);
      return response.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to get phone"));
    }
  }

  async createPhone(payload: CreatePhonePayload): Promise<PhoneMutationResponse> {
    try {
      const response = await api.post<PhoneMutationResponse>(PHONE_INSERT, payload);
      return response.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to create phone"));
    }
  }

  /** Send SMS OTP for an existing `user_phones` row. */
  async verifyPhone(id: number | string): Promise<PhoneMutationResponse> {
    try {
      const response = await api.post<PhoneMutationResponse>(`${PHONE_VERIFY}`, {
        phone_id: id,
      });
      return response.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to send phone OTP"));
    }
  }

  /** Confirm SMS OTP and mark the phone as verified. */
  async verifyPhoneOtp(
    id: number | string,
    otp: number | string,
  ): Promise<PhoneMutationResponse> {
    try {
      const response = await api.post<PhoneMutationResponse>(`${PHONE_OTP_VERIFY}`, {
        phone_id: id,
        otp,
      });
      return response.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Phone verification failed"));
    }
  }

  async deletePhone(id: number): Promise<PhoneMutationResponse> {
    try {
      const response = await api.delete<PhoneMutationResponse>(`${PHONE_BASE}/${id}`);
      return response.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to delete phone"));
    }
  }

  async setDefaultPhone(id: number | string): Promise<PhoneMutationResponse> {
    try {
      const response = await api.patch<PhoneMutationResponse>(SET_DEFAULT_PHONE, {
        phone_id: id,
      });

      return response.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to set default phone"));
    }
  }
}

export const phoneService = new PhoneService();
