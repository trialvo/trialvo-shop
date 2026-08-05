import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "Graduate Fashion Shop | Trendy Clothing & Accessories",
  description:
    "Discover the latest trends in fashion at Graduate Fashion Shop. Shop premium clothing, accessories, and footwear with fast delivery across Bangladesh.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Graduate Fashion Shop | Trendy Clothing & Accessories",
    description:
      "Discover the latest trends in fashion at Graduate Fashion Shop. Shop premium clothing, accessories, and footwear with fast delivery across Bangladesh.",
    url: "/",
    siteName: "Graduate Fashion Shop",
    type: "website",
  },
};

export default function Home() {
  return <HomeClient />;
}
