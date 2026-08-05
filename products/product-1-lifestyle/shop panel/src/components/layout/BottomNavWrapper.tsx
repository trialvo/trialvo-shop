"use client";
import { BottomNav } from "@/components/layout/BottomNav";

/** Thin client wrapper so BottomNav can be used from the server root layout */
export function BottomNavWrapper() {
  return <BottomNav />;
}
