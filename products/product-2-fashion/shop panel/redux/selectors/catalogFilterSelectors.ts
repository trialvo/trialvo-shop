import type { RootState } from "@/redux/store";

export const selectCatalogPrice = (s: RootState) => s?.filters.price;
export const selectCatalogSizes = (s: RootState) => s?.filters.sizeValues;
export const selectCatalogColors = (s: RootState) => s?.filters.colorValues;
