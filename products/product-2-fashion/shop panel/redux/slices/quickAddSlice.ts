import type { QuickAddProduct } from "@/components/modals/quick-add/quickAdd.types";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type QuickAddState = {
  open: boolean;
  product?: QuickAddProduct | null;
};

const initialState: QuickAddState = {
  open: false,
  product: null,
};

const quickAddSlice = createSlice({
  name: "quickAdd",
  initialState,
  reducers: {
    openQuickAdd: (state, action: PayloadAction<QuickAddProduct>) => {
      state.open = true;
      state.product = {
        ...action.payload,
        sizes: [...action.payload.sizes],
        colors: [...action.payload.colors],
      };
    },
    closeQuickAdd: (state) => {
      state.open = false;
      state.product = null;
    },
  },
});

export const { openQuickAdd, closeQuickAdd } = quickAddSlice.actions;
export default quickAddSlice.reducer;
