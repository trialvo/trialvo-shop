import type { MetadataRoute } from "next";
import config from "../config";

const API_URL = config.apiUrl;
const BASE_URL = config.baseUrl;

async function fetchProductSlugs(): Promise<
  { slug: string; updated_at?: string }[]
> {
  try {
    const res = await fetch(
      `${API_URL}/products?limit=500&fields=slug,updated_at`,
      {
        next: { revalidate: 3600 }, // Cache 1 hour
      },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.products || [];
  } catch {
    return [];
  }
}

async function fetchCategorySlugs(): Promise<{ slug: string }[]> {
  try {
    const res = await fetch(`${API_URL}/categories`, {
      next: { revalidate: 86400 }, // Cache 24 hours
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.categories || [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/products`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/combo-builder`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  const [productSlugs, categorySlugs] = await Promise.all([
    fetchProductSlugs(),
    fetchCategorySlugs(),
  ]);

  const productPages: MetadataRoute.Sitemap = productSlugs.map((p) => ({
    url: `${BASE_URL}/products/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const categoryPages: MetadataRoute.Sitemap = categorySlugs.map((c) => ({
    url: `${BASE_URL}/products?category=${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...productPages, ...categoryPages];
}
