import ComparePage from "@/components/compare/ComparePage";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import React from "react";

const title = "Compare Products | Graduate";
const description =
  "Compare two products side-by-side and use a budget planner to evaluate pricing, stock, and discount value before you buy.";

export const metadata: Metadata = buildMetadata({
  title,
  description,
  canonical: "/compare",
  ogTitle: title,
  ogDescription:
    "Use Graduate's product comparison and budget tools to choose smarter across pricing, variations, delivery, and savings.",
  ogImage: "/og-compare.jpg",
});

const CompareRoute: React.FC = () => {
  return <ComparePage />;
};

export default CompareRoute;
