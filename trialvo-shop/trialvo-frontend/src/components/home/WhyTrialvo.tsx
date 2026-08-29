import {
  BadgeCheck,
  Banknote,
  Code2,
  Gauge,
  Headphones,
  Languages,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { localize } from "@/lib/localize";
import type { LocalizedString } from "@/types/marketplace";

type Reason = {
  id: string;
  icon: typeof Code2;
  title: LocalizedString;
  description: LocalizedString;
};

const REASONS: Reason[] = [
  {
    id: "source",
    icon: Code2,
    title: { bn: "সম্পূর্ণ সোর্স কোড আপনার", en: "Full source code is yours" },
    description: {
      bn: "শপ, অ্যাডমিন প্যানেল ও ডাটাবেস স্ট্রাকচার — সবকিছুর কোড হাতে পাবেন। কোনো ভেন্ডর লক-ইন নেই, ইচ্ছেমতো পরিবর্তন করতে পারবেন।",
      en: "The storefront, admin panel, and database structure all come with code you own. No vendor lock-in, and you can change anything you want.",
    },
  },
  {
    id: "one-time",
    icon: Banknote,
    title: { bn: "এককালীন পেমেন্ট, মাসিক ফি নেই", en: "Pay once, no monthly fee" },
    description: {
      bn: "সাবস্ক্রিপশনের মতো প্রতি মাসে টাকা কাটে না। একবার কিনলে খরচ শেষ — লাইসেন্স, সাপোর্ট ও আপডেটের জন্য বাড়তি ফি নেই।",
      en: "Unlike a subscription, nothing recurs. One purchase is the whole cost — no extra fee for the license, support, or updates.",
    },
  },
  {
    id: "trial",
    icon: BadgeCheck,
    title: { bn: "কেনার আগে লাইভ ট্রায়াল", en: "Live trial before you buy" },
    description: {
      bn: "স্ক্রিনশট দেখে অনুমান করতে হবে না। আসল চালু প্রোডাক্টে নিজে ঢুকে ফিচার, অ্যাডমিন প্যানেল ও গতি পরীক্ষা করে তারপর সিদ্ধান্ত নিন।",
      en: "No guessing from screenshots. Log into a real running instance, test the features, admin panel, and speed, then decide.",
    },
  },
  {
    id: "support",
    icon: Headphones,
    title: { bn: "আজীবন সাপোর্ট, মেয়াদ শেষ হয় না", en: "Lifetime support that never expires" },
    description: {
      bn: "৬ মাস বা ১ বছরের সীমা নেই। বাগ ফিক্স, সেটআপ গাইডেন্স ও প্রশ্নের উত্তর ক্রেতার লাইফটাইম জুড়ে প্রযোজ্য।",
      en: "There is no 6-month or 1-year cut-off. Bug fixes, setup guidance, and answers apply for the lifetime of your purchase.",
    },
  },
  {
    id: "updates",
    icon: RefreshCw,
    title: { bn: "আজীবন আপডেট ও সিকিউরিটি প্যাচ", en: "Lifetime updates and security patches" },
    description: {
      bn: "প্রোডাক্টে নতুন উন্নয়ন ও সিকিউরিটি প্যাচ প্রকাশ হলে ক্রেতারা তা পান — নতুন করে কিনতে হয় না।",
      en: "When we ship improvements and security patches, buyers get them — you never repurchase to stay current.",
    },
  },
  {
    id: "performance",
    icon: Gauge,
    title: { bn: "দ্রুত লোডিং ও SEO-বান্ধব স্ট্রাকচার", en: "Fast loading, SEO-friendly structure" },
    description: {
      bn: "পরিষ্কার URL, মেটা ট্যাগ, স্ট্রাকচার্ড ডেটা ও রেসপনসিভ লেআউট — সার্চ ইঞ্জিন ও মোবাইল ক্রেতা দুই দিকেই প্রস্তুত।",
      en: "Clean URLs, meta tags, structured data, and responsive layouts — ready for both search engines and mobile buyers.",
    },
  },
  {
    id: "bilingual",
    icon: Languages,
    title: { bn: "বাংলা ও ইংরেজি দুই ভাষায়", en: "Built for Bangla and English" },
    description: {
      bn: "বাংলা যুক্তাক্ষর সঠিকভাবে রেন্ডার হয় এবং দ্বিভাষিক কনটেন্ট মাথায় রেখে ইন্টারফেস তৈরি — দেশি ও বিদেশি ক্রেতা দুজনের জন্যই।",
      en: "Bangla conjuncts render correctly and the interface is designed for bilingual content — for local and overseas customers alike.",
    },
  },
  {
    id: "ownership",
    icon: ShieldCheck,
    title: { bn: "নিজের ব্র্যান্ডে সম্পূর্ণ রিব্র্যান্ড", en: "Rebrand it completely as yours" },
    description: {
      bn: "লোগো, রঙ, ফন্ট ও কনটেন্ট বদলে প্রোডাক্টকে সম্পূর্ণ নিজের ব্র্যান্ড বানাতে পারবেন — কোথাও আমাদের নাম রাখা বাধ্যতামূলক নয়।",
      en: "Change the logo, colours, fonts, and content to make it entirely your brand — you are never required to display our name.",
    },
  },
];

/**
 * Value-proposition grid. Carries the long-tail purchase-intent copy
 * ("one-time payment", "source code", "lifetime support") in real page text.
 */
export function WhyTrialvo() {
  const { language } = useLanguage();

  return (
    <section className="border-t border-border bg-background py-14 md:py-20" aria-labelledby="why-title">
      <div className="container-custom">
        <div className="mb-10 max-w-3xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            {language === "bn" ? "কেন Trialvo Shop" : "Why Trialvo Shop"}
          </p>
          <h2
            id="why-title"
            className="font-display text-2xl font-bold tracking-tight md:text-3xl"
          >
            {language === "bn"
              ? "রেডিমেড ইকমার্স ওয়েবসাইট কেনার সময় যা আসলে গুরুত্বপূর্ণ"
              : "What actually matters when buying a ready-made ecommerce website"}
          </h2>
          <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
            {language === "bn"
              ? "সস্তা টেমপ্লেট আর সাবস্ক্রিপশন প্ল্যাটফর্মের মাঝামাঝি একটা জায়গা আছে — সম্পূর্ণ সোর্স কোডসহ প্রোডাকশন-রেডি সলিউশন, এককালীন দামে, আর সমস্যায় পড়লে পাশে থাকার মতো সাপোর্ট। ঠিক সেটাই আমরা দিই।"
              : "There is a gap between a cheap template and a subscription platform: a production-ready solution with full source code, at a one-time price, with support that stays with you when something breaks. That gap is what we fill."}
          </p>
        </div>

        <ul className="grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
          {REASONS.map((reason, index) => {
            const Icon = reason.icon;
            return (
              <motion.li
                key={reason.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (index % 4) * 0.05, duration: 0.35 }}
              >
                <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-accent">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="font-display text-[15px] font-bold leading-6 tracking-tight text-foreground">
                  {localize(reason.title, language)}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {localize(reason.description, language)}
                </p>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export default WhyTrialvo;
