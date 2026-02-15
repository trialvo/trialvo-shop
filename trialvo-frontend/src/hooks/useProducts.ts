import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Product } from "@/data/products";

// Fetch all active products with optional category filter
async function fetchProducts(category?: string): Promise<Product[]> {
  const query = category ? `?category=${category}` : "";
  const data = await api.get<any[]>(`/products${query}`);
  return data.map(rowToProduct);
}

// Fetch single product by slug
async function fetchProductBySlug(slug: string): Promise<Product | null> {
  try {
    const data = await api.get<any>(`/products/${slug}`);
    return rowToProduct(data);
  } catch {
    return null;
  }
}

// Fetch featured products
async function fetchFeaturedProducts(): Promise<Product[]> {
  const data = await api.get<any[]>("/products/featured");
  return data.map(rowToProduct);
}

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

// ========== Hooks ==========

export function useProducts(category?: string) {
  return useQuery({
    queryKey: ["products", category || "all"],
    queryFn: () => fetchProducts(category),
    staleTime: 1000 * 60,
  });
}

export function useProduct(slug: string | undefined) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: () => fetchProductBySlug(slug!),
    enabled: !!slug,
    staleTime: 1000 * 60,
  });
}

export function useFeaturedProducts() {
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
      // We need the slug for the related endpoint, but we only have productId
      // Use the products endpoint with category filter instead
      const data = await api.get<any[]>(`/products?category=${category}`);
      return data
        .filter((p: any) => p.id !== productId)
        .slice(0, 3)
        .map(rowToProduct);
    },
    enabled: !!productId && !!category,
    staleTime: 1000 * 60,
  });
}
