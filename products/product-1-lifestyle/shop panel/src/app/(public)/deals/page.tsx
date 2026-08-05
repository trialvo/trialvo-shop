"use client";

import { useState } from "react";
import { DealsContentGrid, DealsTabSwitcher } from "@/components/deals";
import { useDeals } from "@/hooks/useDeals";

type TabType = "bulk" | "combo";

export default function DealsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("bulk");
  const {
    bulkOffers,
    comboDeals,
    isLoading,
    isError,
    refetch,
  } = useDeals();

  return (
    <div>
      {/* Hero */}
      <div className="bg-primary text-primary-foreground py-8 lg:py-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-accent/10 via-transparent to-accent/10" />
        <div className="relative z-10">
          <h1 className="font-display text-3xl lg:text-5xl font-bold tracking-tight">
            Bulk &amp; Combo Deals
          </h1>
          <p className="text-sm lg:text-base font-light mt-2 text-primary-foreground/70">
            Save big with curated bulk offers and combo bundles
          </p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8">
        <DealsTabSwitcher
          activeTab={activeTab}
          bulkOffers={bulkOffers}
          comboDeals={comboDeals}
          onTabChange={setActiveTab}
        />
      </div>

      {/* Content grid */}
      <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <DealsContentGrid
          activeTab={activeTab}
          bulkOffers={bulkOffers}
          comboDeals={comboDeals}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => void refetch()}
        />
      </div>
    </div>
  );
}
