"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import ImageWithFallback from "@/components/common/ImageWithFallback";
import React from "react";
import type { TestimonialItem } from "./types";

type Props = {
  item: TestimonialItem;
  isLast?: boolean;
};

const TestimonialRow: React.FC<Props> = ({ item, isLast = false }) => {
  const isLeftImage = (item.imageSide ?? "right") === "left";

  const bodyArr = Array.isArray(item.body) ? item.body : item.body ? [item.body] : [];

  return (
    <div className={cn("grid items-start gap-10 sm:grid-cols-2 sm:gap-14")}>
      <div className={cn(isLeftImage ? "order-1" : "order-2")}>
        <Card className="relative overflow-hidden rounded-xl border-0 p-0 shadow-[0px_14px_30px_rgba(0,0,0,0.12)]">
          <div
            className={cn(
              "relative w-full bg-[#f1f1f1]",
              isLast ? "aspect-[4/5] sm:aspect-[13/16]" : "aspect-[16/8]",
            )}
          >
            <ImageWithFallback
              src={item.image.src}
              alt={item.image.alt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 300px"
            />
          </div>
        </Card>
      </div>

      <div className={cn(isLeftImage ? "order-2" : "order-1")}>
        <div className="space-y-3">
          {isLast ? (
            <div className="space-y-4">
              <div className="h-1 w-12 rounded-[6px] bg-[#A8AAAE]" />
              <p className="text-lg font-bold uppercase tracking-[0.32em] text-black">
                OUR LEADERSHIP
              </p>
            </div>
          ) : null}

          {item.name ? (
            <div className="space-y-1">
              <h3 className="text-[24px] font-bold text-black">{item.name}</h3>
              {item.role ? (
                <p className="text-base font-semibold text-black/80">{item.role}</p>
              ) : null}
            </div>
          ) : null}

          {item.title?.trim() ? (
            <h3 className="text-[24px] font-bold text-black">{item.title}</h3>
          ) : null}

          {bodyArr.length ? (
            <div className="space-y-4">
              {bodyArr.map((p, idx) => (
                <p key={idx} className="text-sm leading-6 text-black/80">
                  {p}
                </p>
              ))}
            </div>
          ) : null}

          {Array.isArray(item.bullets) && item.bullets.length ? (
            <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-black/80">
              {item.bullets.map((b, idx) => (
                <li key={`${b}-${idx}`}>{b}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default TestimonialRow;
