"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import React from "react";
import type { FAQCategory } from "./types";

type Props = {
  category: FAQCategory;
};

const FAQAccordion: React.FC<Props> = ({ category }) => {
  const defaultOpenId = category.items[0]?.id ?? "";

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultOpenId}
      className="overflow-hidden rounded-2xl border border-black/8 bg-white"
    >
      {category.items.map((it, index) => (
        <AccordionItem
          key={it.id}
          value={it.id}
          className={cn(
            "border-0 px-4 min-[768px]:px-5",
            index > 0 && "border-t border-black/6",
          )}
        >
          <AccordionTrigger
            className={cn(
              "py-4 text-left text-[15px] font-semibold tracking-tight text-[#191919] hover:no-underline min-[768px]:text-base",
              "[&>svg]:h-4 [&>svg]:w-4 [&>svg]:text-[#8A8A8A]",
            )}
          >
            {it.question}
          </AccordionTrigger>

          <AccordionContent className="pb-4 text-sm font-normal leading-6 text-[#5F5F5F] min-[768px]:pb-5">
            {it.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export default FAQAccordion;
