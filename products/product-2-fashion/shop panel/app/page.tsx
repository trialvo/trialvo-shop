import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "Vellora | Trendy Clothing & Accessories",
  description:
    "Discover the latest trends in fashion at Vellora. Shop premium clothing, accessories, and footwear with fast delivery across Bangladesh.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Vellora | Trendy Clothing & Accessories",
    description:
      "Discover the latest trends in fashion at Vellora. Shop premium clothing, accessories, and footwear with fast delivery across Bangladesh.",
    url: "/",
    siteName: "Vellora",
    type: "website",
  },
};

export default function Home() {
  return <HomeClient />;
}
