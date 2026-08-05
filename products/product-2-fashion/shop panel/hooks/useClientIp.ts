"use client";

import * as React from "react";

type State = {
  ip: string | null;
  isLoading: boolean;
  error: string | null;
};

/**
 * useClientIp — fetches the visitor's public IP address.
 *
 * PERFORMANCE: The fetch is deferred by 3 seconds so it never
 * competes with content rendering or critical API calls.
 */
export function useClientIp() {
  const [state, setState] = React.useState<State>({
    ip: null,
    isLoading: true,
    error: null,
  });

  React.useEffect(() => {
    let cancelled = false;

    // Defer the IP fetch so it doesn't block initial rendering
    const delay = setTimeout(() => {
      const run = async () => {
        try {
          const res = await fetch("https://api.ipify.org?format=json");
          const data: unknown = await res.json();

          const ip =
            data &&
            typeof data === "object" &&
            "ip" in data &&
            typeof (data as { ip?: unknown }).ip === "string"
              ? (data as { ip: string }).ip
              : null;

          if (cancelled) return;

          setState({
            ip,
            isLoading: false,
            error: ip ? null : "Invalid IP response",
          });
        } catch (e) {
          if (cancelled) return;

          setState({
            ip: null,
            isLoading: false,
            error: e instanceof Error ? e.message : "Failed to fetch IP",
          });
        }
      };

      run();
    }, 3000); // 3-second delay — page content loads first

    return () => {
      cancelled = true;
      clearTimeout(delay);
    };
  }, []);

  return state;
}
