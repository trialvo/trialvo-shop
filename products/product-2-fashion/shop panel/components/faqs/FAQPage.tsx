"use client";

import Breadcrumbs from "@/components/breadcrumb/Breadcrumbs";
import Link from "next/link";
import * as React from "react";
import FAQAccordion from "./FAQAccordion";
import FAQCategoryNav from "./FAQCategoryNav";
import { FAQ_CATEGORIES } from "./faqs.data";

const FAQPage: React.FC = () => {
  const [activeId, setActiveId] = React.useState<string>(FAQ_CATEGORIES[0]?.id ?? "");

  const activeCategory =
    FAQ_CATEGORIES.find((c) => c.id === activeId) ?? FAQ_CATEGORIES[0];

  return (
    <section className="container mx-auto px-3 pb-16 pt-2 min-[768px]:px-0 min-[768px]:pb-20 min-[768px]:pt-0">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "FAQ's" }]} />

      <div className="mt-1 min-[768px]:mt-2">
        <h1 className="text-[26px] font-bold leading-none tracking-[-0.02em] text-[#191919] min-[768px]:text-[32px]">
          FAQ&apos;s
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#5F5F5F]">
          Answers about payment, delivery, returns, orders, and products — pick a
          topic to get started.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 min-[768px]:mt-8 min-[768px]:grid-cols-[240px_minmax(0,1fr)] min-[768px]:gap-10 min-[992px]:grid-cols-[260px_minmax(0,1fr)]">
        <FAQCategoryNav
          categories={FAQ_CATEGORIES}
          activeId={activeId}
          onChange={setActiveId}
        />

        <div className="min-w-0">
          <div className="mb-4 flex items-end justify-between gap-3 border-b border-black/6 pb-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8A8A8A]">
                Topic
              </p>
              <h2 className="mt-1 truncate text-lg font-semibold tracking-tight text-[#191919] min-[768px]:text-xl">
                {activeCategory.label}
              </h2>
            </div>
            <p className="shrink-0 text-xs font-medium text-[#8A8A8A]">
              {activeCategory.items.length}{" "}
              {activeCategory.items.length === 1 ? "question" : "questions"}
            </p>
          </div>

          <FAQAccordion key={activeCategory.id} category={activeCategory} />

          <div className="mt-8 rounded-2xl bg-[#F7F4EE] px-4 py-5 min-[768px]:px-6 min-[768px]:py-6">
            <p className="text-[15px] font-semibold tracking-tight text-[#191919]">
              Still need help?
            </p>
            <p className="mt-1 max-w-md text-sm leading-relaxed text-[#5F5F5F]">
              Our team can help with orders, sizing, and delivery questions.
            </p>
            <Link
              href="/contact-us"
              className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-[#191919] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-black"
            >
              Contact us
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQPage;
