import type { MetadataRoute } from "next";

const siteUrl = "https://shoplinkbd.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/account/", "/admin/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
