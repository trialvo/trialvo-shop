"use client";

import type { LucideIcon } from "lucide-react";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import {
  AlertTriangle,
  ArrowRight,
  Gift,
  RotateCcw,
  Shirt,
  ShoppingCart,
  Smartphone,
  Watch,
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCategories } from "@/hooks/useCategories";
import { localize } from "@/lib/localize";
import { Skeleton } from "@/components/ui/skeleton";
import { IconTile, Section, SectionIntro, Surface } from "@/components/section";
import type { CategoryBrowseItem } from "@/types/marketplace";

const ICON_MAP: Record<string, LucideIcon> = {
  ShoppingCart,
  Shirt,
  Gift,
  Watch,
  Smartphone,
};

type TileProps = {
  category: CategoryBrowseItem;
  language: "bn" | "en";
  index: number;
};

function CategoryTile({ category, language, index }: Readonly<TileProps>) {
  const Icon = ICON_MAP[category.icon || ""] ?? ShoppingCart;
  const name = localize(category.name, language, category.slug);
  const count = category.product_count ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
    >
      <Surface
        as={LocalizedLink}
        href={`/products?category=${category.slug}`}
        sheen
        interactive
        className="group flex h-full flex-col p-5"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <IconTile
            icon={Icon}
            className="group-hover:bg-accent group-hover:text-accent-foreground group-hover:ring-accent"
          />
          <ArrowRight
            className="h-4 w-4 -translate-x-1 text-accent opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
            aria-hidden="true"
          />
        </div>
        <h3 className="font-display text-base font-bold tracking-tight text-foreground">
          {name}
        </h3>
        <p className="mt-1.5 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
          {localize(category.description, language) ||
            (language === "bn"
              ? "ডিজিটাল ইকমার্স সলিউশন"
              : "Digital ecommerce solutions")}
        </p>
        <p className="mt-5 text-xs font-semibold text-muted-foreground sm:text-[11px]">
          {count} {language === "bn" ? "টি আইটেম" : "items"}
        </p>
      </Surface>
    </motion.div>
  );
}

/** Category catalog grid for digital-goods marketplace */
export function CategoryBrowse() {
  const { language } = useLanguage();
  const { data: categories = [], isLoading, isError, refetch } = useCategories();

  return (
    <Section labelledBy="categories-title" size="sm" divider="bottom">
      <SectionIntro
          id="categories-title"
          className="mb-8 md:mb-10"
          eyebrow={language === "bn" ? "ক্যাটাগরি" : "Categories"}
          title={
            language === "bn"
              ? "ডিজিটাল প্রোডাক্ট ক্যাটাগরি"
              : "Shop by digital category"
          }
          lead={
            language === "bn"
              ? "রেডিমেড ইকমার্স টেমপ্লেট ও সলিউশন—ক্যাটাগরি অনুযায়ী ব্রাউজ করুন।"
              : "Browse ready-made ecommerce templates and solutions by category."
          }
          action={
            <LocalizedLink
              href="/products"
              className="group inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-card transition-colors hover:border-accent/40 hover:text-accent-strong"
            >
              {language === "bn" ? "সব ক্যাটাগরি" : "All categories"}
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </LocalizedLink>
          }
        />

        {isError && !isLoading ? (
          <Surface
            tone="muted"
            role="alert"
            className="flex flex-col items-start gap-3 px-5 py-6"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              {language === "bn"
                ? "ক্যাটাগরি লোড হয়নি।"
                : "Categories failed to load."}
            </div>
            <button
              type="button"
              onClick={() => void refetch()}
              className="inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {language === "bn" ? "আবার চেষ্টা" : "Retry"}
            </button>
          </Surface>
        ) : null}

        {!isError ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-5">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={`cat-${i}`} className="h-44 rounded-2xl" />
                ))
              : categories.map((category, index) => (
                  <CategoryTile
                    key={category.id}
                    category={category}
                    language={language}
                    index={index}
                  />
                ))}
          </div>
        ) : null}
    </Section>
  );
}

export default CategoryBrowse;
