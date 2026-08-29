import type { LucideIcon } from "lucide-react";
import {
  Clapperboard,
  MonitorPlay,
  Package,
  Sparkles,
  Star,
} from "lucide-react";
import type { Product } from "@/types/product";
import type {
  DigitalGoodsTag,
  LocalizedString,
  MarketplaceLanguage,
} from "@/types/marketplace";

/** Fallback labels when categories API has not resolved yet */
export const CATEGORY_LABELS: Record<string, LocalizedString> = {
  ecommerce: { bn: "ইকমার্স", en: "Ecommerce" },
  fashion: { bn: "ফ্যাশন", en: "Fashion" },
  gift: { bn: "গিফট", en: "Gift" },
  accessories: { bn: "একসেসরিজ", en: "Accessories" },
  tech: { bn: "টেক", en: "Tech" },
};

export type ProductBadgeTone =
  | "accent"
  | "trial"
  | "neutral"
  | "info"
  | "warning";

export type ProductBadgeId =
  | "featured"
  | "trial"
  | "digital"
  | "demo"
  | "video";

export type ProductBadge = {
  id: ProductBadgeId;
  label: LocalizedString;
  /** Maps 1:1 to DynamicBadge variant */
  tone: ProductBadgeTone;
  icon: LucideIcon;
};

/**
 * Resolve category display name from API categories, with static fallback.
 */
export function resolveCategoryLabel(
  categorySlug: string,
  language: MarketplaceLanguage,
  apiCategories?: Array<{
    slug: string;
    name?: { bn?: string; en?: string } | null;
  }>,
): string {
  const fromApi = apiCategories?.find((item) => item.slug === categorySlug);
  const apiName =
    fromApi?.name?.[language]?.trim() ||
    fromApi?.name?.en?.trim() ||
    fromApi?.name?.bn?.trim();
  if (apiName) return apiName;

  const fallback = CATEGORY_LABELS[categorySlug];
  return (
    fallback?.[language]?.trim() ||
    fallback?.en?.trim() ||
    categorySlug
  );
}

export function getPrimaryDemoUrl(product: Product): string | null {
  const shopUrl = product.deployConfig?.shared_demo_shop_url;
  if (typeof shopUrl === "string" && shopUrl.trim()) return shopUrl.trim();
  return null;
}

export type DemoTargetId = "shop" | "admin";

export type DemoTarget = {
  id: DemoTargetId;
  url: string;
  /** Hostname shown next to the link so buyers see where it opens */
  host: string;
  /** Admin needs credentials; the storefront is open to anyone */
  requiresLogin: boolean;
};

function readConfigUrl(product: Product, key: string): string | null {
  const value = product.deployConfig?.[key];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.href.replace(/\/$/, "");
  } catch {
    return null;
  }
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

/**
 * Every demo entry point a buyer can open for a product: the customer-facing
 * storefront and, when configured, the admin panel. Both come from
 * `deploy_config`, so a product without demo URLs simply returns an empty list.
 */
export function getDemoTargets(product: Product): DemoTarget[] {
  const targets: DemoTarget[] = [];

  const shopUrl = readConfigUrl(product, "shared_demo_shop_url");
  if (shopUrl) {
    targets.push({
      id: "shop",
      url: shopUrl,
      host: hostOf(shopUrl),
      requiresLogin: false,
    });
  }

  const adminUrl = readConfigUrl(product, "shared_demo_admin_url");
  if (adminUrl) {
    targets.push({
      id: "admin",
      url: adminUrl,
      host: hostOf(adminUrl),
      requiresLogin: true,
    });
  }

  return targets;
}

/**
 * All badges derived from real product / API flags.
 * Only includes badges that are actually available on the product.
 */
export function getProductBadges(product: Product): ProductBadge[] {
  const badges: ProductBadge[] = [];

  if (product.isFeatured) {
    badges.push({
      id: "featured",
      label: { bn: "বেস্ট সেলার", en: "Best seller" },
      tone: "accent",
      icon: Star,
    });
  }

  if (product.isTrialable) {
    badges.push({
      id: "trial",
      label: { bn: "লাইভ ট্রায়াল", en: "Live trial" },
      tone: "trial",
      icon: Sparkles,
    });
  }

  badges.push({
    id: "digital",
    label: { bn: "ডিজিটাল প্রোডাক্ট", en: "Digital product" },
    tone: "neutral",
    icon: Package,
  });

  if (getPrimaryDemoUrl(product)) {
    badges.push({
      id: "demo",
      label: { bn: "লাইভ ডেমো", en: "Live demo" },
      tone: "info",
      icon: MonitorPlay,
    });
  }

  if (product.videoUrl?.trim()) {
    badges.push({
      id: "video",
      label: { bn: "ভিডিও", en: "Video" },
      tone: "warning",
      icon: Clapperboard,
    });
  }

  return badges;
}

/** Compatibility helper used by older call sites */
export function getDigitalGoodsTags(product: Product): DigitalGoodsTag[] {
  return getProductBadges(product).map(({ id, label }) => ({ id, label }));
}

export function formatPriceBdt(
  amount: number,
  language: MarketplaceLanguage,
  currencyLabel: string,
): string {
  const formatted = amount.toLocaleString(language === "bn" ? "bn-BD" : "en-US");
  return `${currencyLabel}${formatted}`;
}

export function formatPriceUsd(
  amount: number,
  language: MarketplaceLanguage,
): string {
  const formatted = amount.toLocaleString(language === "bn" ? "bn-BD" : "en-US", {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `$${formatted}`;
}
