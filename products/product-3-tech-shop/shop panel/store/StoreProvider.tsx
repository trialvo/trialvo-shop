"use client";

import { useEffect, useRef, type ReactElement, type ReactNode } from "react";
import { Provider } from "react-redux";
import { makeStore, type AppStore } from "@/store";
import { hydrateCart } from "@/store/cart/cartSlice";
import {
  loadCartFromStorage,
  saveCartToStorage,
} from "@/store/cart/persistence";
import { hydrateCompare } from "@/store/compare/compareSlice";
import {
  loadCompareFromStorage,
  saveCompareToStorage,
} from "@/store/compare/persistence";

type StoreProviderProps = Readonly<{
  children: ReactNode;
}>;

/**
 * App-wide Redux store — hydrates cart + compare from localStorage once on mount
 * and persists changes after hydration.
 */
export function StoreProvider({ children }: StoreProviderProps): ReactElement {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  useEffect(() => {
    const store = storeRef.current;
    if (!store) return;

    store.dispatch(hydrateCart(loadCartFromStorage()));
    store.dispatch(hydrateCompare(loadCompareFromStorage()));

    let prevCartItems = store.getState().cart.items;
    let prevCompareSlots = store.getState().compare.slots;

    return store.subscribe(() => {
      const root = store.getState();

      if (root.cart.isHydrated && root.cart.items !== prevCartItems) {
        prevCartItems = root.cart.items;
        saveCartToStorage(root.cart.items);
      }

      if (
        root.compare.isHydrated &&
        root.compare.slots !== prevCompareSlots
      ) {
        prevCompareSlots = root.compare.slots;
        saveCompareToStorage(root.compare.slots);
      }
    });
  }, []);

  return <Provider store={storeRef.current}>{children}</Provider>;
}
