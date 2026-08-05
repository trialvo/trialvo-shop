import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { API_URL } from "@/config/env";

// Direct API calls — uses API_URL from config/env.ts
const API_BASE = `${API_URL.replace(/\/+$/, "")}/api/v1`;

// ─── Types ────────────────────────────────────────────────────────────────────

export type BulkRule = {
  id: number;
  name: string | null;
  product_sku_id: number;
  min_qty: number;
  discount_type: 0 | 1; // 0 = flat, 1 = percentage
  discount_value: number;
  free_delivery: 0 | 1 | boolean;
  sku: string;
  selling_price: number;
  stock: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  color_name: string | null;
  variant_name: string | null;
  product_image: string | null;
};

export type ComboTierItem = {
  product_sku_id: number;
  required_qty: number;
  sku: string;
  selling_price: number;
  stock: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  color_name: string | null;
  variant_name: string | null;
  product_image: string | null;
};

export type ComboTier = {
  id: number;
  serial: number;
  discount_type: 0 | 1;
  discount_value: number;
  items: ComboTierItem[];
};

export type ComboRule = {
  id: number;
  name: string;
  description: string | null;
  free_delivery: 0 | 1 | boolean;
  tiers: ComboTier[];
};

/** Mirrors the overall_cart_discount section in permission_config */
export type CartDiscountConfig = {
  is_enabled: boolean;
  basis: "item_count" | "total_selling_price";
  min_item_count: number;
  min_total_selling_price: number;
  discount_type: "flat" | "percentage";
  discount_value: number;
  apply_with_bulk_combo: boolean;
};

export type DiscountState = {
  bulkRules: BulkRule[];
  comboRules: ComboRule[];
  cartDiscountConfig: CartDiscountConfig;
  loading: boolean;
  loaded: boolean;
  error: string | null;
};

const DEFAULT_CART_CONFIG: CartDiscountConfig = {
  is_enabled: false,
  basis: "item_count",
  min_item_count: 0,
  min_total_selling_price: 0,
  discount_type: "flat",
  discount_value: 0,
  apply_with_bulk_combo: true,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchDiscountRules = createAsyncThunk(
  "discounts/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const [bulkRes, comboRes, cartConfigRes] = await Promise.all([
        fetch(`${API_BASE}/user/bulk-rules`),
        fetch(`${API_BASE}/user/combo-rules`),
        fetch(`${API_BASE}/user/cart-discount-config`),
      ]);
      const [bulkData, comboData, cartConfigData] = await Promise.all([
        bulkRes.json(),
        comboRes.json(),
        cartConfigRes.json(),
      ]);
      return {
        bulkRules: bulkData.data ?? [],
        comboRules: comboData.data ?? [],
        cartDiscountConfig: cartConfigData.data ?? DEFAULT_CART_CONFIG,
      };
    } catch {
      return rejectWithValue("Failed to load discount rules");
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const discountSlice = createSlice({
  name: "discounts",
  initialState: {
    bulkRules: [],
    comboRules: [],
    cartDiscountConfig: DEFAULT_CART_CONFIG,
    loading: false,
    loaded: false,
    error: null,
  } as DiscountState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDiscountRules.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDiscountRules.fulfilled, (state, action) => {
        state.loading = false;
        state.loaded = true;
        state.bulkRules = action.payload.bulkRules;
        state.comboRules = action.payload.comboRules;
        state.cartDiscountConfig = action.payload.cartDiscountConfig;
      })
      .addCase(fetchDiscountRules.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default discountSlice.reducer;
