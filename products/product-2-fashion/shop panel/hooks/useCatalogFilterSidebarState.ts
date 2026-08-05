"use client";

import type { FilterState } from "@/components/filters/FilterSidebar";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { clearFilters, setPrice, toggleColor, toggleSize } from "@/redux/slices/catalogFilterSlice";
import React from "react";

function diffToggle(next: ReadonlySet<string>, prevArr: string[]) {
  const prev = new Set(prevArr);
  const toAdd: string[] = [];
  const toRemove: string[] = [];

  for (const v of next) if (!prev.has(v)) toAdd.push(v);
  for (const v of prev) if (!next.has(v)) toRemove.push(v);

  return { toAdd, toRemove };
}

export function useCatalogFilterSidebarState() {
  const dispatch = useAppDispatch();
  const filter = useAppSelector((s) => s.filters);

  const value: FilterState = React.useMemo(
    () => ({
      price: filter.price,
      sizes: new Set(filter.sizeValues),
      colors: new Set(filter.colorValues),
    }),
    [filter.price, filter.sizeValues, filter.colorValues],
  );

  const onChange = React.useCallback(
    (next: FilterState) => {
      if (next.price.min !== filter.price.min || next.price.max !== filter.price.max) {
        dispatch(setPrice({ min: next.price.min, max: next.price.max }));
      }

      const sizeDiff = diffToggle(next.sizes, filter.sizeValues);
      sizeDiff.toAdd.forEach((v) => dispatch(toggleSize(v)));
      sizeDiff.toRemove.forEach((v) => dispatch(toggleSize(v)));

      const colorDiff = diffToggle(next.colors, filter.colorValues);
      colorDiff.toAdd.forEach((v) => dispatch(toggleColor(v)));
      colorDiff.toRemove.forEach((v) => dispatch(toggleColor(v)));
    },
    [dispatch, filter.price.min, filter.price.max, filter.sizeValues, filter.colorValues],
  );

  const onClear = React.useCallback(() => {
    dispatch(clearFilters());
  }, [dispatch]);

  return { value, onChange, onClear };
}
