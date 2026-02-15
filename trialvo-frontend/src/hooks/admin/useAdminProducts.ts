import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Product } from "@/data/products";

function rowToProduct(row: any): Product {
  return {
    id: row.id,
    slug: row.slug,
    category: row.category,
    priceBDT: Number(row.price_bdt),
    priceUSD: Number(row.price_usd),
    thumbnail: row.thumbnail,
    images:
      typeof row.images === "string" ? JSON.parse(row.images) : row.images,
    videoUrl: row.video_url || undefined,
    demo: typeof row.demo === "string" ? JSON.parse(row.demo) : row.demo,
    name: typeof row.name === "string" ? JSON.parse(row.name) : row.name,
    shortDescription:
      typeof row.short_description === "string"
        ? JSON.parse(row.short_description)
        : row.short_description,
    features:
      typeof row.features === "string"
        ? JSON.parse(row.features)
        : row.features,
    facilities:
      typeof row.facilities === "string"
        ? JSON.parse(row.facilities)
        : row.facilities,
    faq: typeof row.faq === "string" ? JSON.parse(row.faq) : row.faq,
    seo: typeof row.seo === "string" ? JSON.parse(row.seo) : row.seo,
    isFeatured: Boolean(row.is_featured),
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
  };
}

export function useAdminProducts() {
  return useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => {
      const data = await api.get<any[]>("/admin/products");
      return data.map(rowToProduct);
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (product: Record<string, any>) => {
      return await api.post("/admin/products", product);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["featuredProducts"] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: { id: string } & Record<string, any>) => {
      return await api.put(`/admin/products/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["featuredProducts"] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/admin/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["featuredProducts"] });
    },
  });
}
