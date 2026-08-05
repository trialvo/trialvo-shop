"use client";

import dynamic from "next/dynamic";
import ServicesBar from "@/components/services-bar/ServicesBar";
import { useViewApi } from "@/hooks/useViewApi";
import { useEffect } from "react";
import HeroSliderWrapper from "./HeroSliderWrapper";

import WhatsAppFloatingButton from "@/components/common/WhatsAppFloatingButton";
import { useAuth } from "@/hooks/useAuth";
import { useClientIp } from "@/hooks/useClientIp";
import { useAppDispatch } from "@/redux/hooks";
import { openModal } from "@/redux/slices/modalManagerSlice";

/* ── Below-fold components: lazy-loaded to reduce initial JS bundle ── */
const VideoSection = dynamic(() => import("./VideoSection"), {
 ssr: false,
 loading: () => (
  <section className="container mx-auto mb-3 md:mb-10">
   <div className="h-50 w-full animate-pulse rounded bg-gray-100 sm:h-auto sm:aspect-16/8" />
  </section>
 ),
});

const CategorySection = dynamic(() => import("./CategorySection"), {
 ssr: false,
 loading: () => (
  <section className="container mx-auto">
   <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 xl:grid-cols-5">
    {Array.from({ length: 10 }).map((_, i) => (
     <div key={i} className="aspect-square animate-pulse rounded-xl bg-gray-100" />
    ))}
   </div>
  </section>
 ),
});

const FeatureProducts = dynamic(
 () => import("./(feature-products)/FeatureProducts"),
 {
  ssr: false,
  loading: () => (
   <section className="container mx-auto mb-15.5">
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
     {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="h-64 animate-pulse rounded bg-gray-100" />
     ))}
    </div>
   </section>
  ),
 },
);

export default function HomeClient() {
 const { mutate: recordView } = useViewApi();

 const dispatch = useAppDispatch();
 const { user, isAuthenticated } = useAuth();

 const { ip, isLoading } = useClientIp();

 useEffect(() => {
  if (isLoading) return;

  // Defer view recording until browser is idle — non-critical analytics
  const schedule =
   typeof window !== "undefined" && "requestIdleCallback" in window
    ? window.requestIdleCallback
    : (cb: () => void) => setTimeout(cb, 100);

  const id = schedule(() => {
   recordView({
    page_name: "landing",
    ip: (ip ?? "").trim() || "unknown",
   });
  });

  return () => {
   if (typeof window !== "undefined" && "cancelIdleCallback" in window) {
    window.cancelIdleCallback(id as number);
   }
  };
 }, [ip, isLoading, recordView]);

 useEffect(() => {
  if (!isAuthenticated) return;
  if (!user) return;
  if (user?.has_password) return;

  dispatch(openModal({ key: "changePassword" }));
 }, [dispatch, isAuthenticated, user]);

 return (
  <main className="font-sans dark:bg-black max-[501px]:pt-11.5">
   <HeroSliderWrapper />
   <ServicesBar className="my-4 sm:my-10" />
   <div className="px-2 md:px-0">
    <VideoSection />
    <CategorySection />
    <FeatureProducts />
   </div>
   <WhatsAppFloatingButton />
  </main>
 );
}
