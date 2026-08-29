"use client";

import { FormEvent, useState } from "react";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Code2,
  Headphones,
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCategories } from "@/hooks/useCategories";
import { localePath } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { HeroSearch } from "@/components/home/HeroSearch";
import type { HeroContent, LocalizedString } from "@/types/marketplace";
import { localize } from "@/lib/localize";

const HERO_CONTENT: HeroContent = {
  brand: { bn: "Trialvo Shop", en: "Trialvo Shop" },
  headline: {
    bn: "রেডিমেড ইকমার্স সলিউশন খুঁজুন",
    en: "Find ready-made ecommerce solutions",
  },
  supporting: {
    bn: "এডমিন ও শপ ট্রায়াল করুন—কাস্টমাইজেশন, DevOps, মেইনটেন্যান্স, অথবা প্রয়োজনমতো নতুন সফটওয়্যারও বানাই।",
    en: "Trial admin and shop—plus customization, DevOps, maintenance, or custom software built for your needs.",
  },
  primaryCta: { bn: "সব প্রোডাক্ট", en: "Browse all" },
  secondaryCta: { bn: "যোগাযোগ", en: "Contact" },
  image: {
    src: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=1920&h=1080&fit=crop&q=80",
    alt: {
      bn: "অনলাইন শপ ম্যানেজমেন্ট",
      en: "Online shop management",
    },
  },
};

const LIVE_BADGE: LocalizedString = {
  bn: "কেনার আগে লাইভ ট্রায়াল",
  en: "Live trial before you buy",
};

/** Qualitative proof points — the same promises the rest of the page makes. */
const PROOF: { id: string; icon: typeof Code2; label: LocalizedString }[] = [
  { id: "source", icon: Code2, label: { bn: "সম্পূর্ণ সোর্স কোড", en: "Full source code" } },
  { id: "once", icon: Banknote, label: { bn: "এককালীন পেমেন্ট", en: "One-time payment" } },
  { id: "support", icon: Headphones, label: { bn: "আজীবন সাপোর্ট", en: "Lifetime support" } },
  { id: "trial", icon: BadgeCheck, label: { bn: "লাইভ ডেমো অ্যাকসেস", en: "Live demo access" } },
];

export function MarketplaceHero() {
  const { language } = useLanguage();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { data: categories = [] } = useCategories();

  const popular = categories.slice(0, 4);

  const onSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const q = query.trim();
    router.push(
      localePath(language, q ? `/products?q=${encodeURIComponent(q)}` : "/products"),
    );
  };

  return (
    <section
      className="relative isolate min-h-[min(92svh,820px)] overflow-hidden"
      aria-labelledby="marketplace-hero-heading"
    >
      <div className="absolute inset-0 -z-10">
        <motion.img
          src={HERO_CONTENT.image.src}
          alt={localize(HERO_CONTENT.image.alt, language)}
          className="h-full w-full object-cover object-center"
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
        />
        {/* Directional scrim keeps the left column legible over any photo. */}
        <div className="absolute inset-0 bg-[linear-gradient(105deg,hsl(220_20%_7%/0.94)_0%,hsl(220_18%_9%/0.78)_38%,hsl(220_12%_12%/0.34)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_78%_18%,hsl(153_72%_42%/0.26),transparent_48%)]" />
        <div
          aria-hidden="true"
          className="pattern-grid absolute inset-0 opacity-[0.35] [mask-image:radial-gradient(ellipse_at_30%_50%,black,transparent_75%)]"
        />
        {/* Melt the photo into the next section instead of a hard cut. */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background" />
      </div>

      <div className="container-custom relative z-10 flex min-h-[min(92svh,820px)] items-end pb-20 pt-28 md:items-center md:pb-28 md:pt-24">
        <div className="w-full max-w-2xl">
          <motion.div
            className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-2"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="font-display text-sm font-bold tracking-tight text-white">
              {localize(HERO_CONTENT.brand, language)}
            </span>
            <span
              aria-hidden="true"
              className="h-3.5 w-px bg-white/25"
            />
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
              {localize(LIVE_BADGE, language)}
            </span>
          </motion.div>

          <motion.h1
            id="marketplace-hero-heading"
            className="font-display text-[2.5rem] font-bold leading-[1.06] tracking-tight text-white sm:text-[3.25rem] md:text-[4rem]"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.06 }}
          >
            {localize(HERO_CONTENT.headline, language)}
          </motion.h1>

          <motion.p
            className="mt-5 max-w-xl text-base leading-[1.75] text-white/75 md:text-lg"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
          >
            {localize(HERO_CONTENT.supporting, language)}
          </motion.p>

          <motion.div
            className="mt-9"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.18 }}
          >
            <HeroSearch value={query} onChange={setQuery} onSubmit={onSearch} />
          </motion.div>

          {popular.length ? (
            <motion.div
              className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.24 }}
            >
              <span className="text-xs font-medium text-white/50">
                {language === "bn" ? "জনপ্রিয়:" : "Popular:"}
              </span>
              {popular.map((category) => (
                <LocalizedLink
                  key={category.id}
                  href={`/products?category=${category.slug}`}
                  className="text-xs font-medium text-white/75 underline decoration-white/25 decoration-1 underline-offset-4 transition-colors hover:text-white hover:decoration-white/70"
                >
                  {localize(category.name, language, category.slug)}
                </LocalizedLink>
              ))}
            </motion.div>
          ) : null}

          <motion.div
            className="mt-8 flex flex-wrap items-center gap-3"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Button
              asChild
              className="h-11 rounded-lg bg-accent px-6 font-semibold text-accent-foreground shadow-accent-glow transition-transform hover:bg-accent/90 hover:-translate-y-0.5"
            >
              <LocalizedLink href="/products">
                {localize(HERO_CONTENT.primaryCta, language)}
                <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
              </LocalizedLink>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 rounded-lg border-white/25 bg-white/[0.06] px-6 text-white backdrop-blur-sm hover:border-white/40 hover:bg-white/15 hover:text-white"
            >
              <LocalizedLink href="/how-it-works">
                {language === "bn" ? "কীভাবে কাজ করে" : "How it works"}
              </LocalizedLink>
            </Button>
            <LocalizedLink
              href="/contact"
              className="px-1 text-sm font-medium text-white/70 underline-offset-4 transition-colors hover:text-white hover:underline"
            >
              {localize(HERO_CONTENT.secondaryCta, language)}
            </LocalizedLink>
          </motion.div>

          <motion.ul
            className="mt-10 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-white/12 pt-6 sm:flex sm:flex-wrap sm:items-center sm:gap-x-7"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.36 }}
          >
            {PROOF.map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.id}
                  className="flex items-center gap-2 text-[13px] font-medium text-white/70"
                >
                  <Icon className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                  {localize(item.label, language)}
                </li>
              );
            })}
          </motion.ul>
        </div>
      </div>
    </section>
  );
}

export default MarketplaceHero;
