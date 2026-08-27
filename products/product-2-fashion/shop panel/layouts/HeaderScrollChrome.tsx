"use client";

import Header from "@/components/header/Header";
import MobileHeader from "@/components/header/MobileHeader";

export default function HeaderScrollChrome() {
  return (
    <>
      <div className="hidden min-[768px]:sticky min-[768px]:top-0 min-[768px]:z-50 min-[768px]:block">
        <Header />
      </div>

      <div className="block min-[768px]:hidden">
        <MobileHeader />
      </div>
    </>
  );
}
