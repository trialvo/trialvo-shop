import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";
import { PRIVATE_PATH_SEGMENTS } from "@/lib/seo/routes";

const PRIVATE_DISALLOW = PRIVATE_PATH_SEGMENTS.flatMap((segment) => [
  `/${segment}`,
  `/*/${segment}`,
]);

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // /api/og backs the social share cards and /api/indexnow/<key> is the
        // IndexNow ownership proof, so both stay reachable despite the blanket
        // /api/ block.
        allow: ["/", "/api/og", "/api/indexnow/"],
        disallow: ["/admin", "/admin/", "/api/", ...PRIVATE_DISALLOW],
      },
      // Explicit allow keeps the crawlers that matter most off the generic rule.
      {
        userAgent: ["Googlebot", "Bingbot"],
        allow: "/",
        disallow: ["/admin", "/admin/", ...PRIVATE_DISALLOW],
      },
      // Training crawlers get no value from a product catalog they cannot buy from.
      {
        userAgent: ["GPTBot", "CCBot", "ClaudeBot", "Google-Extended"],
        disallow: "/",
      },
    ],
    sitemap: [`${BRAND.siteUrl}/sitemap.xml`],
    host: BRAND.siteUrl,
  };
}
