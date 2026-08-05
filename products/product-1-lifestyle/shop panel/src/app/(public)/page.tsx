"use client";

import BannerSlider from "@/components/home/BannerSlider";
import CategoryShowcase from "@/components/home/CategoryShowcase";
import DealsStrip from "@/components/home/DealsStrip";
import FlashDeals from "@/components/home/FlashDeals";
import NewArrivals from "@/components/home/NewArrivals";
import PromoBanner from "@/components/home/PromoBanner";
import TopCategories from "@/components/home/TopCategories";

export default function HomePage() {
  return (
    <>
      <BannerSlider />

      <DealsStrip />

      <FlashDeals />

      <TopCategories />

      <NewArrivals />

      <CategoryShowcase />

      <PromoBanner />
    </>
  );
}
