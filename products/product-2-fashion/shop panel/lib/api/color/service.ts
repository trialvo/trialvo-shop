import type { ApiError } from "@/lib/api/auth/service";
import { api } from "../client";

export type ColorItem = {
  id: number;
  name: string;
  name_bd?: string | null;
  hex: string | null;

  priority: number;
  status: boolean;

  created_at: string;
  updated_at: string;
};

export type ColorListParams = {
  name?: string;
  status?: boolean;
  limit?: number;
  offset?: number;
};

export type ColorListResponse = {
  data: ColorItem[];
  total: number;
};

export type ColorDetailResponse = {
  data: ColorItem;
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

class ColorService {
  async getColors(params?: ColorListParams): Promise<ColorListResponse> {
    try {
      const response = await api.get<ColorListResponse>("/colors", {
        params: {
          name: params?.name,
          status: params?.status,
          limit: params?.limit,
          offset: params?.offset,
        },
      });

      return response.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to get colors"));
    }
  }

  async getColorById(
    id: number,
    params?: { status?: boolean },
  ): Promise<ColorDetailResponse> {
    try {
      const response = await api.get<ColorDetailResponse>(`/color/${id}`, {
        params: { status: params?.status },
      });

      return response.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to get color"));
    }
  }
}

export const colorService = new ColorService();
