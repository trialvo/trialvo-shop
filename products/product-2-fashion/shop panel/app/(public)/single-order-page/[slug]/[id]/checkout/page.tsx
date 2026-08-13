import { buildMetadata, getSiteUrl } from "@/lib/seo";
import { humanizeSlug, normalizeSlug } from "@/lib/string";
import type { Metadata } from "next";
import SingleOrderCheckoutClient from "./SingleOrderCheckoutClient";

type PageProps = {
  params: Promise<{ slug: string | string[]; id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, id } = await params;
  const normalizedSlug = normalizeSlug(slug);
  const title = humanizeSlug(normalizedSlug);
  const shopUrl = getSiteUrl();

  return buildMetadata({
    title: `${title} — Checkout | Vellora`,
    description: `Complete your order for ${title}. Secure checkout with multiple payment options.`,
    canonical: `${shopUrl}/single-order-page/${normalizedSlug}/${id}/checkout`,
    robots: "noindex, nofollow",
    ogTitle: `${title} — Checkout | Vellora`,
    ogDescription: `Checkout for ${title}`,
  });
}

export default async function SingleOrderCheckoutPage({ params }: PageProps) {
  const { slug, id } = await params;
  const normalizedSlug = normalizeSlug(slug);

  return <SingleOrderCheckoutClient slug={normalizedSlug} id={id} />;
}
