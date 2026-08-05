"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CompareProductDetail,
  ProductListItem,
} from "@/lib/api/product/service";
import { productService } from "@/lib/api/product/service";
import { listItemToCompareSlot } from "@/lib/adapters/compareSlot";
import { computeBetterFlags } from "@/lib/compare/betterFlags";
import { slotToProductListItem } from "@/lib/compare/slotToProductListItem";
import { useCompare } from "@/hooks/useCompare";
import type { CompareSlot } from "@/store/compare/types";

export type CompareDetailSlot = {
  product: ProductListItem;
  detail: CompareProductDetail | null;
  loading: boolean;
};

/**
 * Compare page data layer:
 * - Redux slots are the source of truth
 * - Fetches detail via GET /user/compare with AbortController
 * - Picker select/clear writes back to Redux
 */
export function useCompareDetails() {
  const { slots, isHydrated, setCompareSlots, removeFromCompare } =
    useCompare();

  const [slotA, setSlotA] = useState<CompareDetailSlot | null>(null);
  const [slotB, setSlotB] = useState<CompareDetailSlot | null>(null);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const selectedA = slotA?.product ?? null;
  const selectedB = slotB?.product ?? null;

  const applySlotsToLocal = useCallback(
    async (s0: CompareSlot | null, s1: CompareSlot | null) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setError(null);

      if (!s0 && !s1) {
        setSlotA(null);
        setSlotB(null);
        setComparing(false);
        return;
      }

      const pA = s0 ? slotToProductListItem(s0) : null;
      const pB = s1 ? slotToProductListItem(s1) : null;

      if (pA) setSlotA({ product: pA, detail: null, loading: true });
      else setSlotA(null);
      if (pB) setSlotB({ product: pB, detail: null, loading: true });
      else setSlotB(null);

      setComparing(true);
      try {
        const ids = [pA?.id, pB?.id].filter(
          (id): id is number => typeof id === "number",
        );
        const res = await productService.compareProducts(ids, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;

        const items = Array.isArray(res?.data) ? res.data : [];
        const find = (id: number) =>
          items.find((d) => Number(d.id) === Number(id)) ?? null;

        if (pA) {
          setSlotA({
            product: pA,
            detail: find(pA.id),
            loading: false,
          });
        }
        if (pB) {
          setSlotB({
            product: pB,
            detail: find(pB.id),
            loading: false,
          });
        }
      } catch (e: unknown) {
        if (controller.signal.aborted) return;
        // Axios abort / cancel should not surface as a user-facing error
        if (
          typeof e === "object" &&
          e !== null &&
          "code" in e &&
          (e as { code?: string }).code === "ERR_CANCELED"
        ) {
          return;
        }
        const message =
          e instanceof Error ? e.message : "Failed to load comparison.";
        setError(message);
        if (pA) setSlotA({ product: pA, detail: null, loading: false });
        if (pB) setSlotB({ product: pB, detail: null, loading: false });
      } finally {
        if (!controller.signal.aborted) setComparing(false);
      }
    },
    [],
  );

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // Hydrate-safe: wait for localStorage, then keep local UI in sync with Redux
  useEffect(() => {
    if (!isHydrated) return;
    void applySlotsToLocal(slots[0], slots[1]);
  }, [isHydrated, slots[0]?.id, slots[1]?.id, applySlotsToLocal]);

  const handleSelectA = useCallback(
    (p: ProductListItem) => {
      setCompareSlots([listItemToCompareSlot(p), slots[1]]);
    },
    [setCompareSlots, slots],
  );

  const handleSelectB = useCallback(
    (p: ProductListItem) => {
      setCompareSlots([slots[0], listItemToCompareSlot(p)]);
    },
    [setCompareSlots, slots],
  );

  const handleClearA = useCallback(() => {
    if (slots[0]) removeFromCompare(slots[0].id);
    else setCompareSlots([null, slots[1]]);
  }, [removeFromCompare, setCompareSlots, slots]);

  const handleClearB = useCallback(() => {
    if (slots[1]) removeFromCompare(slots[1].id);
    else setCompareSlots([slots[0], null]);
  }, [removeFromCompare, setCompareSlots, slots]);

  const dA = slotA?.detail ?? null;
  const dB = slotB?.detail ?? null;
  const bothLoaded = Boolean(dA && dB && !comparing);
  const { left: isBetterA, right: isBetterB } = computeBetterFlags(
    bothLoaded ? dA : null,
    bothLoaded ? dB : null,
  );

  return {
    isHydrated,
    selectedA,
    selectedB,
    slotA,
    slotB,
    comparing,
    error,
    dA,
    dB,
    bothLoaded,
    isBetterA,
    isBetterB,
    handleSelectA,
    handleSelectB,
    handleClearA,
    handleClearB,
  };
}
