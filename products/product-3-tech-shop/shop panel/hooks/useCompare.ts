"use client";

import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addToCompare as addToCompareAction,
  clearCompare as clearCompareAction,
  removeFromCompare as removeFromCompareAction,
  setCompareSlots as setCompareSlotsAction,
} from "@/store/compare/compareSlice";
import {
  selectCompareFilledCount,
  selectCompareSlots,
  selectIsCompareFull,
  selectIsCompareHydrated,
} from "@/store/compare/selectors";
import type { CompareSlot, CompareSlots } from "@/store/compare/types";

export type { CompareSlot, CompareSlots } from "@/store/compare/types";

/**
 * Typed facade over the Redux compare slice (max 2 product slots).
 */
export function useCompare() {
  const dispatch = useAppDispatch();
  const slots = useAppSelector(selectCompareSlots);
  const isHydrated = useAppSelector(selectIsCompareHydrated);
  const isFull = useAppSelector(selectIsCompareFull);
  const filledCount = useAppSelector(selectCompareFilledCount);

  const addToCompare = useCallback(
    (product: CompareSlot) => {
      dispatch(addToCompareAction(product));
    },
    [dispatch],
  );

  const removeFromCompare = useCallback(
    (productId: number) => {
      dispatch(removeFromCompareAction(productId));
    },
    [dispatch],
  );

  const clearCompare = useCallback(() => {
    dispatch(clearCompareAction());
  }, [dispatch]);

  const setCompareSlots = useCallback(
    (next: CompareSlots) => {
      dispatch(setCompareSlotsAction(next));
    },
    [dispatch],
  );

  const isInCompare = useCallback(
    (productId: number) => {
      if (!isHydrated) return false;
      const id = Number(productId);
      return slots[0]?.id === id || slots[1]?.id === id;
    },
    [slots, isHydrated],
  );

  return {
    slots,
    isHydrated,
    isFull: isHydrated ? isFull : false,
    filledCount: isHydrated ? filledCount : 0,
    addToCompare,
    removeFromCompare,
    clearCompare,
    setCompareSlots,
    isInCompare,
  };
}
