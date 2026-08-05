import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type PriceRange = { min: number; max: number };

type CatalogFilterState = {
  price: PriceRange;
  sizeValues: string[];
  colorValues: string[];
};

const initialState: CatalogFilterState = {
  price: { min: 0, max: 10000 },
  sizeValues: [],
  colorValues: [],
};

const toggle = (arr: string[], v: string) =>
  arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

const catalogFilterSlice = createSlice({
  name: "catalogFilter",
  initialState,
  reducers: {
    setPrice: (state, action: PayloadAction<PriceRange>) => {
      state.price = action.payload;
    },
    toggleSize: (state, action: PayloadAction<string>) => {
      state.sizeValues = toggle(state.sizeValues, action.payload);
    },
    toggleColor: (state, action: PayloadAction<string>) => {
      state.colorValues = toggle(state.colorValues, action.payload);
    },
    clearFilters: () => initialState,
  },
});

export const { setPrice, toggleSize, toggleColor, clearFilters } = catalogFilterSlice.actions;
export default catalogFilterSlice.reducer;
