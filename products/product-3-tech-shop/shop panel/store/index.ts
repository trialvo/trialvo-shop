import { configureStore } from "@reduxjs/toolkit";
import { cartReducer } from "@/store/cart/cartSlice";
import { compareReducer } from "@/store/compare/compareSlice";

export const makeStore = () =>
  configureStore({
    reducer: {
      cart: cartReducer,
      compare: compareReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        // Product objects in cart/compare are plain serializable JSON from our adapters.
        serializableCheck: false,
      }),
    devTools: process.env.NODE_ENV !== "production",
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
