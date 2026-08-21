"use client";

import Header from "@/components/header/Header";
import MobileHeader from "@/components/header/MobileHeader";
import { useHideHeaderOnScroll } from "@/hooks/useHideHeaderOnScroll";
import { cn } from "@/lib/utils";

const headerSlide =
  "transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";

export default function HeaderScrollChrome() {
  const headerHidden = useHideHeaderOnScroll();

  return (
    <>
      <div className="hidden min-[768px]:sticky min-[768px]:top-0 min-[768px]:z-50 min-[768px]:block">
        <Header />
      </div>

      <div className="block min-[768px]:hidden">
        <MobileHeader
          className={cn(headerSlide, headerHidden && "-translate-y-full")}
        />
      </div>
    </>
  );
}
