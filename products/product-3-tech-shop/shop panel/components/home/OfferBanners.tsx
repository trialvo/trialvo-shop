"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useBanners } from "@/hooks/useBanners";
import { toOfferBanner } from "@/lib/adapters/banner";
import type { Banner } from "@/lib/api/banner/service";
import { RightArrowIcon } from "@/components/shared/RightArrowIcon";

function pickOfferSource(banners: Banner[]): Banner[] {
  const middle = banners.filter((b) => b.zone === "Home Middle");
  if (middle.length > 0) return middle;

  const campaign = banners.filter((b) => b.zone === "Campaign");
  if (campaign.length > 0) return campaign;

  return banners.filter((b) => b.zone === "Home Top").slice(0, 2);
}

const OfferBanners = () => {
  const { banners, bannersLoading } = useBanners({ limit: 20 });

  const offers = useMemo(
    () => pickOfferSource(banners).slice(0, 2).map(toOfferBanner),
    [banners],
  );

  if (bannersLoading) {
    return (
      <section className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="min-h-[160px] md:min-h-[200px] rounded-sm bg-secondary animate-pulse" />
          <div className="min-h-[160px] md:min-h-[200px] rounded-sm bg-secondary animate-pulse" />
        </div>
      </section>
    );
  }

  if (offers.length === 0) return null;

  return (
    <section className="container py-12 md:py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {offers.map((offer) => (
          <Link
            key={offer.id}
            href={offer.link}
            className={`group relative overflow-hidden rounded-sm p-6 md:p-10 min-h-[160px] md:min-h-[200px] flex flex-col justify-end ${
              offer.variant === "primary" ? "gradient-primary" : "gradient-accent"
            }`}
          >
            <div className="absolute inset-0 opacity-25">
              <img
                src={offer.image}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            </div>
            <div className="relative z-10">
              <span
                className={`text-xs font-medium uppercase tracking-wider ${
                  offer.variant === "primary"
                    ? "text-primary-foreground/70"
                    : "text-accent-foreground/80"
                }`}
              >
                {offer.eyebrow}
              </span>
              <h3
                className={`font-heading text-xl md:text-3xl font-bold mt-1 ${
                  offer.variant === "primary"
                    ? "text-primary-foreground"
                    : "text-accent-foreground"
                }`}
              >
                {offer.title}
              </h3>
              <p
                className={`mt-1 text-xs md:text-sm ${
                  offer.variant === "primary"
                    ? "text-primary-foreground/70"
                    : "text-accent-foreground/80"
                }`}
              >
                {offer.subtitle}
              </p>
              <span
                className={`inline-flex items-center gap-1.5 mt-3 text-sm font-medium ${
                  offer.variant === "primary"
                    ? "text-primary-foreground"
                    : "text-accent-foreground"
                }`}
              >
                {offer.cta}
                <RightArrowIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default OfferBanners;
