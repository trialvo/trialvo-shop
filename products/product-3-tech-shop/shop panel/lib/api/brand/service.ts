import { api } from "@/lib/api/client";
import { getUnknownErrorMessage } from "@/lib/api/errors";

export type Brand = {
  id: number;
  name: string;
  img_path: string | null;
  priority: number;
  status: boolean;
  created_at?: string;
  updated_at?: string;
};

export type BrandListParams = {
  name?: string;
  status?: boolean;
  priority?: number;
  limit?: number;
  offset?: number;
};

export type BrandListResponse = {
  data: Brand[];
  total: number;
};

export const brandKeys = {
  all: ["brand"] as const,
  list: (params?: BrandListParams) =>
    [
      ...brandKeys.all,
      "list",
      params?.name ?? null,
      params?.status ?? null,
      params?.priority ?? null,
      params?.limit ?? 20,
      params?.offset ?? 0,
    ] as const,
};

class BrandService {
  async getBrands(params?: BrandListParams): Promise<BrandListResponse> {
    try {
      const res = await api.get<BrandListResponse>("/brands", {
        params: {
          status: params?.status ?? true,
          limit: params?.limit ?? 20,
          offset: params?.offset ?? 0,
          name: params?.name,
          priority: params?.priority,
        },
      });

      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      return {
        data,
        total: typeof res.data?.total === "number" ? res.data.total : data.length,
      };
    } catch (err) {
      throw new Error(getUnknownErrorMessage(err, "Failed to load brands"));
    }
  }
}

export const brandService = new BrandService();
