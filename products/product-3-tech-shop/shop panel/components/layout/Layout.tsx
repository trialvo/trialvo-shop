"use client";

import { ReactNode, useState, useEffect } from "react";
import AnnouncementBar from "./AnnouncementBar";
import Header from "./Header";
import Footer from "./Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import CompareFloatingBar from "@/components/compare/CompareFloatingBar";
import { ChevronUp } from "lucide-react";
import { AppButton } from "@/components/shared/AppButton";
import { HEADER_CHROME } from "@/lib/layout/breakpoints";
import { cn } from "@/lib/utils";

const Layout = ({ children }: { children: ReactNode }) => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div className={cn("flex min-h-screen flex-col", HEADER_CHROME.pageBottomPad)}>
      <AnnouncementBar />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
      <CompareFloatingBar />

      {showScrollTop ? (
        <AppButton
          variant="secondary"
          size="icon"
          className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] right-4 z-50 animate-in fade-in slide-in-from-bottom-4 rounded-full border border-border shadow-lg duration-300 lg:bottom-8"
          onClick={scrollToTop}
          aria-label="Scroll to top"
        >
          <ChevronUp className="h-5 w-5 text-primary" />
        </AppButton>
      ) : null}
    </div>
  );
};

export default Layout;
