import type { Banner } from "@/lib/api/banner/service";
import { resolveMediaUrl } from "@/lib/media/url";
import { sanitizeAppHref } from "@/lib/security/url";

export type HeroSlideViewModel = {
  id: number;
  title: string;
  subtitle: string;
  cta: string;
  link: string;
  image: string;
};

export type SideBannerViewModel = {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  bg: string;
};

export type OfferBannerViewModel = {
  id: number;
  eyebrow: string;
  title: string;
  subtitle: string;
  cta: string;
  link: string;
  image: string;
  variant: "primary" | "accent";
};

const SIDE_GRADIENTS = [
  "from-rose-500 to-orange-400",
  "from-sky-500 to-blue-500",
] as const;

/** Avoid showing raw enum values like "Home Top" / "Default" as UI copy. */
function friendlyBannerSubtitle(
  banner: Banner,
  fallback: string,
): string {
  const type = (banner.type || "").trim();
  if (type && type !== "Default" && type !== "Custom URL") return type;
  return fallback;
}

export function toHeroSlide(banner: Banner): HeroSlideViewModel {
  return {
    id: banner.id,
    title: banner.title,
    subtitle: friendlyBannerSubtitle(banner, "Limited time offer"),
    cta: "Shop Now",
    link: sanitizeAppHref(banner.path),
    image: resolveMediaUrl(banner.img_path),
  };
}

export function toSideBanner(
  banner: Banner,
  index: number,
): SideBannerViewModel {
  return {
    id: banner.id,
    title: banner.title,
    subtitle: friendlyBannerSubtitle(banner, "Special offer"),
    image: resolveMediaUrl(banner.img_path),
    link: sanitizeAppHref(banner.path),
    bg: SIDE_GRADIENTS[index % SIDE_GRADIENTS.length],
  };
}

export function toOfferBanner(
  banner: Banner,
  index: number,
): OfferBannerViewModel {
  return {
    id: banner.id,
    eyebrow: index === 0 ? "Special Offer" : "New Collection",
    title: banner.title,
    subtitle: friendlyBannerSubtitle(banner, "Explore exclusive deals"),
    cta: index === 0 ? "Shop Now" : "Explore",
    link: sanitizeAppHref(banner.path),
    image: resolveMediaUrl(banner.img_path),
    variant: index % 2 === 0 ? "primary" : "accent",
  };
}

/**
 * Splits Home Top banners into carousel slides and side panels
 * without duplicating when enough items exist.
 */
export function splitHeroBanners(banners: Banner[]): {
  slides: HeroSlideViewModel[];
  sideBanners: SideBannerViewModel[];
} {
  if (banners.length === 0) {
    return { slides: [], sideBanners: [] };
  }

  if (banners.length >= 4) {
    const sideSource = banners.slice(-2);
    const slideSource = banners.slice(0, -2);
    return {
      slides: slideSource.map(toHeroSlide),
      sideBanners: sideSource.map(toSideBanner),
    };
  }

  return {
    slides: banners.map(toHeroSlide),
    sideBanners: banners.slice(0, 2).map(toSideBanner),
  };
}
