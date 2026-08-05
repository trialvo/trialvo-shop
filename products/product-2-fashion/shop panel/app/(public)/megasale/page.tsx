import MegaSalePageClient from "@/components/megasale/MegaSalePageClient";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import React from "react";

const title = "Mega Sale | Graduate";
const description =
  "Explore Graduate Mega Sale campaign products with admin-controlled visibility, featured selections, and live campaign timers.";

export const metadata: Metadata = buildMetadata({
  title,
  description,
  canonical: "/megasale",
  ogTitle: title,
  ogDescription:
    "Discover campaign-ready Mega Sale products with countdown timers and curated visibility controls.",
  ogImage: "/og-offers.jpg",
});

const MegaSalePage: React.FC = () => {
  return <MegaSalePageClient />;
};

export default MegaSalePage;
