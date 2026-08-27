/* eslint-disable @typescript-eslint/no-unused-expressions */
"use client";

import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useColor } from "@/hooks/useColor";
import { useVariant } from "@/hooks/useVariant";
import React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import CheckboxFilter from "./CheckboxFilter";
import PriceFilter, { type PriceFilterValue } from "./PriceFilter";

export type FilterState = {
  price: PriceFilterValue;
  sizes: ReadonlySet<string>;
  colors: ReadonlySet<string>;
};

export type FilterSidebarProps = {
  value: FilterState;
  onChange: (next: FilterState) => void;
};

export function FilterSectionSkeleton({
  titleWidth = "w-24",
}: Readonly<{ titleWidth?: string }>) {
  return (
    <div className="space-y-3">
      <Skeleton className={`h-4 ${titleWidth}`} />
      <Skeleton className="h-9 w-full rounded-none" />
      <div className="space-y-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-sm" />
            <Skeleton className="h-4 w-36" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyFilterState({
  title,
  subtitle,
}: Readonly<{
  title: string;
  subtitle?: string;
}>) {
  return (
    <div className="rounded-md border border-dashed border-black/15 bg-white p-4">
      <p className="text-sm font-semibold text-black">{title}</p>
      {subtitle ? <p className="mt-1 text-xs text-black/60">{subtitle}</p> : null}
    </div>
  );
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({ value, onChange }) => {
  const { t } = useTranslation();
  const [sizeSearch, setSizeSearch] = React.useState<string>("");
  const [colorSearch, setColorSearch] = React.useState<string>("");

  const [debouncedSizeSearch, setDebouncedSizeSearch] = React.useState<string>("");
  const [debouncedColorSearch, setDebouncedColorSearch] = React.useState<string>("");

  React.useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSizeSearch(sizeSearch.trim()), 350);
    return () => window.clearTimeout(t);
  }, [sizeSearch]);

  React.useEffect(() => {
    const t = window.setTimeout(() => setDebouncedColorSearch(colorSearch.trim()), 350);
    return () => window.clearTimeout(t);
  }, [colorSearch]);

  const { colors: allColors, colorsLoading } = useColor({
    name: debouncedColorSearch || undefined,
    status: true,
  });

  const { variants, variantsLoading } = useVariant({
    name: debouncedSizeSearch || undefined,
    status: true,
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-[#E5E5E5] pb-3">
        <h2 className="text-sm font-semibold tracking-tight text-black">{t("catalog.filters")}</h2>
      </div>

      <PriceFilter
        title={t("catalog.price")}
        value={value.price}
        onChange={(price) => onChange({ ...value, price })}
      />

      <Separator />

      {variantsLoading ? (
        <FilterSectionSkeleton titleWidth="w-16" />
      ) : variants.length === 0 ? (
        <EmptyFilterState
          title="No sizes found"
          subtitle={debouncedSizeSearch ? "Try a different keyword." : "Sizes will appear here when available."}
        />
      ) : (
        <CheckboxFilter
          title={t("catalog.size")}
          options={variants}
          selected={value.sizes}
          onToggle={(v) => {
            const next = new Set(value.sizes);
            next.has(v) ? next.delete(v) : next.add(v);
            onChange({ ...value, sizes: next });
          }}
          searchValue={sizeSearch}
          onSearchChange={setSizeSearch}
        />
      )}

      <Separator />

      {colorsLoading ? (
        <FilterSectionSkeleton titleWidth="w-20" />
      ) : allColors.length === 0 ? (
        <EmptyFilterState
          title="No colors found"
          subtitle={debouncedColorSearch ? "Try a different keyword." : "Colors will appear here when available."}
        />
      ) : (
        <CheckboxFilter
          title={t("catalog.color")}
          options={allColors}
          selected={value.colors}
          onToggle={(v) => {
            const next = new Set(value.colors);
            next.has(v) ? next.delete(v) : next.add(v);
            onChange({ ...value, colors: next });
          }}
          searchValue={colorSearch}
          onSearchChange={setColorSearch}
        />
      )}
    </div>
  );
};

export default FilterSidebar;