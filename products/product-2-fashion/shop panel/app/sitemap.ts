import { getSiteUrl } from "@/lib/seo";
import { fetchPublicPolicies } from "@/lib/api/policy";
import { API_URL } from "@/config/env";
import type { MetadataRoute } from "next";

type ProductItem = {
  id: number;
  slug?: string | null;
  updated_at?: string | null;
};

type ProductListResponse = {
  products?: ProductItem[];
};

type CategoryItem = {
  name?: string | null;
  updated_at?: string | null;
};

type CategoryListResponse = {
  data?: CategoryItem[];
};

type StorefrontVisibilityResponse = {
  data?: {
    show_megasale?: boolean;
  };
};

const API_ORIGIN = API_URL.replace(/\/+$/, "");

const toSlug = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const toDate = (value?: string | null): Date => {
  if (!value) return new Date();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const FETCH_TIMEOUT_MS = 8_000;

const fetchJson = async (url: string): Promise<Response | null> => {
  try {
    return await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  } catch {
    return null;
  }
};

const getProducts = async (): Promise<ProductItem[]> => {
  const res = await fetchJson(
    `${API_ORIGIN}/api/v1/user/products?limit=1000&offset=0&status=true`,
  );
  if (!res?.ok) return [];
  try {
    const data = (await res.json()) as ProductListResponse;
    return Array.isArray(data?.products) ? data.products : [];
  } catch {
    return [];
  }
};

const getCategories = async (): Promise<CategoryItem[]> => {
  const res = await fetchJson(
    `${API_ORIGIN}/api/v1/categories/mainCategories?status=true`,
  );
  if (!res?.ok) return [];
  try {
    const data = (await res.json()) as CategoryListResponse;
    return Array.isArray(data?.data) ? data.data : [];
  } catch {
    return [];
  }
};

const getStorefrontVisibility = async (): Promise<boolean> => {
  const res = await fetchJson(`${API_ORIGIN}/api/v1/user/storefront-visibility`);
  if (!res?.ok) return false;
  try {
    const data = (await res.json()) as StorefrontVisibilityResponse;
    return data?.data?.show_megasale === true;
  } catch {
    return false;
  }
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/contact-us`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/faqs`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  const [products, categories, policies, showMegaSale] = await Promise.all([
    getProducts(),
    getCategories(),
    fetchPublicPolicies(),
    getStorefrontVisibility(),
  ]);

  if (showMegaSale) {
    staticRoutes.push({
      url: `${siteUrl}/megasale`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    });
  }

  const productEntries: MetadataRoute.Sitemap = products
    .filter((item) => Number.isFinite(item.id) && item.id > 0)
    .map((item) => {
      const slug = (item.slug ?? "").trim() || `product-${item.id}`;
      return {
        url: `${siteUrl}/products/${encodeURIComponent(slug)}/${item.id}`,
        lastModified: toDate(item.updated_at),
        changeFrequency: "daily",
        priority: 0.8,
      };
    });

  const seenCategorySlugs = new Set<string>();
  const categoryEntries: MetadataRoute.Sitemap = categories
    .map((item) => {
      const raw = (item.name ?? "").trim();
      if (!raw) return null;

      const slug = toSlug(raw);
      if (!slug || seenCategorySlugs.has(slug)) return null;
      seenCategorySlugs.add(slug);

      return {
        url: `${siteUrl}/category/${encodeURIComponent(slug)}`,
        lastModified: toDate(item.updated_at),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const policyEntries: MetadataRoute.Sitemap = policies.map((p) => ({
    url: `${siteUrl}/policy/${p.policy_key}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : now,
    changeFrequency: "yearly" as const,
    priority: 0.3,
  }));

  return [...staticRoutes, ...categoryEntries, ...productEntries, ...policyEntries];
}
