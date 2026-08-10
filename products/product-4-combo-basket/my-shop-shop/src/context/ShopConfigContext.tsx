"use client";

import {
 createContext,
 useContext,
 useState,
 useEffect,
 useCallback,
 ReactNode,
} from "react";
import { ShopConfig, DEFAULT_SHOP_CONFIG } from "@/config/shopConfig";
import { useShopConfigApi, apiConfigToContext } from "@/api/config";

interface ShopConfigContextValue {
 config: ShopConfig;
 updateConfig: (patch: Partial<ShopConfig>) => void;
 resetConfig: () => void;
}

const ShopConfigContext = createContext<ShopConfigContextValue | null>(null);

export function ShopConfigProvider({ children }: { children: ReactNode }) {
 const [config, setConfig] = useState<ShopConfig>(DEFAULT_SHOP_CONFIG);
 const { data } = useShopConfigApi();

 // When API config loads, update the context
 useEffect(() => {
  if (data?.config) {
   setConfig(apiConfigToContext(data.config) as ShopConfig);
  }
 }, [data]);

 const updateConfig = useCallback((patch: Partial<ShopConfig>) => {
  setConfig((prev) => ({
   ...prev,
   combo: { ...prev.combo, ...(patch.combo ?? {}) },
   single: { ...prev.single, ...(patch.single ?? {}) },
   "combo-bundle": { ...prev["combo-bundle"], ...(patch["combo-bundle"] ?? {}) },
   delivery_zones: patch.delivery_zones ?? prev.delivery_zones,
  }));
 }, []);

 const resetConfig = useCallback(() => {
  setConfig(DEFAULT_SHOP_CONFIG);
 }, []);

 return (
  <ShopConfigContext.Provider value={{ config, updateConfig, resetConfig }}>
   {children}
  </ShopConfigContext.Provider>
 );
}

export function useShopConfig(): ShopConfigContextValue {
 const ctx = useContext(ShopConfigContext);
 if (!ctx) throw new Error("useShopConfig must be used inside ShopConfigProvider");
 return ctx;
}
