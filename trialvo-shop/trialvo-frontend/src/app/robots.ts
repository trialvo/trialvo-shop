import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/*/checkout",
          "/*/order-success",
          "/*/trial-status",
          "/*/trial-request-submitted",
          "/checkout",
          "/order-success",
          "/trial-status",
          "/trial-request-submitted",
        ],
      },
    ],
    sitemap: `${BRAND.siteUrl}/sitemap.xml`,
    host: BRAND.siteUrl,
  };
}
