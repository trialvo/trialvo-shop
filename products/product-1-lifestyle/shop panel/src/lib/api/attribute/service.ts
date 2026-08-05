import type { ApiError } from "@/lib/api/auth/service";
import { api } from "../client";

export type Pagination = {
  limit: number;
  offset: number;
  total: number;
};

export type AttributeItem = {
  id: number;
  name: string;
  slug?: string | null;
  status: boolean;

  created_at?: string;
  updated_at?: string;
};

export type AttributeListParams = {
  status?: boolean; // default true
  limit?: number;
  offset?: number;
};

export type AttributeListResponse = {
  success: boolean;
  pagination?: Pagination;
  data: AttributeItem[];
  message?: string;
  error?: string;
  flag?: number;
};

export type AttributeDetailResponse = {
  success: boolean;
  data: AttributeItem;
  message?: string;
  error?: string;
  flag?: number;
};

const getServerErrorMessage = (err: unknown, fallback: string) => {
  const e = err as {
    response?: { data?: ApiError };
    message?: string;
  };

  return e?.response?.data?.error || e?.response?.data?.message || e?.message || fallback;
};

class AttributeService {
  async getAttributes(params?: AttributeListParams): Promise<AttributeListResponse> {
    try {
      const response = await api.get<AttributeListResponse>("/attributes", {
        params: {
          status: params?.status ?? true,
          limit: params?.limit,
          offset: params?.offset,
        },
      });

      return response.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to get attributes"));
    }
  }

  async getAttributeById(
    id: number,
    params?: { status?: boolean },
  ): Promise<AttributeDetailResponse> {
    try {
      const response = await api.get<AttributeDetailResponse>(`/attribute/${id}`, {
        params: { status: params?.status ?? true },
      });

      return response.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to get attribute"));
    }
  }
}

export const attributeService = new AttributeService();
