"use client";

import { Card, CardContent } from "@/components/ui/card";
import React from "react";
import Breadcrumbs from "../breadcrumb/Breadcrumbs";
import AboutFeatures from "./AboutFeatures";
import AboutHeroSplit from "./AboutHeroSplit";
import AboutTestimonials from "./AboutTestimonials";
import { ABOUT_FEATURES, ABOUT_HERO, ABOUT_TESTIMONIALS } from "./about.data";

const AboutPage: React.FC = () => {
  return (
    <div className="container mx-auto pb-10 max-[500px]:px-2 max-[500px]:pt-2">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "About Us" }]} />

      <Card className="rounded-none border-transparent shadow-transparent pt-4">
        <CardContent className="p-0">
          <div className="space-y-16 sm:space-y-28">
            <AboutHeroSplit content={ABOUT_HERO} />

            <AboutFeatures kicker={ABOUT_FEATURES.kicker} title={ABOUT_FEATURES.title} items={ABOUT_FEATURES.items} />

            <AboutTestimonials
              kicker={ABOUT_TESTIMONIALS.kicker}
              items={ABOUT_TESTIMONIALS.items}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AboutPage;
