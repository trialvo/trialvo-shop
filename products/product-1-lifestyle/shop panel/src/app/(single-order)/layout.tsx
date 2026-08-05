"use client";

/**
 * (single-order)/layout.tsx — Layout for single order pages
 *
 * Renders a clean shell WITHOUT the default Header/Footer.
 * This avoids the dangerouslySetInnerHTML CSS hack from the source project.
 */

import { useAppDispatch } from "@/store";
import { initCart } from "@/store/slices/cartSlice";
import { useEffect } from "react";

export default function SingleOrderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(initCart());
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1">{children}</main>
    </div>
  );
}
