"use client";

import { ChevronRight, LifeBuoy, Mail, MessageCircleQuestion, Phone } from "lucide-react";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import Layout from "@/components/layout/Layout";
import FaqAccordion from "@/components/faq/FaqAccordion";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { BRAND } from "@/lib/brand";
import { faqGroups } from "@/lib/content/faq";
import { legalIndex } from "@/lib/legal";

const UI = {
  bn: {
    eyebrow: "সাহায্য কেন্দ্র",
    title: "সাধারণ প্রশ্নোত্তর",
    lead: "রেডিমেড ইকমার্স ওয়েবসাইট কেনা, লাইভ ট্রায়াল নেওয়া, আজীবন লাইসেন্স ও সাপোর্ট নিয়ে যা যা জিজ্ঞাসা আসে — সবকিছুর সরাসরি উত্তর এক জায়গায়। উত্তর না পেলে আমাদের জানান, আমরা যোগ করে দেব।",
    home: "হোম",
    jump: "বিভাগে যান",
    stillTitle: "উত্তর খুঁজে পাচ্ছেন না?",
    stillBody:
      "কেনার আগে যেকোনো প্রশ্ন করতে পারেন — টেকনিক্যাল, লাইসেন্স, প্রাইসিং বা কাস্টম ডেভেলপমেন্ট। আমরা স্পষ্ট উত্তর দেব, কোনো বাধ্যবাধকতা নেই।",
    contact: "যোগাযোগ করুন",
    browse: "প্রোডাক্ট দেখুন",
    policyTitle: "সম্পূর্ণ নীতিমালা",
    policyBody: "শর্তাবলী, লাইসেন্স, রিফান্ড ও সাপোর্ট নীতির বিস্তারিত ডকুমেন্ট।",
  },
  en: {
    eyebrow: "Help centre",
    title: "Frequently asked questions",
    lead: "Direct answers to what buyers actually ask about purchasing a ready-made ecommerce website, running a live trial, and how the lifetime license and support work. If your question is missing, tell us and we will add it.",
    home: "Home",
    jump: "Jump to a section",
    stillTitle: "Cannot find your answer?",
    stillBody:
      "Ask us anything before you buy — technical, licensing, pricing, or custom development. You will get a straight answer, with no obligation.",
    contact: "Contact us",
    browse: "Browse products",
    policyTitle: "Full policies",
    policyBody: "The detailed terms, license, refund, and support documents.",
  },
} as const;

/** Public FAQ page (`/faq`) — grouped answers plus links into the legal suite. */
export default function FaqPage() {
  const { language } = useLanguage();
  const ui = UI[language];
  const groups = faqGroups(language);
  const policies = legalIndex(language).slice(0, 4);

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
            <MessageCircleQuestion className="h-4 w-4" aria-hidden="true" />
            {ui.eyebrow}
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            {ui.title}
          </h1>
          <p className="mt-4 max-w-3xl text-[15px] leading-7 text-muted-foreground">
            {ui.lead}
          </p>

          <nav aria-label={ui.jump} className="mt-7">
            <ul className="flex flex-wrap gap-2">
              {groups.map((group) => (
                <li key={group.id}>
                  <a
                    href={`#${group.id}`}
                    className="inline-flex items-center rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground"
                  >
                    {group.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>

      <section className="bg-background py-12 md:py-16">
        <div className="container-custom max-w-4xl">
          {groups.map((group) => (
            <div key={group.id} id={group.id} className="scroll-mt-28 pb-12 last:pb-0">
              <h2 className="font-display text-xl font-bold tracking-tight md:text-2xl">
                {group.title}
              </h2>
              <p className="mb-5 mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {group.description}
              </p>
              <FaqAccordion entries={group.entries} />
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-muted/30 py-12 md:py-16">
        <div className="container-custom">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-accent">
                <LifeBuoy className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="font-display text-xl font-bold tracking-tight">
                {ui.stillTitle}
              </h2>
              <p className="mt-2 text-[15px] leading-7 text-muted-foreground">
                {ui.stillBody}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button asChild size="sm" className="h-10 rounded-lg">
                  <LocalizedLink href="/contact">{ui.contact}</LocalizedLink>
                </Button>
                <Button asChild size="sm" variant="outline" className="h-10 rounded-lg bg-background">
                  <LocalizedLink href="/products">{ui.browse}</LocalizedLink>
                </Button>
              </div>
              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <a
                  href={`mailto:${BRAND.contactEmail}`}
                  className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <Mail className="h-4 w-4 text-accent" aria-hidden="true" />
                  {BRAND.contactEmail}
                </a>
                <a
                  href={BRAND.contactPhoneHref}
                  className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <Phone className="h-4 w-4 text-accent" aria-hidden="true" />
                  {BRAND.contactPhone}
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <h2 className="font-display text-xl font-bold tracking-tight">
                {ui.policyTitle}
              </h2>
              <p className="mt-2 text-[15px] leading-7 text-muted-foreground">
                {ui.policyBody}
              </p>
              <ul className="mt-5 space-y-2.5">
                {policies.map((policy) => (
                  <li key={policy.key}>
                    <LocalizedLink
                      href={policy.path}
                      className="group inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-accent"
                    >
                      <ChevronRight
                        className="h-4 w-4 text-accent transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                      {policy.title}
                    </LocalizedLink>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
