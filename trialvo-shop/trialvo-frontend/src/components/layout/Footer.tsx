"use client";

import LocalizedLink from "@/components/i18n/LocalizedLink";
import { Mail, MapPin, Phone } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { BrandLogo } from "@/components/brand";
import type { FooterLinkGroup, LocalizedString } from "@/types/marketplace";
import { localize } from "@/lib/localize";
import { BRAND, brandName } from "@/lib/brand";

const MARKETPLACE_GROUPS: FooterLinkGroup[] = [
  {
    id: "marketplace",
    title: { bn: "মার্কেটপ্লেস", en: "Marketplace" },
    links: [
      { href: "/products", label: "All products" },
      { href: "/products?category=ecommerce", label: "Ecommerce" },
      { href: "/products?category=fashion", label: "Fashion" },
      { href: "/products?category=tech", label: "Tech" },
    ],
  },
  {
    id: "company",
    title: { bn: "কোম্পানি", en: "Company" },
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/terms", label: "Terms" },
      { href: "/privacy", label: "Privacy" },
    ],
  },
];

const GROUP_LABELS_BN: Record<string, Record<string, string>> = {
  marketplace: {
    "All products": "সব প্রোডাক্ট",
    Ecommerce: "ইকমার্স",
    Fashion: "ফ্যাশন",
    Tech: "টেক",
  },
  company: {
    About: "আমাদের সম্পর্কে",
    Contact: "যোগাযোগ",
    Terms: "শর্তাবলী",
    Privacy: "প্রাইভেসি",
  },
};

function linkLabel(
  groupId: string,
  englishLabel: string,
  language: "bn" | "en",
): string {
  if (language === "en") return englishLabel;
  return GROUP_LABELS_BN[groupId]?.[englishLabel] ?? englishLabel;
}

/**
 * Marketplace footer — continuous with page body (not a heavy dark dump).
 * Standard columns: brand, marketplace, company, contact.
 */
export default function Footer() {
  const { language } = useLanguage();
  const year = new Date().getFullYear();
  const name = brandName(language);

  return (
    <footer className="border-t border-border bg-background" role="contentinfo">
      <div className="container-custom py-12 md:py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="lg:col-span-1">
            <LocalizedLink href="/" className="mb-4 inline-flex" aria-label={name}>
              <BrandLogo withWordmark wordmark={name} size="md" />
            </LocalizedLink>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              {localize(BRAND.blurb as LocalizedString, language)}
            </p>
          </div>

          {MARKETPLACE_GROUPS.map((group) => (
            <div key={group.id}>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.12em] text-foreground">
                {localize(group.title, language)}
              </h3>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <LocalizedLink
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {linkLabel(group.id, link.label, language)}
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
