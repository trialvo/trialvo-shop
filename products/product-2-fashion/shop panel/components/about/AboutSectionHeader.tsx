"use client";

import { cn } from "@/lib/utils";
import React from "react";

type Props = {
  kicker: string;
  title?: string;
  className?: string;
};

const AboutSectionHeader: React.FC<Props> = ({ kicker, title, className }) => {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="h-1 w-12 rounded-[6px] bg-[#A8AAAE]" />

      <p
        className={cn(
          "text-lg font-bold uppercase text-black",
          "tracking-[0.32em]",
          "whitespace-pre-line",
        )}
      >
        {kicker}
      </p>

      <h2 className="whitespace-pre-line text-[28px] font-bold leading-[1.15] text-black sm:text-[34px]">
        {title}
      </h2>
    </div>
  );
};

export default AboutSectionHeader;
