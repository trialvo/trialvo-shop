"use client";

import { useLogout } from "@/hooks/useLogout";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import { FileText, Heart, Lock, LogOut, MapPin, ShoppingCart, User } from "lucide-react";
import Link from "next/link";
import React from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import type { AccountNavKey } from "./types";

type NavItem = {
  key: AccountNavKey;
  labelKey: string;
  href: string;
  icon: React.ReactNode;
};

type Props = {
  activeKey: AccountNavKey;
};

const NAV: NavItem[] = [
  { key: "account-details", labelKey: "account.sidebar.accountDetails", href: "/account", icon: <User className="h-4 w-4" /> },
  { key: "my-order", labelKey: "account.sidebar.myOrder", href: "/account/orders", icon: <ShoppingCart className="h-4 w-4" /> },
  { key: "my-reports", labelKey: "account.sidebar.myReports", href: "/account/my-reports", icon: <FileText className="h-4 w-4" /> },
  { key: "address-book", labelKey: "account.sidebar.addressBook", href: "/account/address", icon: <MapPin className="h-4 w-4" /> },
  { key: "favorite-list", labelKey: "account.sidebar.favoriteList", href: "/account/favorites", icon: <Heart className="h-4 w-4" /> },
  { key: "change-password", labelKey: "account.sidebar.changePassword", href: "/account/change-password", icon: <Lock className="h-4 w-4" /> },
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

const AccountSidebar: React.FC<Props> = ({ activeKey }) => {
  const logout = useLogout();
  const { t } = useTranslation();

  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  const activeItemRef = React.useRef<HTMLAnchorElement | null>(null);

  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const updateArrows = React.useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const maxLeft = el.scrollWidth - el.clientWidth;
    const left = el.scrollLeft;

    setCanScrollLeft(left > 1);
    setCanScrollRight(left < maxLeft - 1);
  }, []);

  React.useEffect(() => {
    updateArrows();

    const el = scrollerRef.current;
    if (!el) return;

    const onScroll = () => updateArrows();
    el.addEventListener("scroll", onScroll, { passive: true });

    const ro = new ResizeObserver(() => updateArrows());
    ro.observe(el);

    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [updateArrows]);

  React.useEffect(() => {
    updateArrows();
  }, [activeKey, updateArrows]);

  React.useEffect(() => {
    const el = activeItemRef.current;
    if (!el) return;

    el.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeKey]);

  const scrollByAmount = (dir: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;

    const step = Math.max(220, Math.floor(el.clientWidth * 0.8));
    const next = dir === "left" ? el.scrollLeft - step : el.scrollLeft + step;

    el.scrollTo({
      left: clamp(next, 0, el.scrollWidth - el.clientWidth),
      behavior: "smooth",
    });
  };

  const handleLogout = () => {
    logout();
    if (typeof window !== "undefined") window.location.replace("/sign-in");
  };

  return (
    <>
      <div className="min-[992px]:hidden">
        <div className="relative rounded-md border border-[#E5E5E5] bg-white">
          <button
            type="button"
            aria-label={t("account.sidebar.scrollLeft")}
            onClick={() => scrollByAmount("left")}
            className={cn(
              "absolute bottom-0 left-0 top-0 z-10 grid w-9 place-items-center bg-white/95",
              "transition-opacity duration-200 ease-out",
              canScrollLeft ? "opacity-100" : "pointer-events-none opacity-0",
            )}
          >
            <FiChevronLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            aria-label={t("account.sidebar.scrollRight")}
            onClick={() => scrollByAmount("right")}
            className={cn(
              "absolute bottom-0 right-0 top-0 z-10 grid w-9 place-items-center bg-white/95",
              "transition-opacity duration-200 ease-out",
              canScrollRight ? "opacity-100" : "pointer-events-none opacity-0",
            )}
          >
            <FiChevronRight className="h-4 w-4" />
          </button>

          <div
            ref={scrollerRef}
            className={cn(
              "flex items-stretch gap-1.5 overflow-x-auto px-3 py-2",
              "scroll-smooth [-webkit-overflow-scrolling:touch]",
              canScrollLeft ? "pl-10" : "pl-3",
              canScrollRight ? "pr-10" : "pr-3",
            )}
          >
            {NAV.map((item) => {
              const active = item.key === activeKey;

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  ref={active ? activeItemRef : undefined}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                    "transition-[color,background-color,border-color] duration-200 ease-out",
                    active
                      ? "bg-black text-white"
                      : "border border-transparent text-black/70 hover:bg-black/[0.04] hover:text-black",
                  )}
                >
                  <span className="transition-transform duration-200 ease-out">{item.icon}</span>
                  <span className="whitespace-nowrap">{t(item.labelKey)}</span>
                </Link>
              );
            })}

            <button
              type="button"
              onClick={handleLogout}
              className={cn(
                "inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-black/70",
                "transition-[color,background-color] duration-200 ease-out hover:bg-black/[0.04] hover:text-black",
              )}
            >
              <LogOut className="h-4 w-4" />
              <span className="whitespace-nowrap">{t("account.sidebar.logout")}</span>
            </button>
          </div>
        </div>
      </div>

      <aside className="sticky top-[calc(var(--shop-header-offset,72px)+12px)] hidden h-fit overflow-hidden rounded-md border border-[#E5E5E5] bg-white min-[992px]:block">
        <nav className="py-1.5">
          {NAV.map((item) => {
            const active = item.key === activeKey;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 px-4 py-2.5 text-sm font-medium",
                  "transition-[color,background-color] duration-200 ease-out",
                  active
                    ? "bg-black/[0.04] text-black"
                    : "text-black/70 hover:bg-black/[0.03] hover:text-black",
                )}
              >
                <span
                  className={cn(
                    "absolute inset-y-1.5 left-0 w-[3px] rounded-r-full bg-black",
                    "transition-opacity duration-200 ease-out",
                    active ? "opacity-100" : "opacity-0 group-hover:opacity-30",
                  )}
                  aria-hidden
                />
                <span
                  className={cn(
                    "transition-colors duration-200 ease-out",
                    active ? "text-black" : "text-black/50 group-hover:text-black",
                  )}
                >
                  {item.icon}
                </span>
                <span>{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[#E5E5E5]">
          <button
            type="button"
            onClick={handleLogout}
            className={cn(
              "flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-sm font-medium text-black/70",
              "transition-[color,background-color] duration-200 ease-out hover:bg-black/[0.03] hover:text-black",
            )}
          >
            <LogOut className="h-4 w-4 text-black/50" />
            {t("account.sidebar.logout")}
          </button>
        </div>
      </aside>
    </>
  );
};

export default AccountSidebar;
