import type { Product, QuickViewState } from "@/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UIState {
  quickView: QuickViewState;
  cartDrawerOpen: boolean;
  searchOpen: boolean;
  /** Global toast error message */
  error: string | null;
  /** Global toast success message */
  success: string | null;
}

const initialState: UIState = {
  quickView: { isOpen: false, productId: null, product: null },
  cartDrawerOpen: false,
  searchOpen: false,
  error: null,
  success: null,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    openQuickView(state, action: PayloadAction<number | Product>) {
      if (typeof action.payload === "number") {
        state.quickView = { isOpen: true, productId: action.payload, product: null };
        return;
      }

      state.quickView = {
        isOpen: true,
        productId: action.payload.id,
        product: action.payload,
      };
    },
    closeQuickView(state) {
      state.quickView = { isOpen: false, productId: null, product: null };
    },
    setCartDrawerOpen(state, action: PayloadAction<boolean>) {
      state.cartDrawerOpen = action.payload;
    },
    setSearchOpen(state, action: PayloadAction<boolean>) {
      state.searchOpen = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    setSuccess(state, action: PayloadAction<string | null>) {
      state.success = action.payload;
    },
    clearMessages(state) {
      state.error = null;
      state.success = null;
    },
  },
});

export const {
  openQuickView,
  closeQuickView,
  setCartDrawerOpen,
  setSearchOpen,
  setError,
  setSuccess,
  clearMessages,
} = uiSlice.actions;

export default uiSlice.reducer;
