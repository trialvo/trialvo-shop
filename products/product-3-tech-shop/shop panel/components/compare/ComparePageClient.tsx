"use client";

import {
  useCallback,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { DollarSign, GitCompare } from "lucide-react";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import BudgetPlanner from "@/components/compare/BudgetPlanner";
import ProductComparator from "@/components/compare/ProductComparator";
import { cn } from "@/lib/utils";

type TabId = "compare" | "budget";

type TabConfig = Readonly<{
  id: TabId;
  label: string;
  shortLabel: string;
  icon: ReactNode;
  desc: string;
}>;

const TABS: TabConfig[] = [
  {
    id: "compare",
    label: "Product Compare",
    shortLabel: "Compare",
    icon: <GitCompare className="h-4 w-4" />,
    desc: "Side-by-side specs",
  },
  {
    id: "budget",
    label: "Budget Planner",
    shortLabel: "Budget",
    icon: <DollarSign className="h-4 w-4" />,
    desc: "Shop within budget",
  },
];

/**
 * Compare page shell — one visual composition for hero + mode switch.
 */
export function ComparePageClient(): ReactElement {
  const [activeTab, setActiveTab] = useState<TabId>("compare");
  const [animating, setAnimating] = useState(false);
  const activeIndex = TABS.findIndex((t) => t.id === activeTab);

  const handleTabChange = useCallback(
    (tab: TabId) => {
      if (tab === activeTab) return;
      setAnimating(true);
      window.setTimeout(() => {
        setActiveTab(tab);
        requestAnimationFrame(() => setAnimating(false));
      }, 140);
    },
    [activeTab],
  );

  return (
    <section className="container py-4 md:py-6 pb-24">
      <Breadcrumbs items={[{ label: "Compare" }]} />

      <div className="mt-3 space-y-5">
        {/* Single composition: stage + tabs */}
        <div className="relative overflow-hidden rounded-sm border border-border shadow-product-hover compare-stage animate-compare-pop">
          <div
            aria-hidden
            className="compare-grid-mask pointer-events-none absolute inset-0"
          />

          <div className="relative px-4 pb-3 pt-5 sm:px-6 sm:pt-6">
            <div className="flex max-w-2xl flex-col gap-3">
              <p className="inline-flex w-fit items-center gap-2 rounded-sm border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                Decision lab
              </p>
              <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Compare products.
                <span className="mt-1 block text-primary sm:mt-0 sm:inline sm:before:content-['\00a0']">
                  Plan the purchase.
                </span>
              </h1>
              <p className="max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                Two clear tools — pick the mode that matches how you shop today.
              </p>
            </div>
          </div>

          {/* Segmented control with sliding indicator */}
          <div className="relative px-3 pb-3 sm:px-4 sm:pb-4">
            <div
              className="relative grid grid-cols-2 gap-1 rounded-sm border border-border/80 bg-card/70 p-1 backdrop-blur-sm"
              role="tablist"
              aria-label="Compare tools"
            >
              <div
                aria-hidden
                className="compare-tab-indicator absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-sm bg-primary shadow-product"
                style={{
                  transform: `translateX(${activeIndex * 100}%)`,
                }}
              />
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    id={`compare-tab-${tab.id}`}
                    aria-controls={`compare-panel-${tab.id}`}
                    aria-selected={isActive}
                    onClick={() => handleTabChange(tab.id)}
                    className={cn(
                      "relative z-10 flex min-h-[56px] cursor-pointer items-center gap-2.5 rounded-sm px-3 py-2.5 text-left transition-colors duration-200 sm:gap-3 sm:px-4",
                      isActive
                        ? "text-primary-foreground"
                        : "text-foreground hover:text-primary",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-sm transition-colors",
                        isActive
                          ? "bg-primary-foreground/15"
                          : "bg-secondary text-primary",
                      )}
                    >
                      {tab.icon}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold sm:text-sm">
                        <span className="sm:hidden">{tab.shortLabel}</span>
                        <span className="hidden sm:inline">{tab.label}</span>
                      </span>
                      <span
                        className={cn(
                          "mt-0.5 block text-[11px] font-medium",
                          isActive
                            ? "text-primary-foreground/75"
                            : "text-muted-foreground",
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
        </div>

        <div
          className={cn(
            "transition-all duration-200 ease-out",
            animating ? "translate-y-1.5 opacity-0" : "translate-y-0 opacity-100",
          )}
        >
          <div
            id="compare-panel-compare"
            role="tabpanel"
            aria-labelledby="compare-tab-compare"
            hidden={activeTab !== "compare"}
          >
            <ProductComparator />
          </div>
          <div
            id="compare-panel-budget"
            role="tabpanel"
            aria-labelledby="compare-tab-budget"
            hidden={activeTab !== "budget"}
          >
            <BudgetPlanner />
          </div>
        </div>
      </div>
    </section>
  );
}

export default ComparePageClient;
