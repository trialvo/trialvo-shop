import NotFoundView from "@/components/not-found/NotFoundView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The requested URL was not found on this server.",
  alternates: { canonical: "/404" },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function NotFoundPage() {
  return <NotFoundView />;
}
