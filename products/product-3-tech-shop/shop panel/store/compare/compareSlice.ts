import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  CompareSlot,
  CompareSlots,
  CompareState,
} from "@/store/compare/types";

const emptySlots = (): CompareSlots => [null, null];

const initialState: CompareState = {
  slots: emptySlots(),
  isHydrated: false,
};

function sanitizeSlot(product: CompareSlot): CompareSlot | null {
  const id = Number(product?.id);
  if (!Number.isFinite(id) || id <= 0) return null;
  const name = String(product.name ?? "").trim();
  const slug = String(product.slug ?? "").trim();
  if (!name || !slug) return null;

  return {
    id,
    name: name.slice(0, 300),
    slug: slug.slice(0, 300),
    images: Array.isArray(product.images) ? product.images : [],
    thumbnail: product.thumbnail ?? null,
    price_range: product.price_range,
    variations: product.variations,
  };
}

const compareSlice = createSlice({
  name: "compare",
  initialState,
  reducers: {
    hydrateCompare(state, action: PayloadAction<CompareSlots>) {
      state.slots = action.payload;
      state.isHydrated = true;
    },
    addToCompare(state, action: PayloadAction<CompareSlot>) {
      const product = sanitizeSlot(action.payload);
      if (!product) return;

      const [a, b] = state.slots;
      if (a?.id === product.id || b?.id === product.id) return;

      if (a === null) {
        state.slots = [product, b];
        return;
      }
      if (b === null) {
        state.slots = [a, product];
        return;
      }
      // Both full — UI should disable add; store still replaces slot B as fallback
      state.slots = [a, product];
    },
    removeFromCompare(state, action: PayloadAction<number>) {
      const productId = Number(action.payload);
      if (!Number.isFinite(productId)) return;
      state.slots = [
        state.slots[0]?.id === productId ? null : state.slots[0],
        state.slots[1]?.id === productId ? null : state.slots[1],
      ];
    },
    clearCompare(state) {
      state.slots = emptySlots();
    },
    /**
     * Replace both slots atomically (compare page picker sync).
     * Order is preserved: [A, B].
     */
    setCompareSlots(state, action: PayloadAction<CompareSlots>) {
      const [rawA, rawB] = action.payload;
      const a = rawA ? sanitizeSlot(rawA) : null;
      const b = rawB ? sanitizeSlot(rawB) : null;
      // Drop duplicate B if same id as A
      if (a && b && a.id === b.id) {
        state.slots = [a, null];
        return;
      }
      state.slots = [a, b];
    },
  },
});

export const {
  hydrateCompare,
  addToCompare,
  removeFromCompare,
  clearCompare,
  setCompareSlots,
} = compareSlice.actions;

export const compareReducer = compareSlice.reducer;
