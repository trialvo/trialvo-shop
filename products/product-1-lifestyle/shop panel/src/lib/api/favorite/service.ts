import type { ApiError } from "@/lib/api/auth/service";
import {
  productService,
  type ProductListData,
  type ProductListItem,
  type ProductListParams,
} from "@/lib/api/product/service";
import { api } from "../client";

export type FavoriteAddResponse = {
  success: boolean;
  message?: string;
  data?: {
    favorite_id: number;
    product: {
      id: number;
      name: string;
      slug: string;
    };
    favorites_count: number;
  };
  error?: string;
  flag?: number;
};

export type FavoriteToggleResponse = {
  success: boolean;
  message?: string;
  data?: {
    action: "added" | "removed";
    is_favorite: boolean;
    favorite_id: number | null;
    product: {
      id: number;
      name: string;
      slug?: string | null;
    };
    favorites_count: number;
  };
  error?: string;
  flag?: number;
};

const getServerErrorMessage = (err: unknown, fallback: string) => {
  const e = err as { response?: { data?: ApiError }; message?: string };
  return e?.response?.data?.error || e?.response?.data?.message || e?.message || fallback;
};

export type FavoriteProductsParams = Pick<
  ProductListParams,
  "limit" | "offset" | "sort_by" | "sort_order" | "in_stock"
>;

const FAVORITE_PRODUCTS_PAGE_LIMIT = 50;
const FAVORITE_PRODUCTS_MAX_PAGES = 20;

const clampFavoriteLimit = (limit: number | undefined): number => {
  if (!Number.isFinite(limit)) return FAVORITE_PRODUCTS_PAGE_LIMIT;
  return Math.min(
    Math.max(Math.trunc(limit ?? FAVORITE_PRODUCTS_PAGE_LIMIT), 1),
    FAVORITE_PRODUCTS_PAGE_LIMIT,
  );
};

class FavoriteService {
  async getFavoriteProducts(params?: FavoriteProductsParams): Promise<ProductListData> {
    try {
      return await productService.getProducts({
        ...params,
        limit: clampFavoriteLimit(params?.limit),
        offset: Math.max(Math.trunc(params?.offset ?? 0), 0),
        status: true,
        is_favourite: true,
      });
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to get favorite products"));
    }
  }

  async getAllFavoriteProducts(
    params?: Omit<FavoriteProductsParams, "limit" | "offset">,
  ): Promise<ProductListItem[]> {
    const products: ProductListItem[] = [];
    let offset = 0;

    for (let page = 0; page < FAVORITE_PRODUCTS_MAX_PAGES; page += 1) {
      const response = await this.getFavoriteProducts({
        ...params,
        limit: FAVORITE_PRODUCTS_PAGE_LIMIT,
        offset,
      });
      const pageProducts = Array.isArray(response.products) ? response.products : [];
      products.push(...pageProducts);

      const total = Number(response.total);
      if (
        pageProducts.length < FAVORITE_PRODUCTS_PAGE_LIMIT ||
        (Number.isFinite(total) && products.length >= total)
      ) {
        break;
      }

      offset += pageProducts.length;
    }

    return products;
  }

  async addFavorite(productId: number): Promise<FavoriteAddResponse> {
    try {
      const response = await api.post<FavoriteAddResponse>(`/user/favorites/${productId}`);
      return response.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to add favorite"));
    }
  }

  async toggleFavorite(productId: number): Promise<FavoriteToggleResponse> {
    try {
      const response = await api.post<FavoriteToggleResponse>(
        `/user/favorites/${productId}/toggle`,
      );
      return response.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to toggle favorite"));
    }
  }
}

export const favoriteService = new FavoriteService();
