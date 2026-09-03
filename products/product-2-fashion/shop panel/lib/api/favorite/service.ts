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

export function normalizeFavoritesCount(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.trunc(n);
}

/** Only rows explicitly marked favourite — matches /account/favorites UI filter */
export function pickFavouriteProducts(
  products: ProductListItem[] | null | undefined,
): ProductListItem[] {
  if (!Array.isArray(products)) return [];
  return products.filter((p) => p?.is_favourite === true);
}

export type FavoriteProductsParams = Pick<
  ProductListParams,
  "limit" | "offset" | "sort_by" | "sort_order"
>;

class FavoriteService {
  /**
   * Favourite products for account page + header count.
   * Always re-filters by `is_favourite` so a broken/ignored API filter
   * cannot inflate the count to catalog size.
   */
  async getFavoriteProducts(
    params?: FavoriteProductsParams,
  ): Promise<ProductListData & { products: ProductListItem[] }> {
    try {
      const data = await productService.getProducts({
        ...params,
        is_favourite: true,
        limit: params?.limit ?? 50,
        offset: params?.offset ?? 0,
      });

      const products = pickFavouriteProducts(data?.products);
      return {
        ...data,
        products,
        total: products.length,
        count: products.length,
        has_more: false,
      };
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to get favorite products"));
    }
  }

  async getFavoritesCount(): Promise<number> {
    const data = await this.getFavoriteProducts({ limit: 50, offset: 0 });
    return data.products.length;
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
