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
import { IconTile, Section, SectionIntro, Surface } from "@/components/section";
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
      <Section
        size="sm"
        divider="bottom"
        className="py-10 md:py-12"
        aria-label="Digital goods benefits"
      >
        <ul className="grid gap-5 md:grid-cols-3">
          {BENEFITS.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, duration: 0.35 }}
              >
                <Surface
                  sheen
                  interactive
                  className="group flex h-full gap-4 p-5"
                >
                  <IconTile
                    icon={Icon}
                    size="sm"
                    className="group-hover:bg-accent group-hover:text-accent-foreground group-hover:ring-accent"
                  />
                  <div>
                    <h3 className="text-sm font-bold tracking-tight text-foreground">
                      {localize(item.title, language)}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {localize(item.description, language)}
                    </p>
                  </div>
                </Surface>
              </motion.li>
            );
          })}
        </ul>
      </Section>

      <Section labelledBy="how-it-works-title" size="sm">
        <SectionIntro
          id="how-it-works-title"
          className="mb-8 md:mb-10"
          eyebrow={language === "bn" ? "কিনুন যেভাবে" : "How buying works"}
          title={
            language === "bn"
              ? "ডিজিটাল প্রোডাক্ট কেনার ধাপ"
              : "Steps to get your digital product"
          }
        />

        <ol className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Rail tying the four steps together as one sequence. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-[3.25rem] hidden h-px bg-gradient-to-r from-transparent via-border to-transparent lg:block"
          />
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.li
                key={step.id}
                className="relative"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, duration: 0.35 }}
              >
                <Surface sheen interactive className="group h-full p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <IconTile
                      icon={Icon}
                      className="group-hover:bg-accent group-hover:text-accent-foreground group-hover:ring-accent"
                    />
                    <span className="font-display text-3xl font-bold leading-none tabular-nums text-foreground/[0.09] transition-colors group-hover:text-accent/25">
                      {String(step.step).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="font-display text-base font-bold tracking-tight">
                    {localize(step.title, language)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {localize(step.description, language)}
                  </p>
                </Surface>
              </motion.li>
            );
          })}
        </ol>
      </Section>
    </>
  );
}

export default MarketplaceHowItWorks;
