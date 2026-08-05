"use client";

import CartPersistGate from "@/redux/persist/CartPersistGate";
import { fetchDiscountRules } from "@/redux/slices/discountSlice";
import { store } from "@/redux/store";
import { applyShopRuntimeConfig } from "@/config/env";
import React from "react";
import { Provider, useDispatch } from "react-redux";
import type { AppDispatch } from "@/redux/store";

type ReduxProviderProps = {
  children: React.ReactNode;
};

const DiscountRulesLoader: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  React.useEffect(() => {
    dispatch(fetchDiscountRules());
  }, [dispatch]);
  return null;
};

const ReduxProvider: React.FC<ReduxProviderProps> = ({ children }) => {
  // Sync + layout: apply trial IMAGE_URL before product cards resolve media URLs
  // (env module may evaluate before/after window.__SHOP_CONFIG__).
  applyShopRuntimeConfig();
  const [configEpoch, setConfigEpoch] = React.useState(0);
  React.useLayoutEffect(() => {
    applyShopRuntimeConfig();
    setConfigEpoch((n) => n + 1);
  }, []);

  return (
    <Provider store={store} key={configEpoch}>
      <DiscountRulesLoader />
      <CartPersistGate>{children}</CartPersistGate>
    </Provider>
  );
};

export default ReduxProvider;
