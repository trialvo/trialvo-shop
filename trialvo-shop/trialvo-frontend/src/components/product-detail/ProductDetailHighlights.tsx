"use client";

import { Code2, Headphones, RefreshCw, ShieldCheck } from "lucide-react";
import { IconTile, Surface } from "@/components/section";
import type { MarketplaceLanguage } from "@/types/marketplace";

const HIGHLIGHTS = [
  {
    id: "license",
    icon: ShieldCheck,
    bn: { title: "আজীবন লাইসেন্স", body: "একবার পেমেন্ট, প্রোডাক্ট আপনার।" },
    en: { title: "Lifetime license", body: "Pay once, the product is yours." },
  },
  {
    id: "source",
    icon: Code2,
    bn: { title: "সম্পূর্ণ সোর্স কোড", body: "শপ, অ্যাডমিন ও ডাটাবেস সহ।" },
    en: { title: "Full source code", body: "Storefront, admin, and database." },
  },
  {
    id: "updates",
    icon: RefreshCw,
    bn: { title: "আজীবন আপডেট", body: "ফিক্স ও সিকিউরিটি প্যাচ ফ্রি।" },
    en: { title: "Lifetime updates", body: "Fixes and security patches free." },
  },
  {
    id: "support",
    icon: Headphones,
    bn: { title: "সেটআপ সাপোর্ট", body: "লাইভ করা পর্যন্ত পাশে আছি।" },
    en: { title: "Setup support", body: "We help until you are live." },
  },
] as const;

export type ProductDetailHighlightsProps = {
  language: MarketplaceLanguage;
};

/** What every license includes, regardless of product. */
export function ProductDetailHighlights({
  language,
}: Readonly<ProductDetailHighlightsProps>) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {HIGHLIGHTS.map((item) => {
        const copy = item[language];
        const Icon = item.icon;
        return (
          <li key={item.id}>
            <Surface className="h-full p-4">
              <IconTile icon={Icon} size="sm" className="mb-3" />
              <p className="font-display text-sm font-bold tracking-tight text-foreground">
                {copy.title}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {copy.body}
              </p>
            </Surface>
          </li>
        );
      })}
    </ul>
  );
}

export default ProductDetailHighlights;
