"use client";

import ProductCard from "@/components/ProductCard";
import HeroBanner from "@/components/HeroBanner";
import ProcessSteps from "@/components/ProcessSteps";
import TestimonialsSlider from "@/components/TestimonialsSlider";
import CategoryProductSection from "@/components/CategoryProductSection";
import { useProducts, toFrontendProduct } from "@/api/products";
import { useCategories, useHomeSections } from "@/api/categories";
import { dn } from "@/utils/displayName";
import { usePublicSiteSettings, DEFAULT_SITE_SETTINGS } from "@/api/siteSettings";

import { ArrowRight, TrendingUp } from "lucide-react";
import Link from "next/link";
import CategorySection from "@/components/CategorySection";
import ScrollToTop from "@/components/ScrollToTop";


export default function HomePage() {
  const { data: featuredData, isLoading: featuredLoading } = useProducts({ featured: true, limit: 4 });
  const { data: categoryData } = useCategories();
  const { data: homeSectionsData } = useHomeSections();
  const { data: siteData } = usePublicSiteSettings();
  const show = siteData?.settings ?? DEFAULT_SITE_SETTINGS;

  const featuredProducts = (featuredData?.products || []).map(toFrontendProduct);
  const categories = categoryData?.categories || [];
  const homeSections = homeSectionsData?.sections || [];

  return (
    <>
      {/* Hero Banner — always shown */}
      <HeroBanner />

      {/* Categories */}
      {show.home_show_categories && categories.length > 0 && (
        <CategorySection categories={categories} />
      )}


      {/* ── Featured Products ── */}
      {show.home_show_featured && featuredProducts.length > 0 && (
        <section className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 flex items-center justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[#e91e63]" />
                  <h2 className="text-xl font-bold text-[#0f172a] sm:text-2xl">বিশেষ পণ্য সমূহ</h2>
                </div>
                <p className="text-sm text-slate-500">আমাদের সবচেয়ে জনপ্রিয় পণ্য</p>
              </div>
              <Link href="/products" className="group flex items-center gap-1.5 text-sm font-medium text-[#e91e63] transition-colors hover:text-[#c2185b]">
                সব দেখুন
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </div>
            {featuredLoading ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => <div key={i} className="h-80 animate-pulse rounded-2xl bg-slate-100" />)}
              </div>
            ) : (
              <div className="stagger-children grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Dynamic Home Category Sections ── */}
      {show.home_show_category_sections && homeSections.map((section) => (
        <CategoryProductSection
          key={section.id}
          category={section}
          products={section.products}
        />
      ))}

      {/* Process Steps */}
      {show.home_show_process_steps && <ProcessSteps />}

      {/* Testimonials */}
      {show.home_show_testimonials && <TestimonialsSlider />}

      <ScrollToTop />
    </>
  );
}
