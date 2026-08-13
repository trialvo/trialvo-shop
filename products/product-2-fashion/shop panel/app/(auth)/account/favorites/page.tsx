import FavoritesClient from "@/components/account/favorites/FavoritesClient";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import React from "react";

const title = "Favorites | Vellora";
const description = "View your favorite products and manage your wishlist.";

export const metadata: Metadata = buildMetadata({
  title,
  description,
  canonical: "/account/favorites",
  ogTitle: title,
  ogDescription: description,
  ogImage: "/og-favorites.jpg",
  robots: "noindex,nofollow",
});

const Page: React.FC = () => {
    return <FavoritesClient />;
};

export default Page;
