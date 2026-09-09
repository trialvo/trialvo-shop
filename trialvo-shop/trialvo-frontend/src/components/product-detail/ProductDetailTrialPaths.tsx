"use client";

import { ArrowRight, Check, Globe, Server, Zap } from "lucide-react";
import { Eyebrow, IconTile, Surface } from "@/components/section";
import { Button } from "@/components/ui/button";
import { useTrialLaunch } from "@/components/trial/TrialLaunchProvider";
import { trialCopy } from "@/lib/trial/copy";
import { localizeNumber, monthsRangeLabel } from "@/lib/trial/months";
import { productSupportsDemo, productSupportsDomainTrial } from "@/lib/trial/types";
import type { MarketplaceLanguage } from "@/types/marketplace";
import type { Product } from "@/types/product";

export type ProductDetailTrialPathsProps = {
  product: Product;
  language: MarketplaceLanguage;
};

const COPY = {
  bn: {
    eyebrow: "দুইভাবে ট্রাই করুন",
    title: "প্রথমে ডেমো, তারপর নিজের ডোমেইনে",
    lead: "কোনো অ্যাপ্রুভাল নেই। ডেমো সাথে সাথে; ডোমেইন ট্রায়াল আমরা হাতে বসিয়ে দিই।",
    step1: "ধাপ ১",
    step2: "ধাপ ২",
    demoPoints: ["শপ + অ্যাডমিন লগইন", "১ মিনিটে", "কার্ড লাগবে না"],
    domainPoints: ["আপনার ডোমেইন ও হোস্টিং", "VPS বা cPanel", "হোস্টিং না থাকলে আমাদের থেকে নিন"],
    unique: "এই সুবিধা অন্য কেউ দেয় না",
    within: (h: string) => `${h} ঘণ্টায় লাইভ`,
  },
  en: {
    eyebrow: "Two ways to try",
    title: "Demo first, then your own domain",
    lead: "No approval step. The demo is instant; the domain trial we deploy for you by hand.",
    step1: "Step 1",
    step2: "Step 2",
    demoPoints: ["Shop + admin login", "In one minute", "No card needed"],
    domainPoints: ["Your domain & hosting", "VPS or cPanel", "No hosting? Get it from us"],
    unique: "Nobody else offers this",
    within: (h: string) => `Live within ${h}h`,
  },
} as const;

/**
 * The two trial paths as a single panel on the product page. Replaces the old
 * "Start free trial" button + Option 1/2 modal: the customer sees the whole
 * journey (instant demo → months on their own domain) before clicking anything.
 */
export function ProductDetailTrialPaths({ product, language }: Readonly<ProductDetailTrialPathsProps>) {
  const { config, demoAvailable, domainAvailable, openDemo, openDomain } = useTrialLaunch();
  const tc = trialCopy(language);
  const copy = COPY[language];

  const showDemo = demoAvailable && productSupportsDemo(product);
  const showDomain = domainAvailable && productSupportsDomainTrial(product);
  if (!product.isTrialable || (!showDemo && !showDomain)) return null;

  const months = monthsRangeLabel(config.domainMonths, language);

  return (
    <Surface sheen className="overflow-hidden" id="trial-paths">
      <div className="border-b border-border px-6 pb-5 pt-6">
        <Eyebrow>{copy.eyebrow}</Eyebrow>
        <h2 className="mt-2 font-display text-lg font-bold tracking-tight text-foreground">{copy.title}</h2>
        <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{copy.lead}</p>
      </div>

      <div className="divide-y divide-border">
        {showDemo ? (
          <PathRow
            step={copy.step1}
            icon={Zap}
            title={tc.demo.eyebrow}
            body={tc.demo.accessDays(localizeNumber(config.demoAccessDays, language))}
            points={copy.demoPoints}
            cta={tc.demo.cta}
            primary
            onClick={() => openDemo({ product })}
          />
        ) : null}
        {showDomain ? (
          <PathRow
            step={showDemo ? copy.step2 : copy.step1}
            icon={Globe}
            title={`${tc.domain.eyebrow} · ${tc.domain.freeFor(months)}`}
            body={copy.within(localizeNumber(config.fulfillmentSlaHours, language))}
            points={copy.domainPoints}
            cta={tc.domain.cta}
            badge={copy.unique}
            onClick={() => openDomain({ product })}
          />
        ) : null}
      </div>

      <p className="flex items-center gap-2 border-t border-border bg-muted/30 px-6 py-3 text-xs text-muted-foreground">
        <Server className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {tc.domain.weSetUp} · {tc.demo.noWait}
      </p>
    </Surface>
  );
}

function PathRow({
  step,
  icon,
  title,
  body,
  points,
  cta,
  badge,
  primary,
  onClick,
}: Readonly<{
  step: string;
  icon: typeof Zap;
  title: string;
  body: string;
  points: readonly string[];
  cta: string;
  badge?: string;
  primary?: boolean;
  onClick: () => void;
}>) {
  return (
    <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-start">
      <IconTile icon={icon} size="md" tone={primary ? "accent" : "neutral"} />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <span>{step}</span>
          {badge ? (
            <span className="rounded-full bg-accent/10 px-2 py-0.5 normal-case tracking-normal text-accent-strong">{badge}</span>
          ) : null}
        </p>
        <h3 className="mt-1 font-display text-[15px] font-bold tracking-tight text-foreground">{title}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{body}</p>
        <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
          {points.map((pt) => (
            <li key={pt} className="flex items-center gap-1.5 text-xs text-foreground/80">
              <Check className="h-3.5 w-3.5 shrink-0 text-accent-strong" aria-hidden="true" />
              {pt}
            </li>
          ))}
        </ul>
        <Button
          type="button"
          onClick={onClick}
          size="sm"
          variant={primary ? "default" : "outline"}
          className={
            primary
              ? "mt-3.5 h-10 rounded-lg bg-accent px-4 font-semibold text-accent-foreground shadow-accent-glow hover:bg-accent/90"
              : "mt-3.5 h-10 rounded-lg bg-background px-4 font-semibold"
          }
        >
          {cta}
          <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

export default ProductDetailTrialPaths;
