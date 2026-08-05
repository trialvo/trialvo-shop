import { createSlice } from "@reduxjs/toolkit";

/**
 * Order Slice — minimal, API-driven.
 * All order data comes from the useOrder hook via React Query.
 * This slice only exists to hold transient UI state if needed.
 */

interface OrderState {
  /** Currently selected order tab */
  activeTab: "all" | "to-pay" | "completed" | "canceled";
}

const initialState: OrderState = {
  activeTab: "all",
};

const orderSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    initOrders: () => {},
    setActiveTab(state, action) {
      state.activeTab = action.payload;
    },
  },
});

export const { initOrders, setActiveTab } = orderSlice.actions;
export default orderSlice.reducer;
