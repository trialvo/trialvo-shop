import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type PriceRange = { min: number; max: number };

export const DEFAULT_CATALOG_PRICE: PriceRange = { min: 0, max: 10000 };

export function isDefaultCatalogPrice(price: PriceRange): boolean {
  return price.min === DEFAULT_CATALOG_PRICE.min && price.max === DEFAULT_CATALOG_PRICE.max;
}

type CatalogFilterState = {
  price: PriceRange;
  sizeValues: string[];
  colorValues: string[];
};

const initialState: CatalogFilterState = {
  price: { ...DEFAULT_CATALOG_PRICE },
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
    clearFilters: () => ({
      price: { ...DEFAULT_CATALOG_PRICE },
      sizeValues: [],
      colorValues: [],
    }),
  },
});

export const { setPrice, toggleSize, toggleColor, clearFilters } = catalogFilterSlice.actions;
export default catalogFilterSlice.reducer;
