"use client";

import React from "react";
import AboutSectionHeader from "./AboutSectionHeader";
import TestimonialRow from "./TestimonialRow";
import type { TestimonialItem } from "./types";

type Props = {
  kicker: string;
  items: TestimonialItem[];
};

const AboutTestimonials: React.FC<Props> = ({ kicker, items }) => {
  return (
    <section className="space-y-10">
      <AboutSectionHeader kicker={kicker} />

      <div className="space-y-16">
        {items.map((it, idx) => (
          <TestimonialRow
            key={it.id}
            item={it}
            isLast={idx === items.length - 1}
          />
        ))}
      </div>
    </section>
  );
};

export default AboutTestimonials;
