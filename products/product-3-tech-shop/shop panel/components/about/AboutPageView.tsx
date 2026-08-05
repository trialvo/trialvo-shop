import Link from "next/link";
import type { ReactElement } from "react";
import {
  ArrowRight,
  Award,
  Check,
  Heart,
  Package,
  ShieldCheck,
  Target,
  Truck,
} from "lucide-react";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import { ABOUT_PAGE } from "@/lib/about/aboutContent";
import type { AboutPillar } from "@/lib/about/aboutContent";

const PILLAR_ICONS: Record<AboutPillar["icon"], typeof Target> = {
  target: Target,
  heart: Heart,
  award: Award,
};

const PROMISE_ICONS = [ShieldCheck, Truck, Package, Heart] as const;

/**
 * Polished About page — matches contact/policy visual language.
 */
export function AboutPageView(): ReactElement {
  const content = ABOUT_PAGE;

  return (
    <div className="container py-4 md:py-6 pb-12 md:pb-14">
      <Breadcrumbs items={[{ label: "About Us" }]} className="mb-3" />

      {/* Intro — brand first */}
      <section className="relative mb-6 animate-fade-in overflow-hidden rounded-sm border border-border bg-card p-5 shadow-product sm:p-6 md:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_80%_at_0%_0%,hsl(var(--primary)/0.12),transparent_55%),radial-gradient(ellipse_50%_60%_at_100%_100%,hsl(var(--accent)/0.08),transparent_50%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(hsl(var(--primary)/0.04)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--primary)/0.04)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:linear-gradient(180deg,black_20%,transparent_90%)]"
        />

        <div className="relative max-w-2xl">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
            {content.eyebrow}
          </p>
          <p className="font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {content.brand}
          </p>
          <h1 className="mt-2 font-heading text-xl font-semibold tracking-tight text-foreground/90 md:text-2xl">
            {content.headline}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-[15px]">
            {content.summary}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href={content.primaryCta.href}
              className="inline-flex h-10 items-center gap-2 rounded-sm bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              {content.primaryCta.label}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
            <Link
              href={content.secondaryCta.href}
              className="inline-flex h-10 items-center gap-2 rounded-sm border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {content.secondaryCta.label}
            </Link>
          </div>
        </div>
      </section>

      {/* Story + stats */}
      <section className="mb-6 grid animate-fade-in grid-cols-1 gap-5 [animation-delay:80ms] lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-6">
        <div className="rounded-sm border border-border bg-card p-5 shadow-product sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground md:text-xl">
            {content.storyTitle}
          </h2>
          <div className="mt-3 space-y-3">
            {content.storyParagraphs.map((para) => (
              <p
                key={para.slice(0, 32)}
                className="text-sm leading-relaxed text-muted-foreground md:text-[15px]"
              >
                {para}
              </p>
            ))}
          </div>
        </div>

        <div className="rounded-sm border border-border bg-card shadow-product">
          <ul className="grid grid-cols-2 divide-x divide-y divide-border">
            {content.stats.map((stat) => (
              <li
                key={stat.label}
                className="flex flex-col items-start justify-center px-4 py-5 sm:px-5 sm:py-6"
              >
                <p className="font-heading text-2xl font-bold tracking-tight text-primary md:text-3xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs font-medium text-muted-foreground sm:text-sm">
                  {stat.label}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Pillars */}
      <section className="mb-6">
        <h2 className="mb-3 font-heading text-lg font-semibold text-foreground md:text-xl">
          What drives us
        </h2>
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
          {content.pillars.map((pillar) => {
            const Icon = PILLAR_ICONS[pillar.icon];
            return (
              <li
                key={pillar.title}
                className="rounded-sm border border-border bg-card p-4 shadow-product sm:p-5"
              >
                <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-sm bg-primary text-primary-foreground">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <h3 className="font-heading text-sm font-semibold text-foreground md:text-base">
                  {pillar.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {pillar.description}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Promises */}
      <section className="mb-6 rounded-sm border border-border bg-card p-5 shadow-product sm:p-6">
        <h2 className="font-heading text-lg font-semibold text-foreground md:text-xl">
          {content.promisesTitle}
        </h2>
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {content.promises.map((item, index) => {
            const Icon = PROMISE_ICONS[index] ?? Check;
            return (
              <li
                key={item.title}
                className="flex gap-3 rounded-sm border border-border/80 bg-secondary/25 p-3.5"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                    {item.detail}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Closing CTA */}
      <section className="relative animate-fade-in overflow-hidden rounded-sm border border-primary/25 bg-primary/5 p-5 [animation-delay:140ms] sm:p-6 md:flex md:items-center md:justify-between md:gap-6">
        <div className="max-w-xl">
          <p className="font-heading text-base font-semibold text-foreground md:text-lg">
            Ready to find your next gadget?
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse authentic products with warranty — or message us if you need
            a recommendation.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 md:mt-0 md:shrink-0">
          <Link
            href="/shop"
            className="inline-flex h-10 items-center gap-2 rounded-sm bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Browse shop
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
          <Link
            href="/contact"
            className="inline-flex h-10 items-center gap-2 rounded-sm border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Talk to support
          </Link>
        </div>
      </section>
    </div>
  );
}

export default AboutPageView;
