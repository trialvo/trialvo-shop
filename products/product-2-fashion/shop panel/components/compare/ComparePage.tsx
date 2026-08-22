"use client";

import * as React from "react";
import Breadcrumbs from "@/components/breadcrumb/Breadcrumbs";
import { FiGitCommit, FiDollarSign } from "react-icons/fi";
import { cn } from "@/lib/utils";
import BudgetPlanner from "./BudgetPlanner";
import ProductComparator from "./ProductComparator";

type Tab = "compare" | "budget";

type TabConfig = {
  id: Tab;
  label: string;
  icon: React.ReactNode;
  desc: string;
};

const TABS: TabConfig[] = [
  {
    id: "compare",
    label: "Product Compare",
    icon: <FiGitCommit className="h-4 w-4" />,
    desc: "Side-by-side details",
  },
  {
    id: "budget",
    label: "Budget Planner",
    icon: <FiDollarSign className="h-4 w-4" />,
    desc: "Affordability with discounts",
  },
];

export default function ComparePage() {
  const [activeTab, setActiveTab] = React.useState<Tab>("compare");
  const [animating, setAnimating] = React.useState(false);
  const [renderedTab, setRenderedTab] = React.useState<Tab>("compare");

  const handleTabChange = React.useCallback(
    (tab: Tab) => {
      if (tab === activeTab) return;
      setAnimating(true);
      setTimeout(() => {
        setActiveTab(tab);
        setRenderedTab(tab);
        requestAnimationFrame(() => {
          setAnimating(false);
        });
      }, 150);
    },
    [activeTab],
  );

  return (
    <section className="container mx-auto px-3 pb-16 pt-11 min-[768px]:px-0 min-[768px]:pb-20 min-[768px]:pt-0">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Compare" }]} />

      <div className="mt-1 min-[768px]:mt-2">
        <h1 className="text-[26px] font-bold leading-none tracking-[-0.02em] text-[#191919] min-[768px]:text-[32px]">
          Compare
        </h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#5F5F5F]">
          Put two products side by side, or plan how many pieces your budget can buy.
        </p>
      </div>

      <div className="sticky top-[var(--shop-header-offset,72px)] z-20 mt-5 bg-white/95 py-2 backdrop-blur-sm transition-[top] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]">
        <div className="grid grid-cols-2 rounded-xl bg-[#F3F1ED] p-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-2 text-center transition-colors min-[768px]:flex-row min-[768px]:gap-2.5 min-[768px]:px-4",
                  isActive
                    ? "bg-white text-[#191919] shadow-[0_2px_10px_rgba(20,16,12,0.08)]"
                    : "text-[#666] hover:text-[#191919]",
                )}
                aria-pressed={isActive}
              >
                <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold min-[768px]:text-sm">
                  {tab.icon}
                  {tab.label}
                </span>
                <span
                  className={cn(
                    "hidden text-[11px] font-medium min-[768px]:inline",
                    isActive ? "text-[#8A8A8A]" : "text-[#A0A0A0]",
                  )}
                >
                  {tab.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        className={cn(
          "mt-4 transition-all duration-200 ease-out min-[768px]:mt-5",
          animating ? "translate-y-1 opacity-0" : "translate-y-0 opacity-100",
        )}
      >
        {renderedTab === "compare" && <ProductComparator />}
        {renderedTab === "budget" && <BudgetPlanner />}
      </div>
    </section>
  );
}
