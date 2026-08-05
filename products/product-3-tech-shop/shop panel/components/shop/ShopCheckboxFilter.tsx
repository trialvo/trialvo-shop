"use client";

import { useMemo, useState, type ReactElement } from "react";
import { Search } from "lucide-react";
import { AppInput } from "@/components/shared/AppInput";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export type ShopCheckboxOption = Readonly<{
  id: string | number;
  name: string;
}>;

type ShopCheckboxFilterProps = Readonly<{
  title: string;
  options: readonly ShopCheckboxOption[];
  selectedIds: ReadonlySet<string>;
  onToggle: (id: string) => void;
  searchPlaceholder?: string;
  emptyTitle?: string;
  emptySubtitle?: string;
  /** Visible rows before the list scrolls (default: 8). */
  visibleCount?: number;
}>;

/**
 * Searchable checkbox list — selected items float to the top for faster scanning.
 */
export function ShopCheckboxFilter({
  title,
  options,
  selectedIds,
  onToggle,
  searchPlaceholder,
  emptyTitle = "Nothing found",
  emptySubtitle,
  visibleCount = 8,
}: ShopCheckboxFilterProps): ReactElement {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? options.filter((o) => o.name.toLowerCase().includes(q))
      : [...options];

    // Selected first — users see active choices without scrolling
    return list.sort((a, b) => {
      const aOn = selectedIds.has(String(a.id)) ? 0 : 1;
      const bOn = selectedIds.has(String(b.id)) ? 0 : 1;
      if (aOn !== bOn) return aOn - bOn;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });
  }, [options, query, selectedIds]);

  const selectedCount = selectedIds.size;
  // min-h-9 (36px) per row → 8 rows ≈ 288px
  const listMaxHeight = `${visibleCount * 2.25}rem`;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {selectedCount > 0 ? (
          <span className="rounded-sm bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-primary">
            {selectedCount} selected
          </span>
        ) : null}
      </div>

      <AppInput
        className="h-9 rounded-sm"
        placeholder={searchPlaceholder ?? `Search ${title}`}
        value={query}
        onValueChange={setQuery}
        inputSize="sm"
        tone="muted"
        leftIcon={<Search className="h-3.5 w-3.5" />}
        containerClassName="w-full"
      />

      {filtered.length === 0 ? (
        <div className="rounded-sm border border-dashed border-border bg-secondary/30 px-3 py-4 text-center">
          <p className="text-sm font-medium text-foreground">{emptyTitle}</p>
          {emptySubtitle ? (
            <p className="mt-1 text-xs text-muted-foreground">{emptySubtitle}</p>
          ) : null}
        </div>
      ) : (
        <ul
          data-shop-filter-scroll
          className="space-y-0.5 overflow-y-auto overscroll-contain pr-0.5"
          style={{ maxHeight: listMaxHeight }}
        >
          {filtered.map((o) => {
            const id = String(o.id);
            const checked = selectedIds.has(id);
            const inputId = `${title.replace(/\s+/g, "-").toLowerCase()}-${id}`;
            return (
              <li key={id}>
                <label
                  htmlFor={inputId}
                  className={cn(
                    "flex min-h-9 cursor-pointer items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm transition-colors",
                    checked
                      ? "bg-primary/10 text-foreground"
                      : "text-foreground hover:bg-secondary/80",
                  )}
                >
                  <Checkbox
                    id={inputId}
                    checked={checked}
                    onCheckedChange={() => onToggle(id)}
                  />
                  <span className="min-w-0 flex-1 truncate">{o.name}</span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default ShopCheckboxFilter;
