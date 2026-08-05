"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useCategory } from "@/hooks/useCategory";
import { useStorefrontVisibility } from "@/hooks/useStorefrontVisibility";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { FiGitCommit, FiLayers, FiTag } from "react-icons/fi";

type AddonLink = {
  key: string;
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  show: boolean;
};

export default function HeaderAddonLinks() {
  const pathname = usePathname();
  const { subCategories } = useCategory();
  const { showMegaSale, visibilityLoading } = useStorefrontVisibility();

  const hasCategories = subCategories.length > 0;

  const isCompareActive =
    pathname === "/compare" || pathname?.startsWith("/compare/");
  const isOffersActive =
    pathname === "/offers" || pathname?.startsWith("/offers/");
  const isMegaSaleActive =
    pathname === "/megasale" || pathname?.startsWith("/megasale/");

  const links: AddonLink[] = React.useMemo(
    () => [
      {
        key: "compare",
        href: "/compare",
        label: "Compare",
        icon: <FiGitCommit className="h-[18px] w-[18px]" />,
        isActive: isCompareActive,
        show: hasCategories,
      },
      {
        key: "offers",
        href: "/offers",
        label: "Offers",
        icon: <FiLayers className="h-[18px] w-[18px]" />,
        isActive: isOffersActive,
        show: hasCategories,
      },
      {
        key: "megasale",
        href: "/megasale",
        label: "Mega Sale",
        icon: <FiTag className="h-[18px] w-[18px]" />,
        isActive: isMegaSaleActive,
        show: hasCategories && showMegaSale,
      },
    ],
    [hasCategories, showMegaSale, isCompareActive, isOffersActive, isMegaSaleActive],
  );

  const visibleLinks = links.filter((l) => l.show);

  if (!hasCategories) return null;

  return (
    <div className="fixed right-0 top-1/2 z-50 -translate-y-1/2 hidden sm:block">
      <nav className="flex flex-col gap-[1px]" aria-label="Quick links">
        {visibleLinks.map((link, idx) => {
          const isFirst = idx === 0;
          const isLast = idx === visibleLinks.length - 1;

          return (
            <Link
              key={link.key}
              href={link.href}
              className={cn(
                "group relative flex h-10 w-10 items-center justify-center transition-all duration-200 sm:h-11 sm:w-11",
                isFirst && "rounded-tl-lg",
                isLast && "rounded-bl-lg",
                link.isActive
                  ? "bg-black text-white shadow-[-4px_0px_12px_rgba(0,0,0,0.15)]"
                  : "bg-white text-black/70 shadow-[-2px_0px_8px_rgba(0,0,0,0.08)] hover:bg-black hover:text-white hover:shadow-[-4px_0px_12px_rgba(0,0,0,0.15)]",
              )}
            >
              <span className="transition-transform duration-200 group-hover:scale-110">
                {link.icon}
              </span>

              {link.isActive && (
                <span className="absolute left-0 top-0 h-full w-[3px] bg-white/30" />
              )}

              <span
                className={cn(
                  "pointer-events-none absolute right-full mr-2.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-[11px] font-semibold tracking-wide shadow-lg sm:text-xs",
                  "bg-black text-white",
                  "opacity-0 translate-x-1 transition-all duration-200 ease-out",
                  "group-hover:opacity-100 group-hover:translate-x-0",
                )}
              >
                {link.label}
                <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[3px] rotate-45 h-2 w-2 bg-black" />
              </span>
            </Link>
          );
        })}

        {hasCategories && visibilityLoading && (
          <div className="flex h-10 w-10 items-center justify-center bg-white shadow-[-2px_0px_8px_rgba(0,0,0,0.08)] sm:h-11 sm:w-11">
            <Skeleton className="h-5 w-5 rounded-full" />
          </div>
        )}
      </nav>
    </div>
  );
}
