import { createSlice, PayloadAction } from "@reduxjs/toolkit";

/**
 * Wishlist slice — stores product IDs locally.
 * The useFavorite hook handles API calls (toggle favorite).
 * This slice provides immediate UI feedback while the API call is in-flight.
 */

interface WishlistState {
  /** Set of product IDs in the wishlist */
  ids: number[];
}

const STORAGE_KEY = "lifestyle_wishlist_ids";

function loadWishlistIds(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v: unknown) => typeof v === "number") : [];
  } catch {
    return [];
  }
}

function saveWishlistIds(ids: number[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch { /* ignore */ }
}

const initialState: WishlistState = { ids: [] };

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    initWishlist(state) {
      state.ids = loadWishlistIds();
    },
    setWishlistIds(state, action: PayloadAction<number[]>) {
      const ids = action.payload
        .filter((id) => Number.isFinite(id) && id > 0)
        .map((id) => Math.trunc(id));
      state.ids = Array.from(new Set(ids));
      saveWishlistIds(state.ids);
    },
    setWishlistProductState(
      state,
      action: PayloadAction<{ productId: number; isFavorite: boolean }>,
    ) {
      const productId = Math.trunc(action.payload.productId);
      if (!Number.isFinite(productId) || productId <= 0) return;

      if (action.payload.isFavorite) {
        if (!state.ids.includes(productId)) state.ids.push(productId);
      } else {
        state.ids = state.ids.filter((id) => id !== productId);
      }

      saveWishlistIds(state.ids);
    },
    addToWishlist(state, action: PayloadAction<number>) {
      if (!state.ids.includes(action.payload)) {
        state.ids.push(action.payload);
        saveWishlistIds(state.ids);
      }
    },
    removeFromWishlist(state, action: PayloadAction<number>) {
      state.ids = state.ids.filter((id) => id !== action.payload);
      saveWishlistIds(state.ids);
    },
    toggleWishlist(state, action: PayloadAction<number>) {
      const idx = state.ids.indexOf(action.payload);
      if (idx >= 0) {
        state.ids.splice(idx, 1);
      } else {
        state.ids.push(action.payload);
      }
      saveWishlistIds(state.ids);
    },
    clearWishlist(state) {
      state.ids = [];
      saveWishlistIds([]);
    },
  },
});

export const {
  initWishlist,
  setWishlistIds,
  setWishlistProductState,
  addToWishlist,
  removeFromWishlist,
  toggleWishlist,
  clearWishlist,
} = wishlistSlice.actions;

export const selectWishlistIds = (state: { wishlist: WishlistState }) => state.wishlist.ids;
export const selectIsInWishlist = (id: number) => (state: { wishlist: WishlistState }) =>
  state.wishlist.ids.includes(id);

export default wishlistSlice.reducer;
