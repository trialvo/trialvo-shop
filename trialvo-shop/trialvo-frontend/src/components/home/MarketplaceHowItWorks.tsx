import {
  Code2,
  Globe,
  Headphones,
  Rocket,
  ShoppingBag,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { localize } from "@/lib/localize";
import { IconTile, Section, SectionIntro, Surface } from "@/components/section";
import type { HowItWorksStep, TrustItem } from "@/types/marketplace";

const BENEFITS: TrustItem[] = [
  {
    id: "instant",
    icon: Zap,
    title: { bn: "ইনস্ট্যান্ট ডেমো অ্যাক্সেস", en: "Instant demo access" },
    description: {
      bn: "অ্যাপ্রুভালের অপেক্ষা নেই — ফর্ম জমা দিলেই শপ ও অ্যাডমিনের লগইন হাতে।",
      en: "No approval queue — submit the form and the shop and admin logins are yours.",
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
    id: "demo",
    step: 2,
    icon: Zap,
    title: { bn: "ইনস্ট্যান্ট ডেমো দেখুন", en: "Open the instant demo" },
    description: {
      bn: "নাম-ইমেইল দিন, সাথে সাথে শপ ও অ্যাডমিন প্যানেলে ঢুকে দেখুন।",
      en: "Enter name and email, then explore the shop and admin panel right away.",
    },
  },
  {
    id: "domain",
    step: 3,
    icon: Globe,
    title: { bn: "নিজের ডোমেইনে ট্রায়াল নিন", en: "Trial it on your domain" },
    description: {
      bn: "পছন্দ হলে অনুরোধ করুন — আপনার VPS/cPanel-এ আমরা এক মাস ফ্রি বসিয়ে দেব।",
      en: "Liked it? Request a trial — we deploy it free for a month on your VPS/cPanel.",
    },
  },
  {
    id: "launch",
    step: 4,
    icon: Rocket,
    title: { bn: "কিনুন ও লাইভ থাকুন", en: "Buy and stay live" },
    description: {
      bn: "এককালীন পেমেন্ট — ট্রায়াল ইনস্ট্যান্সটাই পারমানেন্ট হয়ে যায়, আবার সেটআপ লাগে না।",
      en: "One payment — the trial instance becomes permanent, no second setup.",
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
          eyebrow={language === "bn" ? "যেভাবে কাজ করে" : "How it works"}
          title={
            language === "bn"
              ? "ডেমো থেকে নিজের ডোমেইনে লাইভ — চার ধাপে"
              : "From demo to live on your domain — in four steps"
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
