import type { MetadataRoute } from "next";
import { products, categories } from "@/data/products";
import { buildShopCategoryHref } from "@/lib/shop/categoryRoutes";

const siteUrl = "https://shoplinkbd.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    "",
    "/shop",
    "/about",
    "/contact",
    "/faq",
    "/cart",
    "/wishlist",
    "/compare",
    "/order-tracking",
    "/account",
    "/policies/privacy",
    "/policies/terms",
    "/policies/return",
    "/policies/refund",
    "/policies/delivery",
    "/policies/warranty",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: (path === "" || path === "/shop" ? "daily" : "monthly") as any,
    priority: path === "" ? 1 : path === "/shop" ? 0.9 : 0.7,
  }));

  const productPages = products.map((product) => ({
    url: `${siteUrl}/product/${product.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // Category pages use query routes: /shop?category=<slug>
  const categoryPages = categories.map((category) => ({
    url: `${siteUrl}${buildShopCategoryHref(category.slug)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...productPages, ...categoryPages];
}

