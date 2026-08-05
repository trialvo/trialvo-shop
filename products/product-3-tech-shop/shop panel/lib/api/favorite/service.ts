import type { ApiError } from "@/lib/api/auth/service";
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

class FavoriteService {
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
