import React from "react";
import BrandLogo from "@/components/common/BrandLogo";
import { cn } from "@/lib/utils";

/**
 * Compact centered auth card — generic mark only, no store brand.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gray-50 p-4 dark:bg-gray-950">
      <div
        className={cn(
          "w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900",
        )}
      >
        <div className="mb-6 flex justify-center">
          <BrandLogo height={40} />
        </div>
        {children}
      </div>
    </div>
  );
}
