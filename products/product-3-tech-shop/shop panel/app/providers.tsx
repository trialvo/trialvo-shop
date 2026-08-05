"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WishlistProvider } from "@/context/WishlistContext";
import { AuthProvider } from "@/context/AuthContext";
import { StoreProvider } from "@/store/StoreProvider";
import { applyShopRuntimeConfig } from "@/config/env";
import { useLayoutEffect, useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  // Apply trial IMAGE_URL before product cards resolve media (Lifestyle parity)
  applyShopRuntimeConfig();
  const [configEpoch, setConfigEpoch] = useState(0);
  useLayoutEffect(() => {
    applyShopRuntimeConfig();
    setConfigEpoch((n) => n + 1);
  }, []);

  return (
    <QueryClientProvider client={queryClient} key={configEpoch}>
      <StoreProvider>
        <TooltipProvider>
          <AuthProvider>
            <WishlistProvider>
              <Toaster />
              <Sonner />
              {children}
            </WishlistProvider>
          </AuthProvider>
        </TooltipProvider>
      </StoreProvider>
    </QueryClientProvider>
  );
}
