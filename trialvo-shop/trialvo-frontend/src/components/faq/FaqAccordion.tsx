import { Plus } from "lucide-react";
import { Surface } from "@/components/section";
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
    <Surface sheen className="divide-y divide-border overflow-hidden">
      {entries.map((entry, index) => (
        <details
          key={entry.id}
          id={entry.id}
          open={defaultOpenFirst && index === 0}
          className="group scroll-mt-28 transition-colors open:bg-accent/[0.03]"
        >
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-5 text-left transition-colors hover:bg-muted/40 [&::-webkit-details-marker]:hidden">
            <h3 className="font-display text-[15px] font-bold leading-6 tracking-tight text-foreground transition-colors group-hover:text-accent-strong group-open:text-accent-strong">
              {entry.question}
            </h3>
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/[0.1] text-accent ring-1 ring-inset ring-accent/20 transition-transform duration-200 group-open:rotate-45">
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </summary>
          <div className="px-5 pb-5 pt-0">
            <p className="max-w-3xl text-[15px] leading-7 text-muted-foreground">
              {entry.answer}
            </p>
          </div>
        </details>
      ))}
    </Surface>
  );
}

export default FaqAccordion;
