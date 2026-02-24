import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customerApiHelper } from "@/contexts/CustomerAuthContext";

export interface WishlistItem {
  id: string;
  product_id: string;
  customer_id: string;
  name: string;
  slug: string;
  thumbnail: string;
  price_bdt: number;
  price_usd: number;
  discount_price_bdt: number | null;
  created_at: string;
}

export function useWishlist() {
  return useQuery({
    queryKey: ["customer", "wishlist"],
    queryFn: async () => {
      const data = await customerApiHelper.get("/customer/wishlist");
      return data as WishlistItem[];
    },
  });
}

export function useAddToWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      return await customerApiHelper.post(
        `/customer/wishlist/${productId}`,
        {},
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer", "wishlist"] });
    },
  });
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      return await customerApiHelper.delete(`/customer/wishlist/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer", "wishlist"] });
    },
  });
}
