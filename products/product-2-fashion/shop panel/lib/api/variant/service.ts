import type { ApiError } from "@/lib/api/auth/service";
import { api } from "../client";

export type VariantItem = {
  id: number;
  attribute_id: number;

  name: string;
  name_bd?: string | null;

  serial: number;
  status: boolean;

  created_at: string;
  updated_at: string;

  attribute_name: string;
};

export type VariantListParams = {
  name?: string;
  status?: boolean;
  limit?: number;
  offset?: number;

  // optional filters (if your backend supports later)
  attribute_id?: number;
};

export type VariantListResponse = {
  data: VariantItem[];
  total: number;
};

export type VariantDetailResponse = {
  data: VariantItem;
};

const getServerErrorMessage = (err: unknown, fallback: string) => {
  const e = err as {
    response?: { data?: ApiError };
    message?: string;
  };

  return (
    e?.response?.data?.error ||
    e?.response?.data?.message ||
    e?.message ||
    fallback
  );
};

class VariantService {
  async getVariants(params?: VariantListParams): Promise<VariantListResponse> {
    try {
      const response = await api.get<VariantListResponse>("/variants", {
        params: {
          name: params?.name,
          status: params?.status ?? true,
          limit: params?.limit,
          offset: params?.offset,
          attribute_id: params?.attribute_id,
        },
      });

      return response.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to get variants"));
    }
  }

  async getVariantById(
    id: number,
    params?: { status?: boolean },
  ): Promise<VariantDetailResponse> {
    try {
      const response = await api.get<VariantDetailResponse>(`/variant/${id}`, {
        params: { status: params?.status ?? true },
      });

      return response.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to get variant"));
    }
  }
}

export const variantService = new VariantService();
