"use client";

import { Layers, Package } from "lucide-react";
import type { BulkOffer, ComboDeal } from "@/types";

type TabType = "bulk" | "combo";

interface DealsTabSwitcherProps {
  activeTab: TabType;
  bulkOffers: BulkOffer[];
  comboDeals: ComboDeal[];
  onTabChange: (tab: TabType) => void;
}

export function DealsTabSwitcher({
  activeTab,
  bulkOffers,
  comboDeals,
  onTabChange,
}: DealsTabSwitcherProps) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div>
        <h2 className="text-xl font-bold text-foreground">
          {activeTab === "bulk" ? "Bulk Offers" : "Combo Deals"}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {activeTab === "bulk"
            ? `${bulkOffers.length} curated bulk offers`
            : `${comboDeals.length} curated combo deals`}
        </p>
      </div>
      <div className="flex border border-border rounded-lg overflow-hidden w-full sm:w-auto">
        <TabButton
          active={activeTab === "bulk"}
          icon={<Layers size={15} className="shrink-0" />}
          labelFull="Bulk Offers"
          labelShort="Bulk"
          count={bulkOffers.length}
          onClick={() => onTabChange("bulk")}
        />
        <TabButton
          active={activeTab === "combo"}
          icon={<Package size={15} className="shrink-0" />}
          labelFull="Combo Deals"
          labelShort="Combo"
          count={comboDeals.length}
          onClick={() => onTabChange("combo")}
        />
      </div>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  icon: React.ReactNode;
  labelFull: string;
  labelShort: string;
  count: number;
  onClick: () => void;
}

function TabButton({ active, icon, labelFull, labelShort, count, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 text-[10px] sm:text-xs font-medium tracking-wider uppercase transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-background text-muted-foreground hover:bg-secondary"
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{labelFull}</span>
      <span className="sm:hidden">{labelShort}</span>
      ({count})
    </button>
  );
}
