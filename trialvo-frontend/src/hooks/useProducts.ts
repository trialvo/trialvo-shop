import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Product } from "@/data/products";
import type { ProductApiRow } from "@/types/marketplace";

function parseJsonField<T>(value: T | string | null | undefined, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function rowToProduct(row: ProductApiRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    category: row.category,
    priceBDT: Number(row.price_bdt),
    priceUSD: Number(row.price_usd),
    thumbnail: row.thumbnail,
    images: (() => {
      const parsed = parseJsonField(row.images, { admin: [], shop: [] } as {
        admin: string[];
        shop: string[];
      });
      return {
        admin: Array.isArray(parsed?.admin) ? parsed.admin : [],
        shop: Array.isArray(parsed?.shop) ? parsed.shop : [],
      };
    })(),
    videoUrl: row.video_url || undefined,
    demo: parseJsonField(row.demo, []),
    name: parseJsonField(row.name, { bn: "", en: "" }),
    shortDescription: parseJsonField(row.short_description, { bn: "", en: "" }),
    features: parseJsonField(row.features, { bn: [], en: [] }),
    facilities: parseJsonField(row.facilities, { bn: [], en: [] }),
    faq: parseJsonField(row.faq, []),
    seo: parseJsonField(row.seo, {
      title: { bn: "", en: "" },
      description: { bn: "", en: "" },
      keywords: { bn: [], en: [] },
    }),
    isFeatured: Boolean(row.is_featured),
    isActive: Boolean(row.is_active),
    isTrialable: Boolean(row.is_trialable),
    sortOrder:
      row.sort_order == null || row.sort_order === ""
        ? undefined
        : Number(row.sort_order),
    deployConfig: (() => {
      const parsed = parseJsonField<Record<string, unknown> | null>(row.deploy_config, null);
      return parsed && typeof parsed === "object" ? parsed : null;
    })(),
    createdAt: row.created_at,
  };
}

async function fetchProducts(category?: string): Promise<Product[]> {
  const query = category ? `?category=${category}` : "";
  const data = await api.get<ProductApiRow[]>(`/products${query}`);
  return data.map(rowToProduct);
}

async function fetchProductBySlug(slug: string): Promise<Product | null> {
  try {
    const data = await api.get<ProductApiRow>(`/products/${slug}`);
    return rowToProduct(data);
  } catch {
    return null;
  }
}

async function fetchFeaturedProducts(): Promise<Product[]> {
  const data = await api.get<ProductApiRow[]>("/products/featured");
  return data.map(rowToProduct);
}

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
    enabled: Boolean(slug),
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

export function useRelatedProducts(
  productId: string | undefined,
  category: string | undefined,
) {
  return useQuery({
    queryKey: ["relatedProducts", productId, category],
    queryFn: async () => {
      if (!productId || !category) return [];
      const data = await api.get<ProductApiRow[]>(`/products?category=${category}`);
      return data
        .filter((row) => row.id !== productId)
        .slice(0, 3)
        .map(rowToProduct);
    },
    enabled: Boolean(productId && category),
    staleTime: 1000 * 60,
  });
}
