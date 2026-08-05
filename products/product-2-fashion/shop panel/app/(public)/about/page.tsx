import AboutPage from "@/components/about/AboutPage";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import React from "react";

const title = "About Us | Graduate";
const description =
  "Learn who we are, what we do, our best features, and what our partners say about us.";

export const metadata: Metadata = buildMetadata({
  title,
  description,
  canonical: "/about",
  ogTitle: title,
  ogDescription: description,
  ogImage: "/who-we-are.png",
});

const Page: React.FC = () => {
  return <AboutPage />;
};

export default Page;
