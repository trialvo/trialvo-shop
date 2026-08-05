"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Scrolls to the top of the page whenever the route (pathname) changes.
 * Place this once in the root layout.
 */
export default function ScrollToTop() {
 const pathname = usePathname();

 useEffect(() => {
  window.scrollTo({ top: 0, behavior: "instant" });
 }, [pathname]);

 return null;
}
