"use client";

import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { useAuth } from "@/hooks/useAuth";
import { useAppDispatch } from "@/store";
import { initAuth } from "@/store/slices/authSlice";
import { initCart } from "@/store/slices/cartSlice";
import { initOrders } from "@/store/slices/orderSlice";
import { initWishlist } from "@/store/slices/wishlistSlice";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AccountLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    dispatch(initCart());
    dispatch(initAuth());
    dispatch(initWishlist());
    dispatch(initOrders());
  }, [dispatch]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
