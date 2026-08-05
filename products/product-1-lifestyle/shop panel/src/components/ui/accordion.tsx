"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionItem {
  q: string;
  a: string;
}

interface AccordionProps {
  items: AccordionItem[];
  className?: string;
}

function AccordionRow({ q, a }: AccordionItem) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-4 py-4 text-left cursor-pointer group"
      >
        <span className={cn(
          "text-[14px] font-semibold transition-colors duration-150",
          open ? "text-accent" : "text-foreground group-hover:text-accent"
        )}>
          {q}
        </span>
        <ChevronDown
          size={15}
          className={cn(
            "text-muted-foreground shrink-0 transition-transform duration-300",
            open && "rotate-180"
          )}
        />
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <p className="text-[13px] text-muted-foreground leading-[1.85] pb-4 pr-6">
            {a}
          </p>
        </div>
      </div>
    </div>
  );
}

export function Accordion({ items, className }: AccordionProps) {
  return (
    <div className={cn("", className)}>
      {items.map((item) => (
        <AccordionRow key={item.q} q={item.q} a={item.a} />
      ))}
    </div>
  );
}
