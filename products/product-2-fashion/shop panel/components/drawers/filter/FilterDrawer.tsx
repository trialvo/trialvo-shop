"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import * as React from "react";
import FilterHeader from "./FilterHeader";

import CheckboxFilter from "@/components/filters/CheckboxFilter";
import { EmptyFilterState, FilterSectionSkeleton } from "@/components/filters/FilterSidebar";
import PriceFilter from "@/components/filters/PriceFilter";
import { Separator } from "@/components/ui/separator";
import { useColor } from "@/hooks/useColor";
import { useVariant } from "@/hooks/useVariant";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  selectCatalogColors,
  selectCatalogPrice,
  selectCatalogSizes,
} from "@/redux/selectors/catalogFilterSelectors";
import { setPrice, toggleColor, toggleSize } from "@/redux/slices/catalogFilterSlice";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isTop?: boolean;
  zIndex?: number;
  className?: string;
};

const FilterDrawer: React.FC<Props> = ({ open, onOpenChange, className }) => {
  const dispatch = useAppDispatch();

  const price = useAppSelector(selectCatalogPrice);
  const sizeValues = useAppSelector(selectCatalogSizes);
  const colorValues = useAppSelector(selectCatalogColors);

  const sizeSet = React.useMemo(() => new Set(sizeValues), [sizeValues]);
  const colorSet = React.useMemo(() => new Set(colorValues), [colorValues]);

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

  if (!open) return null;

  return (
    <div className={cn("flex h-full flex-col bg-white", className)}>
      <FilterHeader onClose={() => onOpenChange(false)} />

      <ScrollArea className="flex-1 min-h-0 pb-14">
        <div className="space-y-8 px-4 py-4">
          <PriceFilter value={price} onChange={(next) => dispatch(setPrice(next))} />

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
              title="Size"
              options={variants}
              selected={sizeSet}
              onToggle={(v) => dispatch(toggleSize(String(v)))}
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
              title="Color"
              options={allColors}
              selected={colorSet}
              onToggle={(v) => dispatch(toggleColor(String(v)))}
              searchValue={colorSearch}
              onSearchChange={setColorSearch}
            />
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default FilterDrawer;
