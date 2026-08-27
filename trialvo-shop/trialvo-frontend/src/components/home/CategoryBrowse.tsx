"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
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
      <Link
        href={`/products?category=${category.slug}`}
        className="group flex h-full flex-col rounded-lg border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-md"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary text-foreground transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <ArrowRight
            className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
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
        <p className="mt-4 text-xs font-medium text-muted-foreground">
          {count} {language === "bn" ? "টি আইটেম" : "items"}
        </p>
      </Link>
    </motion.div>
  );
}

/** Category catalog grid for digital-goods marketplace */
export function CategoryBrowse() {
  const { language } = useLanguage();
  const { data: categories = [], isLoading, isError, refetch } = useCategories();

  return (
    <section className="border-b border-border bg-background py-12 md:py-16" aria-labelledby="categories-title">
      <div className="container-custom">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              {language === "bn" ? "ক্যাটাগরি" : "Categories"}
            </p>
            <h2
              id="categories-title"
              className="font-display text-2xl font-bold tracking-tight md:text-3xl"
            >
              {language === "bn"
                ? "ডিজিটাল প্রোডাক্ট ক্যাটাগরি"
                : "Shop by digital category"}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground md:text-base">
              {language === "bn"
                ? "রেডিমেড ইকমার্স টেমপ্লেট ও সলিউশন—ক্যাটাগরি অনুযায়ী ব্রাউজ করুন।"
                : "Browse ready-made ecommerce templates and solutions by category."}
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
          >
            {language === "bn" ? "সব ক্যাটাগরি" : "All categories"}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {isError && !isLoading ? (
          <div
            role="alert"
            className="flex flex-col items-start gap-3 rounded-xl border border-border bg-muted/40 px-5 py-6"
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
          </div>
        ) : null}

        {!isError ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-5">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={`cat-${i}`} className="h-40 rounded-xl" />
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
      </div>
    </section>
  );
}

export default CategoryBrowse;
