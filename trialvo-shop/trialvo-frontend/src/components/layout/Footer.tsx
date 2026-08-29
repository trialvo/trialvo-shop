"use client";

import LocalizedLink from "@/components/i18n/LocalizedLink";
import { Mail, MapPin, Phone, Rss } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { BrandLogo } from "@/components/brand";
import type { LocalizedString } from "@/types/marketplace";
import { localize } from "@/lib/localize";
import { BRAND, brandName } from "@/lib/brand";
import { legalIndex } from "@/lib/legal";

type FooterLink = { href: string; label: LocalizedString };

const MARKETPLACE_LINKS: FooterLink[] = [
  { href: "/products", label: { bn: "সব প্রোডাক্ট", en: "All products" } },
  { href: "/products?category=ecommerce", label: { bn: "ইকমার্স", en: "Ecommerce" } },
  { href: "/products?category=fashion", label: { bn: "ফ্যাশন", en: "Fashion" } },
  { href: "/products?category=tech", label: { bn: "টেক", en: "Tech" } },
];

const COMPANY_LINKS: FooterLink[] = [
  { href: "/about", label: { bn: "আমাদের সম্পর্কে", en: "About us" } },
  { href: "/how-it-works", label: { bn: "কীভাবে কাজ করে", en: "How it works" } },
  { href: "/faq", label: { bn: "প্রশ্নোত্তর", en: "FAQ" } },
  { href: "/contact", label: { bn: "যোগাযোগ", en: "Contact" } },
];

/**
 * Marketplace footer — continuous with page body (not a heavy dark dump).
 * Columns: brand, marketplace, company, legal, contact.
 */
export default function Footer() {
  const { language } = useLanguage();
  const year = new Date().getFullYear();
  const name = brandName(language);
  const legal = legalIndex(language);

  const columns: { id: string; title: LocalizedString; links: FooterLink[] }[] = [
    {
      id: "marketplace",
      title: { bn: "মার্কেটপ্লেস", en: "Marketplace" },
      links: MARKETPLACE_LINKS,
    },
    {
      id: "company",
      title: { bn: "কোম্পানি", en: "Company" },
      links: COMPANY_LINKS,
    },
    {
      id: "legal",
      title: { bn: "নীতি ও শর্ত", en: "Legal" },
      links: legal.map((doc) => ({
        href: doc.path,
        label: { bn: doc.title, en: doc.title },
      })),
    },
  ];

  return (
    <footer className="border-t border-border bg-background" role="contentinfo">
      <div className="container-custom py-12 md:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-8">
          <div className="lg:col-span-1">
            <LocalizedLink href="/" className="mb-4 inline-flex" aria-label={name}>
              <BrandLogo withWordmark wordmark={name} size="md" />
            </LocalizedLink>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              {localize(BRAND.blurb as LocalizedString, language)}
            </p>
            <a
              href="/feed.xml"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Rss className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              {language === "bn" ? "প্রোডাক্ট ফিড" : "Product feed"}
            </a>
          </div>

          {columns.map((column) => (
            <div key={column.id}>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.12em] text-foreground">
                {localize(column.title, language)}
              </h3>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <LocalizedLink
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {localize(link.label, language)}
                    </LocalizedLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.12em] text-foreground">
              {language === "bn" ? "যোগাযোগ" : "Contact"}
            </h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                <a
                  href={`mailto:${BRAND.contactEmail}`}
                  className="hover:text-foreground"
                >
                  {BRAND.contactEmail}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                <a href={BRAND.contactPhoneHref} className="hover:text-foreground">
                  {BRAND.contactPhone}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                <span>{localize(BRAND.address as LocalizedString, language)}</span>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-10 max-w-4xl border-t border-border pt-6 text-xs leading-6 text-muted-foreground">
          {language === "bn"
            ? `${name} রেডিমেড ইকমার্স ওয়েবসাইট সরবরাহ করে — শপ ফ্রন্টএন্ড, অ্যাডমিন প্যানেল ও সম্পূর্ণ সোর্স কোড একসাথে। প্রতিটি প্রোডাক্ট এককালীন পেমেন্টে আজীবন লাইসেন্স, আজীবন সাপোর্ট ও আজীবন আপডেট সহ, এবং কেনার আগে লাইভ ট্রায়াল করে দেখা যায়।`
            : `${name} supplies ready-made ecommerce websites — storefront, admin panel, and complete source code together. Every product is a one-time payment with a lifetime license, lifetime support, and lifetime updates, and you can run a live trial before you buy.`}
        </p>
      </div>

      <div className="border-t border-border">
        <div className="container-custom flex flex-col items-start justify-between gap-3 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>
            © {year} {name}.{" "}
            {language === "bn" ? "সর্বস্বত্ব সংরক্ষিত।" : "All rights reserved."}
          </p>
          <p className="inline-flex items-center gap-1.5">
            <span>{language === "bn" ? "পাওয়ার্ড বাই" : "Powered by"}</span>
            <a
              href={BRAND.company.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-medium text-foreground underline-offset-2 transition-colors hover:text-accent hover:underline"
            >
              <img
                src="/brand/trialvo-icon-192.png"
                alt=""
                width={16}
                height={16}
                className="h-4 w-4 rounded-[3px] object-cover"
                decoding="async"
              />
              <span>{BRAND.company.name}</span>
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
