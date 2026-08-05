"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useState } from "react";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,         // 1 min — product data stays fresh
        gcTime: 5 * 60 * 1000,        // 5 min — garbage collect unused queries
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: true,          // Re-enabled: show fresh data on navigation
        // 2 retries with exponential back-off (1 s → 2 s), cap at 5 s.
        // Faster error surfacing while still handling transient network blips.
        retry: 2,
        retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 5000),
      },
    },
  });
}

const ReactQueryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [client] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={client}>
      {children}
    </QueryClientProvider>
  );
};

export default ReactQueryProvider;
