import catalogFilter from "@/redux/slices/catalogFilterSlice";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import cartReducer from "./slices/cartSlice";
import discountReducer from "./slices/discountSlice";
import drawerManagerReducre from "./slices/drawerManagerSlice";
import modalManagerReducer from "./slices/modalManagerSlice";
import quickAddReducer from "./slices/quickAddSlice";
import uiReducer from "./slices/uiSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    modalManager: modalManagerReducer,
    drawerManager: drawerManagerReducre,
    cart: cartReducer,
    filters: catalogFilter,
    quickAdd: quickAddReducer,
    discounts: discountReducer,
  },
  devTools: process.env.NODE_ENV !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
