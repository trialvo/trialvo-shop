import { API_URL } from "@/config/env";
import type { ProductDetail, ProductListItem } from "@/lib/api/product/service";
import { sanitizeProductSlug } from "@/lib/security/slug";

const API_BASE = `${API_URL.replace(/\/+$/, "")}/api/v1`;

type ListResponse = {
  success?: boolean;
  products?: ProductListItem[];
};

type DetailResponse = {
  success?: boolean;
  product?: ProductDetail;
};

/**
 * Server-only product detail fetch (no axios / client cookies).
 * Used by generateMetadata and other RSC loaders.
 */
export async function fetchProductBySlugServer(
  rawSlug: string,
): Promise<ProductDetail | null> {
  const slug = sanitizeProductSlug(rawSlug);
  if (!slug) return null;

  try {
    const listUrl = new URL(`${API_BASE}/user/products`);
    listUrl.searchParams.set("search", slug);
    listUrl.searchParams.set("limit", "30");
    listUrl.searchParams.set("status", "true");

    const listRes = await fetch(listUrl.toString(), {
      next: { revalidate: 60 },
      headers: { Accept: "application/json" },
    });

    if (!listRes.ok) return null;
    const listJson = (await listRes.json()) as ListResponse;
    const match = (listJson.products ?? []).find(
      (p) => p.slug?.toLowerCase() === slug,
    );
    if (!match?.id) return null;

    const detailRes = await fetch(`${API_BASE}/user/product/${match.id}`, {
      next: { revalidate: 60 },
      headers: { Accept: "application/json" },
    });
    if (!detailRes.ok) return null;

    const detailJson = (await detailRes.json()) as DetailResponse;
    if (!detailJson.success || !detailJson.product) return null;
    if (detailJson.product.slug.toLowerCase() !== slug) return null;

    return detailJson.product;
  } catch {
    return null;
  }
}
