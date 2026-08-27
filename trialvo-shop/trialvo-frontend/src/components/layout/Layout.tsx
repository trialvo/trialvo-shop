"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { cn } from "@/lib/utils";

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: Readonly<LayoutProps>) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className={cn("flex-1", !isHome && "pt-16 md:pt-[4.5rem]")}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
