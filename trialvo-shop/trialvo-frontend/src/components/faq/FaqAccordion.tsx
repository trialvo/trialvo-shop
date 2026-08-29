import { Plus } from "lucide-react";
import type { FaqEntry } from "@/lib/content/faq";

/**
 * Native `<details>` rather than a JS accordion: the answer text stays in the
 * server-rendered HTML whether or not the item is open, so it is always
 * crawlable and matches the FAQPage structured data.
 */
export function FaqAccordion({
  entries,
  defaultOpenFirst = false,
}: Readonly<{ entries: FaqEntry[]; defaultOpenFirst?: boolean }>) {
  return (
    <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
      {entries.map((entry, index) => (
        <details
          key={entry.id}
          id={entry.id}
          open={defaultOpenFirst && index === 0}
          className="group scroll-mt-28"
        >
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/40 [&::-webkit-details-marker]:hidden">
            <h3 className="font-display text-[15px] font-bold leading-6 tracking-tight text-foreground">
              {entry.question}
            </h3>
            <Plus
              className="mt-0.5 h-4 w-4 shrink-0 text-accent transition-transform duration-200 group-open:rotate-45"
              aria-hidden="true"
            />
          </summary>
          <div className="px-5 pb-5 pt-0">
            <p className="text-[15px] leading-7 text-muted-foreground">{entry.answer}</p>
          </div>
        </details>
      ))}
    </div>
  );
}

export default FaqAccordion;
