import { Link } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { BrandLogo } from "@/components/brand";
import type { FooterLinkGroup, LocalizedString } from "@/types/marketplace";
import { localize } from "@/lib/localize";

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

const BRAND_BLURB: LocalizedString = {
  bn: "রেডিমেড ইকমার্স সলিউশনের ডিজিটাল মার্কেটপ্লেস—এডমিন প্যানেল ও শপ একসাথে।",
  en: "A digital marketplace for ready-made ecommerce solutions—admin panel and shop together.",
};

/**
 * Marketplace footer — continuous with page body (not a heavy dark dump).
 * Standard columns: brand, marketplace, company, contact.
 */
export default function Footer() {
  const { language } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background" role="contentinfo">
      <div className="container-custom py-12 md:py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="lg:col-span-1">
            <Link to="/" className="mb-4 inline-flex" aria-label={language === "bn" ? "ইশপ মার্কেট" : "eShop Market"}>
              <BrandLogo
                withWordmark
                wordmark={language === "bn" ? "ইশপ মার্কেট" : "eShop Market"}
                size="md"
              />
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              {localize(BRAND_BLURB, language)}
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
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {linkLabel(group.id, link.label, language)}
                    </Link>
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
                <a href="mailto:info@eshopmarket.com" className="hover:text-foreground">
                  info@eshopmarket.com
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                <a href="tel:+8801700000000" className="hover:text-foreground">
                  +880 1700-000000
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                <span>{language === "bn" ? "ঢাকা, বাংলাদেশ" : "Dhaka, Bangladesh"}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-custom flex flex-col items-start justify-between gap-3 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>
            © {year} {language === "bn" ? "ইশপ মার্কেট" : "eShop Market"}.{" "}
            {language === "bn" ? "সর্বস্বত্ব সংরক্ষিত।" : "All rights reserved."}
          </p>
          <p>
            {language === "bn"
              ? "ডিজিটাল গুডস মার্কেটপ্লেস"
              : "Digital goods marketplace"}
          </p>
        </div>
      </div>
    </footer>
  );
}
