import type { MetadataRoute } from "next";
import { LEGAL_PATHS } from "@/lib/legal/types";

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[0]["changeFrequency"]>;

export type PublicRoute = {
  path: string;
  changeFrequency: ChangeFrequency;
  priority: number;
};

/**
 * Single source of truth for indexable static routes.
 * The sitemap, the RSS feed, and the IndexNow submitter all read this, so a new
 * page only has to be registered once.
 */
export const PUBLIC_ROUTES: PublicRoute[] = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/products", changeFrequency: "daily", priority: 0.9 },
  { path: "/how-it-works", changeFrequency: "monthly", priority: 0.8 },
  { path: "/faq", changeFrequency: "weekly", priority: 0.75 },
  { path: "/about", changeFrequency: "monthly", priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.7 },
  { path: LEGAL_PATHS.terms, changeFrequency: "yearly", priority: 0.45 },
  { path: LEGAL_PATHS.privacy, changeFrequency: "yearly", priority: 0.45 },
  { path: LEGAL_PATHS.refund, changeFrequency: "yearly", priority: 0.45 },
  { path: LEGAL_PATHS.license, changeFrequency: "yearly", priority: 0.45 },
  { path: LEGAL_PATHS.support, changeFrequency: "yearly", priority: 0.45 },
  { path: LEGAL_PATHS.cookies, changeFrequency: "yearly", priority: 0.35 },
  { path: LEGAL_PATHS.acceptableUse, changeFrequency: "yearly", priority: 0.35 },
  { path: LEGAL_PATHS.disclaimer, changeFrequency: "yearly", priority: 0.35 },
];

/** Routes that must never be indexed — kept in step with `robots.ts`. */
export const PRIVATE_PATH_SEGMENTS = [
  "checkout",
  "order-success",
  "trial-status",
  "trial-request-submitted",
];
