"use client";

import React from "react";
import AboutSectionHeader from "./AboutSectionHeader";
import FeatureItem from "./FeatureItem";
import type { FeatureItemData } from "./types";

type Props = {
  kicker: string;
  title: string;
  items: FeatureItemData[];
};

const AboutFeatures: React.FC<Props> = ({ kicker, title, items }) => {
  return (
    <section className="space-y-10">
      <AboutSectionHeader kicker={kicker} title={title} />

      <div className="grid gap-10 md:grid-cols-3 md:gap-16">
        {items.map((it) => (
          <FeatureItem key={it.id} item={it} />
        ))}
      </div>
    </section>
  );
};

export default AboutFeatures;
