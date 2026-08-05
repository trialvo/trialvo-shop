import type { ApiError } from "@/lib/api/auth/service";
import { api } from "../client";

export type BrandItem = {
  id: number;
  name: string;
  slug?: string | null;
  logo_path?: string | null;
  status: boolean;

  created_at?: string;
  updated_at?: string;
};

export type BrandListParams = {
  status?: boolean;
  limit?: number;
  offset?: number;
};

export type Pagination = {
  limit: number;
  offset: number;
  total: number;
};

export type BrandListResponse = {
  success: boolean;
  pagination?: Pagination;
  data: BrandItem[];
  message?: string;
  error?: string;
  flag?: number;
};

export type BrandDetailResponse = {
  success: boolean;
  data: BrandItem;
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

class BrandService {
  async getBrands(params?: BrandListParams): Promise<BrandListResponse> {
    try {
      const response = await api.get<BrandListResponse>("/brands", {
        params: {
          status: params?.status ?? true,
          limit: params?.limit,
          offset: params?.offset,
        },
      });

      return response.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to get brands"));
    }
  }

  async getBrandById(id: number, params?: { status?: boolean }): Promise<BrandDetailResponse> {
    try {
      const response = await api.get<BrandDetailResponse>(`/brand/${id}`, {
        params: { status: params?.status ?? true },
      });

      return response.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to get brand"));
    }
  }
}

export const brandService = new BrandService();
