import { buildMetadata, getSiteUrl } from "@/lib/seo";
import type { Metadata } from "next";
import CategoryClient from "./[slug]/CategoryClient";

const title = "All Products";
const description =
  "Shop the latest products at the best prices. Discover premium quality garments with fast delivery and easy returns.";

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl();

  return buildMetadata({
    title: `${title} | Vellora`,
    description,
    canonical: `${siteUrl}/category`,
    ogTitle: `${title} | Vellora`,
    ogDescription: description,
    ogImage: "/og-category.jpg",
  });
}

export default function CategoryIndexPage(): React.ReactElement {
  return <CategoryClient />;
}
