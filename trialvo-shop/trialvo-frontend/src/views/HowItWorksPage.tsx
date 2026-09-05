"use client";

import {
  ArrowRight,
  Check,
  ClipboardList,
  RefreshCw,
  Route,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import Layout from "@/components/layout/Layout";
import Breadcrumb from "@/components/navigation/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Eyebrow, IconTile, Section, Surface } from "@/components/section";
import { useTrialLaunch } from "@/components/trial/TrialLaunchProvider";
import { useLanguage } from "@/contexts/LanguageContext";
import { howItWorks } from "@/lib/content/howItWorks";
import { trialCopy } from "@/lib/trial/copy";

const UI = {
  bn: {
    eyebrow: "প্রক্রিয়া",
    title: "কীভাবে কাজ করে",
    lead: "প্রোডাক্ট বাছাই থেকে নিজের ব্র্যান্ডে লাইভ শপ — পুরো পথটা পাঁচ ধাপে সাজানো। এক মিনিটে ইনস্ট্যান্ট ডেমো, তারপর নিজের ডোমেইনে এক মাস ফ্রি ট্রায়াল — কেনার আগে কোথাও অনুমান করতে হবে না।",
    home: "হোম",
    steps: "ধাপগুলো",
    ctaTitle: "এক মিনিটে ডেমো দেখুন",
    ctaBody:
      "নাম আর ইমেইল দিন, সাথে সাথে শপ ও অ্যাডমিনে ঢুকুন। পছন্দ হলে নিজের ডোমেইনে ফ্রি ট্রায়াল নিন। কোনো পেমেন্ট বা কার্ড লাগবে না।",
    browse: "সব প্রোডাক্ট",
    faq: "প্রশ্নোত্তর পড়ুন",
    contact: "যোগাযোগ করুন",
  },
  en: {
    eyebrow: "The process",
    title: "How it works",
    lead: "From picking a product to a live shop under your own brand, the whole path is five steps. An instant demo in a minute, then a month-long free trial on your own domain — nothing needs guessing before you buy.",
    home: "Home",
    steps: "The steps",
    ctaTitle: "See the demo in a minute",
    ctaBody:
      "Enter your name and email and step straight into the shop and admin. Like it? Take a free trial on your own domain. No payment and no card required.",
    browse: "All products",
    faq: "Read the FAQ",
    contact: "Contact us",
  },
} as const;

/** Public how-it-works page (`/how-it-works`). */
export default function HowItWorksPage() {
  const { language } = useLanguage();
  const ui = UI[language];
  const content = howItWorks(language);
  const trial = useTrialLaunch();

  return (
    <Layout>
      <Section tone="muted" pattern="mesh" size="sm" divider="bottom">
        <Breadcrumb
          items={[{ label: ui.home, href: "/" }, { label: ui.title }]}
        />

        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
          <IconTile icon={Route} size="lg" />
          <div className="min-w-0">
            <Eyebrow className="mb-4">{ui.eyebrow}</Eyebrow>
            <h1 className="font-display text-[2rem] font-bold leading-[1.12] tracking-tight sm:text-[2.25rem] md:text-[2.75rem]">
              {ui.title}
            </h1>
            <p className="mt-4 max-w-[68ch] text-[15px] leading-7 text-muted-foreground md:text-base md:leading-[1.75]">
              {ui.lead}
            </p>
          </div>
        </div>

        <nav aria-label={ui.steps} className="mt-8">
          <ol className="flex flex-wrap gap-x-6 gap-y-2">
            {content.steps.map((step) => (
              <li key={step.id}>
                <a
                  href={`#${step.id}`}
                  className="inline-flex min-h-[2rem] items-center py-1 text-xs font-medium text-muted-foreground underline decoration-border decoration-1 underline-offset-4 transition-colors hover:text-accent-strong hover:decoration-accent/50"
                >
                  {step.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </Section>

      <Section containerClassName="max-w-4xl">
        <ol className="relative space-y-5 md:space-y-6">
          {/* Rail tying the five steps together as one sequence. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-8 left-[1.375rem] w-px bg-gradient-to-b from-transparent via-border to-transparent sm:left-7"
          />
          {content.steps.map((step, index) => (
            <motion.li
              key={step.id}
              id={step.id}
              className="relative scroll-mt-28 pl-[3.75rem] sm:pl-20"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(index, 2) * 0.05, duration: 0.35 }}
            >
              {/* Opaque base so the connector rail stops at the marker
                  instead of showing through its translucent tint. */}
              <IconTile
                size="lg"
                className="absolute left-0 top-6 h-11 w-11 rounded-xl bg-background font-display text-sm font-bold tabular-nums sm:top-8 sm:h-14 sm:w-14 sm:rounded-2xl sm:text-base"
              >
                {String(index + 1).padStart(2, "0")}
              </IconTile>

              <Surface sheen className="p-6 md:p-8">
                <Eyebrow className="mb-4">{step.eyebrow}</Eyebrow>
                <h2 className="font-display text-xl font-bold tracking-tight md:text-2xl">
                  {step.title}
                </h2>
                <p className="mt-2.5 max-w-[68ch] text-[15px] leading-7 text-muted-foreground">
                  {step.summary}
                </p>
                <ul className="mt-6 space-y-3 border-t border-border pt-5">
                  {step.details.map((detail) => (
                    <li
                      key={detail}
                      className="flex gap-3 text-sm leading-6 text-foreground/80"
                    >
                      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/[0.12] text-accent ring-1 ring-inset ring-accent/20">
                        <Check className="h-3 w-3" aria-hidden="true" />
                      </span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </Surface>
            </motion.li>
          ))}
        </ol>
      </Section>

      <Section tone="muted" pattern="dots" divider="top">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          <Surface sheen className="p-6 md:p-8">
            <IconTile icon={ClipboardList} size="lg" className="mb-5" />
            <h2 className="font-display text-xl font-bold tracking-tight">
              {content.prepareTitle}
            </h2>
            <p className="mt-2.5 text-[15px] leading-7 text-muted-foreground">
              {content.prepareIntro}
            </p>
            <ul className="mt-6 space-y-3 border-t border-border pt-5">
              {content.prepare.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-foreground/80">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/[0.12] text-accent ring-1 ring-inset ring-accent/20">
                    <Check className="h-3 w-3" aria-hidden="true" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Surface>

          <Surface sheen className="p-6 md:p-8">
            <IconTile icon={RefreshCw} size="lg" tone="neutral" className="mb-5" />
            <h2 className="font-display text-xl font-bold tracking-tight">
              {content.afterTitle}
            </h2>
            <p className="mt-2.5 text-[15px] leading-7 text-muted-foreground">
              {content.afterIntro}
            </p>
            <ul className="mt-6 space-y-3 border-t border-border pt-5">
              {content.after.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-muted-foreground">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-accent ring-1 ring-inset ring-border">
                    <Check className="h-3 w-3" aria-hidden="true" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Surface>
        </div>

        <Surface tone="accent" sheen className="mt-6 p-6 md:p-8">
          <h2 className="font-display text-xl font-bold tracking-tight md:text-2xl">
            {ui.ctaTitle}
          </h2>
          <p className="mt-2.5 max-w-2xl text-[15px] leading-7 text-muted-foreground">
            {ui.ctaBody}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {trial.demoAvailable ? (
              <Button
                type="button"
                onClick={() => trial.openDemo()}
                className="h-11 rounded-lg bg-accent px-6 font-semibold text-accent-foreground shadow-accent-glow transition-transform hover:bg-accent/90 hover:-translate-y-0.5"
              >
                <Zap className="mr-1.5 h-4 w-4" aria-hidden="true" />
                {trialCopy(language).demo.cta}
              </Button>
            ) : null}
            <Button
              asChild
              variant={trial.demoAvailable ? "outline" : "default"}
              className={
                trial.demoAvailable
                  ? "h-11 rounded-lg bg-background shadow-card"
                  : "h-11 rounded-lg bg-accent px-6 font-semibold text-accent-foreground shadow-accent-glow transition-transform hover:bg-accent/90 hover:-translate-y-0.5"
              }
            >
              <LocalizedLink href="/products">
                {ui.browse}
                <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
              </LocalizedLink>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 rounded-lg bg-background shadow-card"
            >
              <LocalizedLink href="/faq">{ui.faq}</LocalizedLink>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 rounded-lg bg-background shadow-card"
            >
              <LocalizedLink href="/contact">{ui.contact}</LocalizedLink>
            </Button>
          </div>
        </Surface>
      </Section>
    </Layout>
  );
}
