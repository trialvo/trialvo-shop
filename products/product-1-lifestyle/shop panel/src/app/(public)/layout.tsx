"use client";

import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { useAppDispatch } from "@/store";
import { initCart } from "@/store/slices/cartSlice";
import { initWishlist } from "@/store/slices/wishlistSlice";
import { useEffect } from "react";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(initCart());
    dispatch(initWishlist());
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
