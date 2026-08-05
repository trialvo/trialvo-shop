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
    <section className="container mx-auto pt-11 px-1.5 pb-6 sm:pt-0 sm:px-0">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Compare" }]}
      />

      <div className="sm:mb-17.5 space-y-3">
        <div className="border-0 bg-white px-4 py-2.5 shadow-[0px_0px_10px_rgba(0,0,0,0.12)]">
          <div className="flex items-center gap-3">
            <FiGitCommit className="h-5 w-5 text-black" />
            <div>
              <h1 className="text-xl font-bold text-black">
                Compare & Plan Purchase
              </h1>
              <p className="hidden text-xs text-gray-400 sm:block">
                Compare products across variations, stock, pricing, and
                discounts
              </p>
            </div>
          </div>
        </div>

        <div className="relative bg-white p-1.5 shadow-[0px_0px_10px_rgba(0,0,0,0.06)] sm:p-2">
          <div className="grid grid-cols-2 gap-1.5">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "group relative flex min-h-[52px] w-full items-center gap-3 border px-3.5 py-2.5 text-left transition-all duration-200 sm:px-4",
                    isActive
                      ? "border-black bg-black text-white"
                      : "border-black/[0.06] bg-gray-50/50 text-black hover:bg-black/[0.02]",
                  )}
                  aria-pressed={isActive}
                >
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="inline-flex items-center gap-2 leading-none">
                      {tab.icon}
                      <span className="text-[13px] font-semibold sm:text-sm">
                        {tab.label}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "text-[11px] font-medium leading-none transition-colors duration-200",
                        isActive ? "text-white/80" : "text-gray-400",
                      )}
                    >
                      {tab.desc}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div
          className={cn(
            "transition-all duration-200 ease-out",
            animating
              ? "translate-y-1 opacity-0"
              : "translate-y-0 opacity-100",
          )}
        >
          {renderedTab === "compare" && <ProductComparator />}
          {renderedTab === "budget" && <BudgetPlanner />}
        </div>
      </div>
    </section>
  );
}
