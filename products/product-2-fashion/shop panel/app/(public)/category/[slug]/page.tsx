import { buildMetadata, getSiteUrl } from "@/lib/seo";
import { decodeSlug, humanizeSlug, normalizeSlug } from "@/lib/string";
import type { Metadata } from "next";
import CategoryClient from "./CategoryClient";

type PageProps = {
  params: Promise<{
    slug: string | string[];
  }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const normalizedSlug = normalizeSlug(slug);
  const decodedSlug = decodeSlug(normalizedSlug);

  const title = humanizeSlug(decodedSlug);
  const description = `Shop the latest ${title} at the best prices. Discover premium quality products with fast delivery and easy returns.`;
  const siteUrl = getSiteUrl();
  const canonical = `${siteUrl}/category/${normalizedSlug}`;

  return buildMetadata({
    title: `${title} | Graduate`,
    description,
    canonical,
    ogTitle: `${title} | Graduate`,
    ogDescription: description,
    ogImage: "/og-category.jpg",
  });
}

export default function CategoryPage(): React.ReactElement {
  return <CategoryClient />;
}
