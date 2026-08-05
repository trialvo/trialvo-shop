"use client";

import { Headphones, RotateCcw, Shield, Truck, type LucideIcon } from "lucide-react";
import { ICON_CONTAINER_CLASSES } from "@/lib/theme";

interface Feature {
  icon: LucideIcon;
  title: string;
  desc: string;
  color: string;
  bg: string;
}

const features: Feature[] = [
  { icon: Truck, title: "Free Shipping", desc: "On orders over $150", color: "text-feature-shipping", bg: "bg-feature-shipping/10" },
  { icon: RotateCcw, title: "Easy Returns", desc: "30-day hassle-free policy", color: "text-feature-returns", bg: "bg-feature-returns/10" },
  { icon: Shield, title: "Secure Payment", desc: "100% protected checkout", color: "text-accent", bg: "bg-accent/10" },
  { icon: Headphones, title: "24/7 Support", desc: "Dedicated help centre", color: "text-feature-support", bg: "bg-feature-support/10" },
];

function FeatureCard({ f, compact = false }: { f: Feature; compact?: boolean }) {
  return (
    <div className={`flex items-center gap-3 shrink-0 ${compact ? "py-3 px-1" : ""}`}>
      <div className={`w-9 h-9 ${ICON_CONTAINER_CLASSES} ${f.bg}`}>
        <f.icon size={16} strokeWidth={1.75} className={f.color} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-[12.5px] font-semibold text-foreground tracking-wide leading-tight whitespace-nowrap">
          {f.title}
        </p>
        <p className="text-[11px] text-muted-foreground tracking-wide mt-0.5 leading-tight whitespace-nowrap">
          {f.desc}
        </p>
      </div>
    </div>
  );
}

function Dot() {
  return <span aria-hidden="true" className="shrink-0 w-1 h-1 rounded-full bg-border/60 mx-4 self-center" />;
}

const DealsStrip = () => (
  <section
    aria-label="Shopping benefits"
    className="w-full bg-background border-y border-border/50"
  >
    <div className="md:hidden overflow-hidden py-3">
      <div
        className="flex w-max"
        style={{ animation: "var(--animate-marquee)" }}
        aria-hidden="true"
      >
        {features.map((f) => (
          <div key={`a-${f.title}`} className="flex items-center">
            <FeatureCard f={f} compact />
            <Dot />
          </div>
        ))}
        {features.map((f) => (
          <div key={`b-${f.title}`} className="flex items-center">
            <FeatureCard f={f} compact />
            <Dot />
          </div>
        ))}
      </div>
    </div>

    <div className="hidden md:block max-w-[1400px] mx-auto px-6 lg:px-8 py-5 lg:py-6">
      <ul role="list" className="grid grid-cols-4 divide-x divide-border/50">
        {features.map((f) => (
          <li key={f.title} className="flex items-center gap-3.5 px-6 lg:px-8 first:pl-0 last:pr-0">
            <div className={`w-10 h-10 ${ICON_CONTAINER_CLASSES} ${f.bg}`}>
              <f.icon size={18} strokeWidth={1.75} className={f.color} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-foreground tracking-wide leading-tight">{f.title}</p>
              <p className="text-[11px] text-muted-foreground tracking-wide mt-0.5 leading-tight">{f.desc}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  </section>
);

export default DealsStrip;
