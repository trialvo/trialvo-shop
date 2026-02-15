import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/data/products";

// Types matching supabase row → Product interface
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

// Fetch all active products with optional category filter
async function fetchProducts(category?: string): Promise<Product[]> {
  let query = supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as ProductRow[]).map(rowToProduct);
}

// Fetch single product by slug
async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw error;
  }
  return rowToProduct(data as ProductRow);
}

// Fetch featured products
async function fetchFeaturedProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as ProductRow[]).map(rowToProduct);
}

// ========== Hooks ==========

export function useProducts(category?: string) {
  const queryClient = useQueryClient();

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("products-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["products"] });
          queryClient.invalidateQueries({ queryKey: ["featuredProducts"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["products", category || "all"],
    queryFn: () => fetchProducts(category),
    staleTime: 1000 * 60, // 1 min
  });
}

export function useProduct(slug: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("product-detail-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["product", slug] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, slug]);

  return useQuery({
    queryKey: ["product", slug],
    queryFn: () => fetchProductBySlug(slug!),
    enabled: !!slug,
    staleTime: 1000 * 60,
  });
}

export function useFeaturedProducts() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("featured-products-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["featuredProducts"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["featuredProducts"],
    queryFn: fetchFeaturedProducts,
    staleTime: 1000 * 60,
  });
}

// Get related products (same category, different id)
export function useRelatedProducts(
  productId: string | undefined,
  category: string | undefined,
) {
  return useQuery({
    queryKey: ["relatedProducts", productId, category],
    queryFn: async () => {
      if (!productId || !category) return [];
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .eq("category", category)
        .neq("id", productId)
        .limit(3);

      if (error) throw error;
      return (data as ProductRow[]).map(rowToProduct);
    },
    enabled: !!productId && !!category,
    staleTime: 1000 * 60,
  });
}
