"use client";

import { Card } from "@/components/ui/card";
import ImageWithFallback from "@/components/common/ImageWithFallback";
import React from "react";
import AboutSectionHeader from "./AboutSectionHeader";
import type { AboutHeroContent } from "./types";

type Props = {
  content: AboutHeroContent;
};

const AboutHeroSplit: React.FC<Props> = ({ content }) => {
  return (
    <section className="grid items-start gap-10 sm:grid-cols-2 sm:gap-14">
      {/* LEFT */}
      <div className="space-y-7">
        <AboutSectionHeader kicker={content.whoWeAreKicker} title={content.whoWeAreTitle} />

        <Card
          className={[
            "relative overflow-hidden p-0 rounded-md border-0 shadow-[20px_20px_10px_rgba(0,0,0,0.18)]",
            "w-full h-72",
            "sm:h-90 sm:w-120.25",
            "md:h-137.5",
          ].join(" ")}
        >
          <div className="relative h-full w-full bg-[#f1f1f1]">
            <ImageWithFallback
              src={content.image.src}
              alt={content.image.alt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 520px"
              preload
            />
          </div>
        </Card>
      </div>

      {/* RIGHT */}
      <div className="space-y-6">
        <p className="text-sm leading-6 text-black/80">{content.whoWeAreBody}</p>

        <div className="pt-2">
          <AboutSectionHeader kicker={content.whatWeDoKicker} title={content.whatWeDoTitle} />
        </div>

        <p className="text-sm leading-6 text-black/80">{content.whatWeDoBody}</p>

        {Array.isArray(content.operations) && content.operations.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-black">
              {content.operationsTitle ?? "Our operations include"}
            </p>

            <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-black/80">
              {content.operations.map((it, idx) => (
                <li key={`${it}-${idx}`}>{it}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {content.whatWeDoFooter ? (
          <p className="text-sm leading-6 text-black/80">{content.whatWeDoFooter}</p>
        ) : null}
      </div>
    </section>
  );
};

export default AboutHeroSplit;
