import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/store";

export const selectCompareSlots = (state: RootState) => state.compare.slots;
export const selectIsCompareHydrated = (state: RootState) =>
  state.compare.isHydrated;

export const selectCompareFilledCount = createSelector(
  [selectCompareSlots],
  (slots) => slots.filter(Boolean).length,
);

export const selectIsCompareFull = createSelector(
  [selectCompareSlots],
  (slots) => slots[0] !== null && slots[1] !== null,
);
