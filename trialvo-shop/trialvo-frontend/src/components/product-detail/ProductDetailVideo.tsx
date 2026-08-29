"use client";

import { useState } from "react";
import { ExternalLink, Play } from "lucide-react";
import { Section, SectionIntro, Surface } from "@/components/section";
import { parseVideoUrl, videoProviderLabel } from "@/lib/videoEmbed";
import type { MarketplaceLanguage } from "@/types/marketplace";

export type ProductDetailVideoProps = {
  videoUrl: string;
  title: string;
  posterUrl?: string;
  language: MarketplaceLanguage;
};

/**
 * Demo video band. The provider iframe is mounted only after the poster is
 * clicked, so a YouTube embed never costs the page its initial load.
 */
export function ProductDetailVideo({
  videoUrl,
  title,
  posterUrl,
  language,
}: Readonly<ProductDetailVideoProps>) {
  const [playing, setPlaying] = useState(false);
  const parsed = parseVideoUrl(videoUrl);
  if (!parsed) return null;

  const poster = parsed.thumbnailUrl || posterUrl;
  const providerLabel = videoProviderLabel(parsed.provider);
  const isFile = parsed.provider === "file";

  return (
    <Section id="demo-video" labelledBy="demo-video-title" tone="muted" divider="both">
      <SectionIntro
        id="demo-video-title"
        eyebrow={language === "bn" ? "ডেমো ভিডিও" : "Demo video"}
        title={language === "bn" ? "চলুন, চালু অবস্থায় দেখুন" : "See it in motion"}
        lead={
          language === "bn"
            ? "শপ ও অ্যাডমিন প্যানেল কীভাবে কাজ করে — ভিডিওতে এক নজরে।"
            : "A quick walkthrough of the storefront and the admin panel."
        }
      />

      <Surface sheen className="overflow-hidden">
        <div className="relative aspect-video bg-muted">
          {isFile ? (
            <video
              src={parsed.embedUrl}
              controls
              playsInline
              preload="metadata"
              poster={posterUrl}
              className="h-full w-full"
              title={title}
            >
              <track kind="captions" />
            </video>
          ) : playing ? (
            <iframe
              src={`${parsed.embedUrl}&autoplay=1`}
              title={title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="group absolute inset-0 h-full w-full"
              aria-label={
                language === "bn" ? "ভিডিও চালু করুন" : `Play the video on ${providerLabel}`
              }
            >
              {poster ? (
                <img
                  src={poster}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              ) : null}
              <span className="absolute inset-0 bg-foreground/25 transition-colors group-hover:bg-foreground/35" />
              <span className="absolute left-1/2 top-1/2 inline-flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-accent-glow transition-transform duration-200 group-hover:scale-105">
                <Play className="ml-0.5 h-6 w-6 fill-current" aria-hidden="true" />
              </span>
            </button>
          )}
        </div>
      </Surface>

      {!isFile ? (
        <p className="mt-4 text-sm text-muted-foreground">
          <a
            href={parsed.watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-medium underline decoration-border underline-offset-4 transition-colors hover:text-accent-strong hover:decoration-accent/50"
          >
            {language === "bn"
              ? `${providerLabel}-এ দেখুন`
              : `Watch on ${providerLabel}`}
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </p>
      ) : null}
    </Section>
  );
}

export default ProductDetailVideo;
