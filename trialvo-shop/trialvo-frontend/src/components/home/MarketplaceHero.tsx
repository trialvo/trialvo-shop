"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { HeroSearch } from "@/components/home/HeroSearch";
import type { HeroContent } from "@/types/marketplace";
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

export function MarketplaceHero() {
  const { language } = useLanguage();
  const router = useRouter();
  const [query, setQuery] = useState("");

  const onSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const q = query.trim();
    router.push(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
  };

  return (
    <section
      className="relative isolate min-h-[min(88svh,760px)] overflow-hidden"
      aria-labelledby="marketplace-hero-heading"
    >
      <div className="absolute inset-0">
        <motion.img
          src={HERO_CONTENT.image.src}
          alt={localize(HERO_CONTENT.image.alt, language)}
          className="h-full w-full object-cover object-center"
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(105deg,hsl(220_20%_8%/0.88)_0%,hsl(220_18%_10%/0.62)_42%,hsl(220_12%_12%/0.28)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,hsl(153_72%_40%/0.22),transparent_45%)]" />
      </div>

      <div className="container-custom relative z-10 flex min-h-[min(88svh,760px)] items-end pb-16 pt-28 md:items-center md:pb-24 md:pt-24">
        <div className="w-full max-w-2xl">
          <motion.p
            className="font-display mb-4 text-xl font-bold tracking-tight text-white md:text-2xl"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {localize(HERO_CONTENT.brand, language)}
          </motion.p>

          <motion.h1
            id="marketplace-hero-heading"
            className="font-display text-[2.35rem] font-bold leading-[1.08] tracking-tight text-white sm:text-5xl md:text-6xl"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.06 }}
          >
            {localize(HERO_CONTENT.headline, language)}
          </motion.h1>

          <motion.p
            className="mt-4 max-w-lg text-base leading-relaxed text-white/78 md:text-lg"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
          >
            {localize(HERO_CONTENT.supporting, language)}
          </motion.p>

          <motion.div
            className="mt-8"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.18 }}
          >
            <HeroSearch value={query} onChange={setQuery} onSubmit={onSearch} />
          </motion.div>

          <motion.div
            className="mt-5 flex flex-wrap items-center gap-3"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.26 }}
          >
            <Button
              asChild
              variant="outline"
              className="h-10 rounded-md border-white/35 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/products">
                {localize(HERO_CONTENT.primaryCta, language)}
                <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Link
              href="/contact"
              className="text-sm font-medium text-white/75 underline-offset-4 transition-colors hover:text-white hover:underline"
            >
              {localize(HERO_CONTENT.secondaryCta, language)}
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default MarketplaceHero;
