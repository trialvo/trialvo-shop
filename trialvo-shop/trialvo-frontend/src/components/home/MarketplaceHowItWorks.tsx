import {
  Code2,
  CreditCard,
  Download,
  Headphones,
  Mail,
  Rocket,
  ShoppingBag,
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { localize } from "@/lib/localize";
import type { HowItWorksStep, TrustItem } from "@/types/marketplace";

const BENEFITS: TrustItem[] = [
  {
    id: "instant",
    icon: Download,
    title: { bn: "ইনস্ট্যান্ট ডেলিভারি", en: "Instant delivery" },
    description: {
      bn: "ডিজিটাল অ্যাক্সেস লিংক অনুমোদনের পর দ্রুত পাবেন।",
      en: "Digital access links arrive quickly after approval.",
    },
  },
  {
    id: "source",
    icon: Code2,
    title: { bn: "সোর্স কোড সহ", en: "Source included" },
    description: {
      bn: "এডমিন ও শপসহ সম্পূর্ণ সলিউশন হাতে পাবেন।",
      en: "Get the full solution with admin and shop included.",
    },
  },
  {
    id: "support",
    icon: Headphones,
    title: { bn: "সফটওয়্যার সার্ভিস", en: "Software services" },
    description: {
      bn: "কাস্টমাইজেশন, DevOps, মেইনটেন্যান্স—এবং আপনার প্রয়োজন অনুযায়ী যেকোনো সফটওয়্যার ডেভেলপমেন্ট।",
      en: "Customization, DevOps, maintenance—and we can build any software according to your needs.",
    },
  },
];

const STEPS: HowItWorksStep[] = [
  {
    id: "browse",
    step: 1,
    icon: ShoppingBag,
    title: { bn: "প্রোডাক্ট বেছে নিন", en: "Choose a product" },
    description: {
      bn: "ক্যাটাগরি থেকে ডিজিটাল সলিউশন খুঁজুন।",
      en: "Browse categories and pick a digital solution.",
    },
  },
  {
    id: "trial",
    step: 2,
    icon: CreditCard,
    title: { bn: "ট্রায়াল বা কিনুন", en: "Trial or buy" },
    description: {
      bn: "লাইভ ট্রায়াল চালান অথবা নিরাপদে অর্ডার করুন।",
      en: "Start a live trial or complete a secure purchase.",
    },
  },
  {
    id: "access",
    step: 3,
    icon: Mail,
    title: { bn: "অ্যাক্সেস পান", en: "Receive access" },
    description: {
      bn: "অ্যাডমিন/শপ লিংক ইমেইল ও স্ট্যাটাস পেজে পান।",
      en: "Get admin/shop links by email and status page.",
    },
  },
  {
    id: "launch",
    step: 4,
    icon: Rocket,
    title: { bn: "লাইভ করুন", en: "Go live" },
    description: {
      bn: "নিজের ব্র্যান্ডে কাস্টমাইজ করে স্টোর চালু করুন।",
      en: "Customize with your brand and launch your store.",
    },
  },
];

/** Digital-goods benefits + purchase flow — standard marketplace body sections */
export function MarketplaceHowItWorks() {
  const { language } = useLanguage();

  return (
    <>
      <section className="border-b border-border bg-background py-10 md:py-12" aria-label="Digital goods benefits">
        <div className="container-custom">
          <ul className="grid gap-6 md:grid-cols-3 md:gap-8">
            {BENEFITS.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.li
                  key={item.id}
                  className="flex gap-4"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05, duration: 0.35 }}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-accent">
                    <Icon className="h-4.5 w-4.5 h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold tracking-tight text-foreground">
                      {localize(item.title, language)}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {localize(item.description, language)}
                    </p>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="bg-background py-12 md:py-16" aria-labelledby="how-it-works-title">
        <div className="container-custom">
          <div className="mb-8 max-w-2xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              {language === "bn" ? "কিনুন যেভাবে" : "How buying works"}
            </p>
            <h2
              id="how-it-works-title"
              className="font-display text-2xl font-bold tracking-tight md:text-3xl"
            >
              {language === "bn"
                ? "ডিজিটাল প্রোডাক্ট কেনার ধাপ"
                : "Steps to get your digital product"}
            </h2>
          </div>

          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.li
                  key={step.id}
                  className="rounded-lg border border-border bg-card p-5"
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05, duration: 0.35 }}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-foreground">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="font-display text-2xl font-bold tabular-nums text-muted-foreground/50">
                      {String(step.step).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="font-display text-base font-bold tracking-tight">
                    {localize(step.title, language)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {localize(step.description, language)}
                  </p>
                </motion.li>
              );
            })}
          </ol>
        </div>
      </section>
    </>
  );
}

export default MarketplaceHowItWorks;
