import type { Metadata } from "next";
import SingleOrderCheckoutClient from "./SingleOrderCheckoutClient";

type PageProps = {
  params: Promise<{ slug: string; id: string }>;
};

function humanizeSlug(slug: string): string {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, id } = await params;
  const title = humanizeSlug(slug);

  return {
    title: `${title} — Checkout | LIFESTYLE`,
    description: `Complete your order for ${title}. Secure checkout with multiple payment options.`,
    robots: "noindex, nofollow",
  };
}

export default async function SingleOrderCheckoutPage({ params }: PageProps) {
  const { slug, id } = await params;

  return <SingleOrderCheckoutClient slug={slug} id={id} />;
}
