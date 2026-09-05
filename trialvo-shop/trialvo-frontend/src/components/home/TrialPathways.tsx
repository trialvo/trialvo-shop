"use client";

import { ArrowRight, Check, Globe, Server, Sparkles, Zap } from "lucide-react";
import { motion } from "framer-motion";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import { Eyebrow, IconTile, Section, SectionIntro, Surface } from "@/components/section";
import { useTrialLaunch } from "@/components/trial/TrialLaunchProvider";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { trialCopy } from "@/lib/trial/copy";
import { localizeNumber, monthsRangeLabel } from "@/lib/trial/months";
import { cn } from "@/lib/utils";

const COPY = {
  bn: {
    eyebrow: "ট্রায়ালের দুইটি পথ",
    title: "ডেমো এক মিনিটে। তারপর নিজের ডোমেইনে এক মাস ফ্রি।",
    lead: "স্ক্রিনশট দেখে সিদ্ধান্ত নিতে হবে না। প্রথমে ইনস্ট্যান্ট ডেমোতে ঢুকে দেখুন, পছন্দ হলে আমরা আপনার নিজের ডোমেইন ও হোস্টিংয়ে পুরো সিস্টেম বসিয়ে দেব — কেনার আগেই আসল ব্যবসা চালিয়ে যাচাই করুন।",
    step1: "ধাপ ১ · এখনই",
    step2: "ধাপ ২ · নিজের ডোমেইনে",
    demoTitle: "ইনস্ট্যান্ট লাইভ ডেমো",
    demoBody: "নাম ও ইমেইল দিন — সাথে সাথে শপ ও অ্যাডমিন প্যানেলের লগইন পাবেন। অ্যাপ্রুভালের অপেক্ষা নেই।",
    demoPoints: ["শপ + অ্যাডমিন দুটোই", "কার্ড লাগবে না", (d: string) => `${d} দিন অ্যাক্সেস`],
    domainTitle: (m: string) => `${m} ফ্রি ট্রায়াল — আপনার ডোমেইনে`,
    domainBody: "ডেমো পছন্দ হলে অনুরোধ করুন। আপনার VPS বা cPanel হোস্টিংয়ে আমরা নিজেরা ডিপ্লয় করে দেব। হোস্টিং না থাকলে আমাদের থেকে নিতে পারবেন।",
    domainPoints: ["আপনার ডোমেইন, আপনার ডেটা", "VPS বা cPanel — দুটোই চলে", (h: string) => `${h} ঘণ্টায় লাইভ`],
    unique: "এই সুবিধা অন্য কেউ দেয় না",
    uniqueBody: "ডেমো তো অনেকেই দেয়। কিন্তু কেনার আগে নিজের ডোমেইনে, নিজের হোস্টিংয়ে, আসল ক্রেতা নিয়ে পুরো এক মাস চালানোর সুযোগ — এটা শুধু Trialvo-তে।",
    hosting: "হোস্টিং নেই?",
    hostingBody: "ট্রায়াল ফর্মেই \"Trialvo থেকে হোস্টিং নিতে চাই\" বেছে নিন। আমরা সেটআপসহ কোটেশন পাঠাব।",
    howLink: "পুরো প্রক্রিয়া দেখুন",
  },
  en: {
    eyebrow: "Two ways to try",
    title: "Demo in a minute. Then a month free on your own domain.",
    lead: "Stop deciding from screenshots. Start with an instant demo, and if you like it we deploy the full system on your own domain and hosting — run real business on it before you pay.",
    step1: "Step 1 · Right now",
    step2: "Step 2 · On your domain",
    demoTitle: "Instant live demo",
    demoBody: "Enter your name and email — shop and admin logins arrive immediately. No approval queue.",
    demoPoints: ["Shop + admin, both", "No card needed", (d: string) => `${d} days of access`],
    domainTitle: (m: string) => `${m} free trial — on your domain`,
    domainBody: "Liked the demo? Request a domain trial. We deploy it on your VPS or cPanel hosting ourselves. No hosting yet? Get it from us.",
    domainPoints: ["Your domain, your data", "VPS or cPanel — both work", (h: string) => `Live within ${h}h`],
    unique: "Nobody else offers this",
    uniqueBody: "Plenty of vendors give demos. Running the product for a full month on your own domain, your own hosting, with real customers, before buying — only at Trialvo.",
    hosting: "No hosting?",
    hostingBody: "Pick \"I want hosting from Trialvo\" in the trial form. We send a quote with setup included.",
    howLink: "See the full process",
  },
} as const;

/**
 * Home-page section that sells the two-step trial: instant shared demo, then a
 * multi-month trial on the customer's own domain. Both CTAs open the shared
 * dialogs without a product (the picker step handles product choice).
 */
