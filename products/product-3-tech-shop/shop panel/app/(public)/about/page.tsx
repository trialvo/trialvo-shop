import type { Metadata } from "next";
import Layout from "@/components/layout/Layout";
import { AboutPageView } from "@/components/about/AboutPageView";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Techshop — Bangladesh's trusted destination for premium tech accessories and smart gadgets since 2020. 50K+ happy customers across 64 districts.",
  openGraph: {
    title: "About Techshop",
    description:
      "Bangladesh's trusted destination for premium tech accessories and smart gadgets since 2020.",
  },
};

export default function AboutPage() {
  return (
    <Layout>
      <AboutPageView />
    </Layout>
  );
}
