"use client";

import { shouldHideBottomNav } from "@/lib/routeMatchers";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import React from "react";
import BottomNavItem from "./BottomNavItem";
import { BOTTOM_NAV_KEYS } from "./bottomNav.config";
import { useTranslation } from "@/hooks/useTranslation";
import type { BottomNavItemConfig } from "./bottomNav.types";

type Props = {
  className?: string;
};

const BottomNav: React.FC<Props> = ({ className }) => {
  const pathname = usePathname();
  const hidden = shouldHideBottomNav(pathname);
  const { t } = useTranslation();

  const items: BottomNavItemConfig[] = React.useMemo(
    () => BOTTOM_NAV_KEYS.map((item) => ({ ...item, label: t(item.tk) })),
    [t],
  );

  const activeIndex = React.useMemo(() => {
    const idx = items.findIndex((it) =>
      it.match ? it.match(pathname) : pathname.startsWith(it.href)
    );
    return Math.max(idx, 0);
  }, [pathname, items]);

  const indicatorWidth = 100;
  const indicatorHeight = 2;

  return (
    <nav
      aria-label="Bottom Navigation"
      className={cn(
        "max-[500px]:block hidden",
        "fixed inset-x-0 bottom-0 left-0 right-0 z-60 bg-white",
        "shadow-[0px_-4px_20px_rgba(0,0,0,0.08)]",
        "transition-all duration-200 ease-out",
        hidden ? "translate-y-2 opacity-0 pointer-events-none" : "translate-y-0 opacity-100",
        className,
      )}
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="relative h-15.25">
        <div className="grid h-full grid-cols-4">
          {items.map((item, idx) => (
            <BottomNavItem
              key={item.key}
              item={item}
              active={idx === activeIndex}
            />
          ))}
        </div>

        <div
          aria-hidden
          className={cn(
            "absolute top-0 left-0",
            "rounded-full bg-[#000000]",
            "transition-all duration-300 ease-out"
          )}
          style={{
            width: indicatorWidth,
            height: indicatorHeight,
            left: `calc((100% / 4) * ${activeIndex} + ((100% / 4) - ${indicatorWidth}px) / 2)`,
          }}
        />
      </div>
    </nav>
  );
};

export default BottomNav;
