"use client";

import {
  consumeReturnPath,
  peekReturnPath,
} from "@/lib/navigation/return-to";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

function scrollWindowToTop() {
  if (typeof window === "undefined") return;
  // Instant top — avoids destination landing mid-scroll then jumping
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

/**
 * Restores the screen the user came from before an edit page.
 * Path is kept in sessionStorage — the edit URL stays clean.
 */
export function useReturnTo(fallback: string) {
  const router = useRouter();
  const [returnTo, setReturnTo] = useState(fallback);

  useEffect(() => {
    setReturnTo(peekReturnPath(fallback));
  }, [fallback]);

  const navigateBack = useCallback(() => {
    const target = consumeReturnPath(fallback);
    setReturnTo(target);
    scrollWindowToTop();
    router.push(target);
  }, [fallback, router]);

  return { returnTo, navigateBack };
}
