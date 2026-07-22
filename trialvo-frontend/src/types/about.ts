import type { LucideIcon } from "lucide-react";
import type { LocalizedString } from "@/types/marketplace";

export type AboutSeoCopy = {
  title: string;
  description: string;
  keywords: string[];
};

export type AboutHeroContent = {
  eyebrow: LocalizedString;
  title: LocalizedString;
  supporting: LocalizedString;
  primaryCta: LocalizedString;
  secondaryCta: LocalizedString;
  /** Full-bleed banner background */
  image: {
    src: string;
    alt: LocalizedString;
  };
};

export type AboutStoryContent = {
  eyebrow: LocalizedString;
  title: LocalizedString;
  paragraphs: LocalizedString[];
};

export type AboutValueId = "mission" | "vision" | "service" | "quality";

export type AboutValueItem = {
  id: AboutValueId;
  icon: LucideIcon;
  title: LocalizedString;
  description: LocalizedString;
};

export type AboutHighlightId =
  | "products"
  | "trial"
  | "delivery"
  | "support";

export type AboutHighlightItem = {
  id: AboutHighlightId;
  icon: LucideIcon;
  /** Static label; value may be injected dynamically (e.g. product count) */
  label: LocalizedString;
  /** Fallback display when dynamic value is unavailable */
  fallbackValue: string;
};

export type AboutPrincipleItem = {
  id: string;
  step: number;
  title: LocalizedString;
  description: LocalizedString;
};

export type AboutCtaContent = {
  title: LocalizedString;
  supporting: LocalizedString;
  primaryCta: LocalizedString;
  secondaryCta: LocalizedString;
};

export type AboutPageContent = {
  seo: Record<"bn" | "en", AboutSeoCopy>;
  hero: AboutHeroContent;
  story: AboutStoryContent;
  values: AboutValueItem[];
  highlights: AboutHighlightItem[];
  principles: AboutPrincipleItem[];
  cta: AboutCtaContent;
};

export type AboutHighlightViewModel = {
  id: AboutHighlightId;
  icon: LucideIcon;
  value: string;
  label: string;
};
