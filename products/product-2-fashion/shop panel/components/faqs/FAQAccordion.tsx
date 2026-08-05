"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import React from "react";
import type { FAQCategory } from "./types";

type Props = {
  category: FAQCategory;
};

const FAQAccordion: React.FC<Props> = ({ category }) => {
  const defaultOpenId =
    category.id === "payment" ? "q2" : category.items[0]?.id ?? "";

  return (
    <div className="w-full col-span-12 sm:col-span-9">
      <Accordion type="single" collapsible defaultValue={defaultOpenId}>
        <div className="space-y-3">
          {category.items.map((it) => (
            <AccordionItem
              key={it.id}
              value={it.id}
              className="rounded-none border-0 shadow-[0px_0px_12px_rgba(0,0,0,0.12)] gap-0 px-4"
            >
              <AccordionTrigger className="text-left text-base font-medium text-black hover:no-underline py-3 cursor-pointer">
                {it.question}
              </AccordionTrigger>

              <AccordionContent className="pb-6 pt-0 text-sm font-normal leading-6 text-[#6E6B7B]">
                {it.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </div>
      </Accordion>
    </div>
  );
};

export default FAQAccordion;