export function TrialPathways() {
  const { language } = useLanguage();
  const { config, demoAvailable, domainAvailable, openDemo, openDomain } = useTrialLaunch();
  const copy = COPY[language];
  const tc = trialCopy(language);

  if (!demoAvailable && !domainAvailable) return null;

  const months = monthsRangeLabel(config.domainMonths, language);
  const demoDays = localizeNumber(config.demoAccessDays, language);
  const sla = localizeNumber(config.fulfillmentSlaHours, language);

  const demoPoints = copy.demoPoints.map((p) => (typeof p === "function" ? p(demoDays) : p));
  const domainPoints = copy.domainPoints.map((p) => (typeof p === "function" ? p(sla) : p));

  return (
    <Section labelledBy="trial-pathways-title" pattern="mesh" divider="top" id="trial">
      <SectionIntro
        id="trial-pathways-title"
        eyebrow={copy.eyebrow}
        title={copy.title}
        lead={copy.lead}
      />

      <div className="grid gap-4 lg:grid-cols-12 lg:gap-6">
        {demoAvailable ? (
          <PathCard
            className="lg:col-span-5"
            step={copy.step1}
            icon={Zap}
            tone="accent"
            title={copy.demoTitle}
            body={copy.demoBody}
            points={demoPoints}
            cta={tc.demo.cta}
            onClick={() => openDemo()}
            delay={0}
          />
        ) : null}
        {domainAvailable ? (
          <PathCard
            className={demoAvailable ? "lg:col-span-7" : "lg:col-span-12"}
            step={demoAvailable ? copy.step2 : copy.step1}
            icon={Globe}
            tone="dark"
            badge={copy.unique}
            title={copy.domainTitle(months)}
            body={copy.domainBody}
            points={domainPoints}
            cta={tc.domain.cta}
            onClick={() => openDomain()}
            delay={0.08}
            aside={
              config.hostingPurchaseEnabled ? (
                <div className="mt-6 flex items-start gap-3 rounded-xl border border-primary-foreground/15 bg-primary-foreground/[0.07] p-4">
                  <Server className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-primary-foreground">{copy.hosting}</p>
                    <p className="mt-0.5 text-[13px] leading-6 text-primary-foreground/75">{copy.hostingBody}</p>
                  </div>
                </div>
              ) : null
            }
          />
        ) : null}
      </div>

      {domainAvailable ? (
        <motion.div
          className="mt-6 grid gap-4 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: 0.16 }}
        >
          <Surface sheen className="flex items-start gap-4 p-5 md:col-span-2">
            <IconTile icon={Sparkles} size="sm" tone="accent" />
            <div>
              <p className="font-display text-[15px] font-bold tracking-tight text-foreground">{copy.unique}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{copy.uniqueBody}</p>
            </div>
          </Surface>
          <LocalizedLink
            href="/how-it-works"
            className="inline-flex min-h-[2.75rem] items-center gap-1.5 self-center text-sm font-semibold text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-accent-strong hover:decoration-accent/50 md:justify-self-end"
          >
            {copy.howLink}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </LocalizedLink>
        </motion.div>
      ) : null}
    </Section>
  );
}

function PathCard({
  className,
  step,
  icon,
  tone,
  badge,
  title,
  body,
  points,
  cta,
  onClick,
  delay,
  aside,
}: Readonly<{
  className?: string;
  step: string;
  icon: typeof Zap;
  tone: "accent" | "dark";
  badge?: string;
  title: string;
  body: string;
  points: string[];
  cta: string;
  onClick: () => void;
  delay: number;
  aside?: React.ReactNode;
}>) {
  // "dark" is the inverted card. It must only use the primary /
  // primary-foreground token pair (never raw white) so it stays legible when
  // the theme flips: light theme → near-black card with white text, dark
  // theme → near-white card with dark text. The same convention is used by
  // MarketplaceCTA, so both inverted blocks on the home page match.
  const dark = tone === "dark";
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
    >
      <div
        className={cn(
          "relative isolate flex h-full flex-col overflow-hidden rounded-3xl p-6 md:p-8",
          dark
            ? "bg-primary text-primary-foreground shadow-soft-xl ring-1 ring-inset ring-primary-foreground/10"
            : "surface surface-sheen",
        )}
      >
        {dark ? (
          <>
            {/* Brand-green glow — accent token is identical in both themes. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_70%_at_90%_10%,hsl(var(--accent)/0.32),transparent_65%)]"
            />
            <div
              aria-hidden="true"
              className="pattern-grid pointer-events-none absolute inset-0 -z-10 opacity-30 [mask-image:radial-gradient(ellipse_at_10%_60%,black,transparent_70%)]"
            />
          </>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <Eyebrow tone={dark ? "inverted" : undefined}>{step}</Eyebrow>
          {badge ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-bold text-accent-foreground shadow-accent-glow">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              {badge}
            </span>
          ) : null}
        </div>

        <div className="mt-5 flex items-start gap-4">
          <IconTile icon={icon} size="md" tone={dark ? "inverted" : "accent"} />
          <div className="min-w-0">
            <h3
              className={cn(
                "font-display text-xl font-bold leading-tight tracking-tight md:text-2xl",
                dark ? "text-primary-foreground" : "text-foreground",
              )}
            >
              {title}
            </h3>
            <p className={cn("mt-2 text-[15px] leading-7", dark ? "text-primary-foreground/75" : "text-muted-foreground")}>
              {body}
            </p>
          </div>
        </div>

        <ul className="mt-6 grid gap-2.5 sm:grid-cols-3">
          {points.map((pt) => (
            <li
              key={pt}
              className={cn(
                "flex items-start gap-2 text-sm font-medium",
                dark ? "text-primary-foreground/90" : "text-foreground/85",
              )}
            >
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              {pt}
            </li>
          ))}
        </ul>

        {aside}

        <div className="mt-auto pt-7">
          <Button
            type="button"
            size="lg"
            onClick={onClick}
            className={cn(
              "h-12 w-full rounded-lg px-6 font-semibold transition-transform hover:-translate-y-0.5 sm:w-auto",
              dark
                ? "bg-accent text-accent-foreground shadow-accent-glow hover:bg-accent/90"
                : "bg-accent text-accent-foreground shadow-accent-glow hover:bg-accent/90",
            )}
          >
            {cta}
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export default TrialPathways;
