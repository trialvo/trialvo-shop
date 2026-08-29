import { Check, X } from "lucide-react";
import { motion } from "framer-motion";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { localize } from "@/lib/localize";
import type { LocalizedString } from "@/types/marketplace";

const INCLUDED: LocalizedString[] = [
  {
    bn: "গ্রাহকমুখী শপ ফ্রন্টএন্ড — প্রোডাক্ট, কার্ট, চেকআউট ও অর্ডার ফ্লো",
    en: "Customer-facing storefront — products, cart, checkout, and order flow",
  },
  {
    bn: "সম্পূর্ণ অ্যাডমিন প্যানেল — প্রোডাক্ট, অর্ডার, ক্যাটাগরি ও রিপোর্ট ব্যবস্থাপনা",
    en: "Complete admin panel — manage products, orders, categories, and reports",
  },
  {
    bn: "সম্পূর্ণ সোর্স কোড, কোনো অংশ আটকে রাখা নেই",
    en: "The complete source code, with nothing held back",
  },
  {
    bn: "ডাটাবেস স্ট্রাকচার ও মাইগ্রেশন ফাইল",
    en: "Database structure and migration files",
  },
  {
    bn: "ধাপে ধাপে সেটআপ ও ডিপ্লয়মেন্ট ডকুমেন্টেশন",
    en: "Step-by-step setup and deployment documentation",
  },
  {
    bn: "এক প্রোডাকশন ডোমেইনের জন্য আজীবন লাইসেন্স",
    en: "A lifetime license for one production domain",
  },
  {
    bn: "আজীবন সাপোর্ট — বাগ ফিক্স ও সেটআপ গাইডেন্স",
    en: "Lifetime support — bug fixes and setup guidance",
  },
  {
    bn: "আজীবন আপডেট ও সিকিউরিটি প্যাচ",
    en: "Lifetime updates and security patches",
  },
  {
    bn: "নিজের ব্র্যান্ডে সম্পূর্ণ রিব্র্যান্ড করার অনুমতি",
    en: "Permission to rebrand it fully as your own",
  },
];

const NOT_INCLUDED: LocalizedString[] = [
  {
    bn: "ডোমেইন ও হোস্টিং — এগুলো আপনাকে আলাদাভাবে নিতে হবে",
    en: "Domain and hosting — you arrange these separately",
  },
  {
    bn: "পেমেন্ট গেটওয়ে অ্যাকাউন্ট ও তাদের নিজস্ব চার্জ",
    en: "Payment gateway accounts and their own fees",
  },
  {
    bn: "নতুন ফিচার ডেভেলপমেন্ট ও রিডিজাইন (কাস্টম কাজ হিসেবে আলাদা)",
    en: "New feature development and redesign (quoted as custom work)",
  },
  {
    bn: "কনটেন্ট এন্ট্রি, পণ্যের ছবি ও মার্কেটিং সেবা",
    en: "Content entry, product photography, and marketing services",
  },
  {
    bn: "ডেমোতে দেখানো নমুনা ছবির লাইভ ব্যবহারের অধিকার",
    en: "Rights to use demo sample images on a live site",
  },
];

/**
 * Explicit inclusions and exclusions. Answers the highest-friction
 * pre-purchase question directly on the page instead of in a policy PDF.
 */
export function WhatsIncluded() {
  const { language } = useLanguage();

  return (
    <section className="border-t border-border bg-muted/25 py-14 md:py-20" aria-labelledby="included-title">
      <div className="container-custom">
        <div className="mb-10 max-w-3xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            {language === "bn" ? "প্যাকেজে যা থাকে" : "In every package"}
          </p>
          <h2
            id="included-title"
            className="font-display text-2xl font-bold tracking-tight md:text-3xl"
          >
            {language === "bn"
              ? "প্রতিটি প্রোডাক্টে কী কী পাচ্ছেন — এবং কী পাচ্ছেন না"
              : "Exactly what you get with every product — and what you do not"}
          </h2>
          <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
            {language === "bn"
              ? "কেনার পর অবাক হওয়ার কিছু থাকা উচিত নয়। তাই অন্তর্ভুক্ত ও অন্তর্ভুক্ত নয় — দুটোই আগে থেকে পরিষ্কার করে দিচ্ছি।"
              : "Nothing after purchase should be a surprise, so both the inclusions and the exclusions are stated up front."}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
          <motion.div
            className="rounded-2xl border border-border bg-card p-6 md:p-8 lg:col-span-3"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35 }}
          >
            <h3 className="font-display text-lg font-bold tracking-tight">
              {language === "bn" ? "অন্তর্ভুক্ত" : "Included"}
            </h3>
            <ul className="mt-5 space-y-3">
              {INCLUDED.map((item) => (
                <li key={item.en} className="flex gap-3 text-sm leading-6 text-foreground/80">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/12 text-accent">
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <span>{localize(item, language)}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            className="rounded-2xl border border-border bg-card p-6 md:p-8 lg:col-span-2"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05, duration: 0.35 }}
          >
            <h3 className="font-display text-lg font-bold tracking-tight">
              {language === "bn" ? "অন্তর্ভুক্ত নয়" : "Not included"}
            </h3>
            <ul className="mt-5 space-y-3">
              {NOT_INCLUDED.map((item) => (
                <li key={item.en} className="flex gap-3 text-sm leading-6 text-muted-foreground">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <span>{localize(item, language)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-[13px] leading-6 text-muted-foreground">
              {language === "bn"
                ? "এগুলোর কোনোটি দরকার হলে আমরা আলাদা সেবা হিসেবে করে দিতে পারি।"
                : "If you need any of these, we can take them on as a separate service."}
            </p>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="mt-4 h-9 rounded-lg bg-background"
            >
              <LocalizedLink href="/contact">
                {language === "bn" ? "কোটেশন নিন" : "Get a quote"}
              </LocalizedLink>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default WhatsIncluded;
