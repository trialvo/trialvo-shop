import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/data/products";

interface ProductRow {
  id: string;
  slug: string;
  category: string;
  price_bdt: number;
  price_usd: number;
  thumbnail: string;
  images: { admin: string[]; shop: string[] };
  video_url: string | null;
  demo: {
    label: { bn: string; en: string };
    url: string;
    username: string;
    password: string;
  }[];
  name: { bn: string; en: string };
  short_description: { bn: string; en: string };
  features: { bn: string[]; en: string[] };
  facilities: { bn: string[]; en: string[] };
  faq: {
    question: { bn: string; en: string };
    answer: { bn: string; en: string };
  }[];
  seo: {
    title: { bn: string; en: string };
    description: { bn: string; en: string };
    keywords: { bn: string[]; en: string[] };
  };
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
}

function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    category: row.category as Product["category"],
    priceBDT: row.price_bdt,
    priceUSD: row.price_usd,
    thumbnail: row.thumbnail,
    images: row.images,
    videoUrl: row.video_url || undefined,
    demo: row.demo,
    name: row.name,
    shortDescription: row.short_description,
    features: row.features,
    facilities: row.facilities,
    faq: row.faq,
    seo: row.seo,
    isFeatured: row.is_featured,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export function useAdminProducts() {
  return useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as ProductRow[]).map(rowToProduct);
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (product: Partial<ProductRow>) => {
      const { data, error } = await supabase
        .from("products")
        .insert(product)
        .select()
        .single();
      if (error) throw error;
      return data;
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
    }: { id: string } & Partial<ProductRow>) => {
      const { data, error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
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
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["featuredProducts"] });
    },
  });
}
