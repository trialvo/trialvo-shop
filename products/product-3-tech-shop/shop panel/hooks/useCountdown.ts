"use client";

import { useEffect, useState } from "react";
import {
  getCountdownParts,
  type CountdownParts,
} from "@/lib/time/countdown";

/**
 * Live countdown against an API end datetime.
 * Returns null parts when endAt is missing so callers can hide the timer.
 */
export function useCountdown(
  endAt: string | null | undefined,
): CountdownParts | null {
  const [parts, setParts] = useState<CountdownParts | null>(() =>
    endAt ? getCountdownParts(endAt) : null,
  );

  useEffect(() => {
    if (!endAt) {
      setParts(null);
      return;
    }

    const tick = () => setParts(getCountdownParts(endAt));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [endAt]);

  return parts;
}
