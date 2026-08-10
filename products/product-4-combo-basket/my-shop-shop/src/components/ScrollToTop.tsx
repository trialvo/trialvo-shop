"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTop() {
 const [visible, setVisible] = useState(false);

 useEffect(() => {
  const onScroll = () => setVisible(window.scrollY > 300);
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
 }, []);

 return (
  <button
   onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
   aria-label="উপরে যান"
   className={`fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-[#e91e63] text-white shadow-lg ring-4 ring-[#e91e63]/20 transition-all duration-300 hover:bg-[#c2185b] hover:scale-110 hover:shadow-xl focus:outline-none ${visible
     ? "translate-y-0 opacity-100"
     : "translate-y-4 opacity-0 pointer-events-none"
    }`}
  >
   <ArrowUp className="h-5 w-5" />
  </button>
 );
}
