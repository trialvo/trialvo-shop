"use client";

import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { store } from "@/store";
import QuickViewModal from "@/components/product/QuickViewModal";
import { applyShopRuntimeConfig } from "@/config/env";
import { useEffect, type ReactNode } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

interface AppProvidersProps {
  children: ReactNode;
}

export default function AppProviders({ children }: AppProvidersProps) {
  // Ensure trial IMAGE_URL from window.__SHOP_CONFIG__ is applied before
  // product cards resolve media URLs (module may load before/after the script).
  useEffect(() => {
    applyShopRuntimeConfig();
  }, []);

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {children}
          <QuickViewModal />
        </TooltipProvider>
      </QueryClientProvider>
    </Provider>
  );
}
