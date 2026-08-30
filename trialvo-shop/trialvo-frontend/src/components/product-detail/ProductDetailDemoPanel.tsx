"use client";

import { ArrowUpRight, KeyRound, LayoutDashboard, Store } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Eyebrow, IconTile, Surface } from "@/components/section";
import { getDemoTargets, type DemoTargetId } from "@/lib/digitalGoods";
import type { MarketplaceLanguage } from "@/types/marketplace";
import type { Product } from "@/types/product";

export type ProductDetailDemoPanelProps = {
  product: Product;
  language: MarketplaceLanguage;
  /** Shows the admin credential hint only when a trial can actually be requested */
  canRequestTrial: boolean;
  onStartTrial: () => void;
};

const ICONS: Record<DemoTargetId, LucideIcon> = {
  shop: Store,
  admin: LayoutDashboard,
};

const COPY = {
  bn: {
    eyebrow: "লাইভ ডেমো",
    title: "কেনার আগে চালিয়ে দেখুন",
    lead: "স্ক্রিনশট নয় — আসল চালু সিস্টেমে ঢুকে যাচাই করুন।",
    open: "খুলুন",
    targets: {
      shop: {
        title: "শপ (ফ্রন্টএন্ড)",
        body: "গ্রাহক যা দেখবে — ব্রাউজিং, কার্ট ও চেকআউট নিজে চালিয়ে দেখুন। লগইন লাগবে না।",
      },
      admin: {
        title: "অ্যাডমিন প্যানেল",
        body: "প্রোডাক্ট, অর্ডার ও রিপোর্ট ম্যানেজমেন্ট ড্যাশবোর্ড।",
      },
    },
    loginNote: "লগইন তথ্য ফ্রি ট্রায়ালের সাথে পাঠানো হয়।",
    loginNoteNoTrial: "লগইন তথ্য কেনার পর দেওয়া হয়।",
    trialCta: "ট্রায়াল নিন",
    newTab: "নতুন ট্যাবে খুলবে",
  },
  en: {
    eyebrow: "Live demo",
    title: "Try it before you buy",
    lead: "Not screenshots — open the real running system and judge for yourself.",
    open: "Open",
    targets: {
      shop: {
        title: "Storefront",
        body: "Exactly what your customers see. Browse, add to cart, and run a checkout. No login needed.",
      },
      admin: {
        title: "Admin panel",
        body: "The dashboard where products, orders, and reports are managed.",
      },
    },
    loginNote: "Login details are sent with your free trial.",
    loginNoteNoTrial: "Login details are shared after purchase.",
    trialCta: "Get a trial",
    newTab: "Opens in a new tab",
  },
} as const;

/**
 * Demo launcher. A product can expose the customer storefront, the admin
 * panel, or both — each is a real deployment URL from `deploy_config`, so this
 * renders only the entry points that exist.
 */
export function ProductDetailDemoPanel({
  product,
  language,
  canRequestTrial,
  onStartTrial,
}: Readonly<ProductDetailDemoPanelProps>) {
  const targets = getDemoTargets(product);
  if (targets.length === 0) return null;

  const copy = COPY[language];

  return (
    <Surface sheen className="overflow-hidden">
      <div className="border-b border-border px-6 pb-5 pt-6">
        <Eyebrow>{copy.eyebrow}</Eyebrow>
        <h2 className="mt-2 font-display text-lg font-bold tracking-tight text-foreground">
          {copy.title}
        </h2>
        <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{copy.lead}</p>
      </div>

      <ul className="divide-y divide-border">
        {targets.map((target) => {
          const Icon = ICONS[target.id];
          const text = copy.targets[target.id];
          return (
            <li key={target.id}>
              <a
                href={target.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-4 px-6 py-5 transition-colors hover:bg-muted/50"
              >
                <IconTile
                  icon={Icon}
                  size="md"
                  className="group-hover:bg-accent group-hover:text-accent-foreground group-hover:ring-accent"
                />

                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="font-display text-[15px] font-bold tracking-tight text-foreground transition-colors group-hover:text-accent-strong">
                      {text.title}
                    </span>
                    <ArrowUpRight
                      className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent-strong"
                      aria-hidden="true"
                    />
                  </span>

                  <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                    {text.body}
                  </span>

                  <span className="mt-2 block truncate font-mono text-xs text-muted-foreground/80">
                    {target.host}
                  </span>

                  {target.requiresLogin ? (
                    <span className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-muted-foreground">
                      <KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {canRequestTrial ? copy.loginNote : copy.loginNoteNoTrial}
                    </span>
                  ) : null}
                </span>
              </a>
            </li>
          );
        })}
      </ul>

      <p className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border bg-muted/30 px-6 py-3 text-xs text-muted-foreground">
        <span>{copy.newTab}</span>
        {canRequestTrial ? (
          <button
            type="button"
            onClick={onStartTrial}
                  className="inline-flex min-h-[2rem] items-center py-1 font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-accent-strong hover:decoration-accent/50"
          >
            {copy.trialCta}
          </button>
        ) : null}
      </p>
    </Surface>
  );
}

export default ProductDetailDemoPanel;
