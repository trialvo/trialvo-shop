"use client";

import { ArrowRight, Check, ChevronRight, ClipboardList, Route } from "lucide-react";
import { motion } from "framer-motion";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { howItWorks } from "@/lib/content/howItWorks";

const UI = {
  bn: {
    eyebrow: "প্রক্রিয়া",
    title: "কীভাবে কাজ করে",
    lead: "প্রোডাক্ট বাছাই থেকে নিজের ব্র্যান্ডে লাইভ শপ — পুরো পথটা পাঁচ ধাপে সাজানো। কোনো ধাপে অনুমান করতে হবে না, কারণ কেনার আগেই আপনি আসল প্রোডাক্ট চালিয়ে দেখতে পারবেন।",
    home: "হোম",
    steps: "ধাপগুলো",
    ctaTitle: "প্রোডাক্ট দেখে ট্রায়াল শুরু করুন",
    ctaBody:
      "ক্যাটালগ ঘুরে দেখুন, পছন্দের প্রোডাক্টে ফ্রি ট্রায়াল নিন, তারপর সিদ্ধান্ত নিন। কোনো পেমেন্ট বা কার্ড লাগবে না।",
    browse: "সব প্রোডাক্ট",
    faq: "প্রশ্নোত্তর পড়ুন",
    contact: "যোগাযোগ করুন",
  },
  en: {
    eyebrow: "The process",
    title: "How it works",
    lead: "From picking a product to a live shop under your own brand, the whole path is five steps. Nothing needs guessing, because you can run the real product before you buy it.",
    home: "Home",
    steps: "The steps",
    ctaTitle: "Browse the products and start a trial",
    ctaBody:
      "Look through the catalog, start a free trial on the one you like, then decide. No payment and no card required.",
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

  return (
    <Layout>
      <section className="border-b border-border bg-muted/30">
        <div className="container-custom py-10 md:py-14">
          <nav aria-label="Breadcrumb" className="mb-5">
            <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <li>
                <LocalizedLink href="/" className="hover:text-foreground">
                  {ui.home}
                </LocalizedLink>
              </li>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              <li aria-current="page" className="font-medium text-foreground">
                {ui.title}
              </li>
            </ol>
          </nav>

          <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            <Route className="h-4 w-4" aria-hidden="true" />
            {ui.eyebrow}
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            {ui.title}
          </h1>
          <p className="mt-4 max-w-3xl text-[15px] leading-7 text-muted-foreground">
            {ui.lead}
          </p>

          <nav aria-label={ui.steps} className="mt-7">
            <ol className="flex flex-wrap gap-2">
              {content.steps.map((step) => (
                <li key={step.id}>
                  <a
                    href={`#${step.id}`}
                    className="inline-flex items-center rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground"
                  >
                    {step.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </section>

      <section className="bg-background py-12 md:py-16">
        <div className="container-custom max-w-4xl">
          <ol className="space-y-6">
            {content.steps.map((step, index) => (
              <motion.li
                key={step.id}
                id={step.id}
                className="scroll-mt-28 rounded-2xl border border-border bg-card p-6 md:p-8"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(index, 2) * 0.05, duration: 0.35 }}
              >
                <div className="mb-4 flex items-center justify-between gap-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
                    {step.eyebrow}
                  </p>
                  <span className="font-display text-3xl font-bold tabular-nums text-muted-foreground/25">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h2 className="font-display text-xl font-bold tracking-tight md:text-2xl">
                  {step.title}
                </h2>
                <p className="mt-2.5 text-[15px] leading-7 text-muted-foreground">
                  {step.summary}
                </p>
                <ul className="mt-5 space-y-2.5 border-t border-border/60 pt-5">
                  {step.details.map((detail) => (
                    <li
                      key={detail}
                      className="flex gap-3 text-sm leading-6 text-foreground/80"
                    >
                      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/12 text-accent">
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-border bg-muted/25 py-12 md:py-16">
        <div className="container-custom">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-accent">
                <ClipboardList className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="font-display text-xl font-bold tracking-tight">
                {content.prepareTitle}
              </h2>
              <p className="mt-2 text-[15px] leading-7 text-muted-foreground">
                {content.prepareIntro}
              </p>
              <ul className="mt-5 space-y-2.5">
                {content.prepare.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6 text-foreground/80">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/12 text-accent">
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <h2 className="font-display text-xl font-bold tracking-tight">
                {content.afterTitle}
              </h2>
              <p className="mt-2 text-[15px] leading-7 text-muted-foreground">
                {content.afterIntro}
              </p>
              <ul className="mt-5 space-y-2.5">
                {content.after.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6 text-muted-foreground">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-accent">
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-border bg-card p-6 md:p-8">
            <h2 className="font-display text-xl font-bold tracking-tight md:text-2xl">
              {ui.ctaTitle}
            </h2>
            <p className="mt-2 max-w-2xl text-[15px] leading-7 text-muted-foreground">
              {ui.ctaBody}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild className="h-11 rounded-lg">
                <LocalizedLink href="/products">
                  {ui.browse}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </LocalizedLink>
              </Button>
              <Button asChild variant="outline" className="h-11 rounded-lg bg-background">
                <LocalizedLink href="/faq">{ui.faq}</LocalizedLink>
              </Button>
              <Button asChild variant="outline" className="h-11 rounded-lg bg-background">
                <LocalizedLink href="/contact">{ui.contact}</LocalizedLink>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
