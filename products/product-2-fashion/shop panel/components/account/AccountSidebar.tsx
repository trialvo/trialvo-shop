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
  { key: "account-details", labelKey: "account.sidebar.accountDetails", href: "/account",                  icon: <User     className="h-5 w-5" /> },
  { key: "my-order",        labelKey: "account.sidebar.myOrder",        href: "/account/orders",           icon: <ShoppingCart className="h-5 w-5" /> },
  { key: "my-reports",      labelKey: "account.sidebar.myReports",      href: "/account/my-reports",       icon: <FileText className="h-5 w-5" /> },
  // { key: "my-contact",      labelKey: "account.sidebar.myContact",      href: "/account/my-contact",       icon: <Mail className="h-5 w-5" /> },
  { key: "address-book",    labelKey: "account.sidebar.addressBook",    href: "/account/address",          icon: <MapPin   className="h-5 w-5" /> },
  { key: "favorite-list",   labelKey: "account.sidebar.favoriteList",   href: "/account/favorites",        icon: <Heart    className="h-5 w-5" /> },
  { key: "change-password", labelKey: "account.sidebar.changePassword", href: "/account/change-password", icon: <Lock     className="h-5 w-5" /> },
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

  return (
    <>
      <div className="lg:hidden">
        <div className="relative bg-white shadow-[0px_0px_10px_rgba(0,0,0,0.10)]">
          <button
            type="button"
            aria-label={t("account.sidebar.scrollLeft")}
            onClick={() => scrollByAmount("left")}
            className={cn(
              "absolute left-0 top-0 bottom-0 z-10",
              "w-10 grid place-items-center",
              "bg-white/95",
              "shadow-[6px_0_18px_rgba(0,0,0,0.06)]",
              "transition-opacity cursor-pointer",
              canScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none",
            )}
          >
            <span className="text-xl leading-none">
              <FiChevronLeft />
            </span>
          </button>

          <button
            type="button"
            aria-label={t("account.sidebar.scrollRight")}
            onClick={() => scrollByAmount("right")}
            className={cn(
              "absolute right-0 top-0 bottom-0 z-10",
              "w-10 grid place-items-center",
              "bg-white/95",
              "shadow-[-6px_0_18px_rgba(0,0,0,0.06)]",
              "transition-opacity cursor-pointer",
              canScrollRight ? "opacity-100" : "opacity-0 pointer-events-none",
            )}
          >
            <span className="text-xl leading-none">
              <FiChevronRight />
            </span>
          </button>

          <div
            ref={scrollerRef}
            className={cn(
              "flex items-stretch gap-2 px-3 py-3",
              "overflow-x-auto",
              "[-webkit-overflow-scrolling:touch]",
              "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
              canScrollLeft ? "pl-12" : "pl-3",
              canScrollRight ? "pr-12" : "pr-3",
            )}
          >
            {NAV?.map((item) => {
              const active = item.key === activeKey;

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  ref={active ? activeItemRef : undefined}
                  className={cn(
                    "shrink-0",
                    "inline-flex items-center gap-2",
                    "px-3 py-2",
                    "border border-black/10",
                    "text-sm font-semibold cursor-pointer",
                    "transition",
                    active ? "bg-black text-white border-black" : "bg-white text-black hover:bg-black/5",
                  )}
                >
                  <span className={cn(active ? "text-white" : "text-black")}>{item.icon}</span>
                  <span className="whitespace-nowrap">{t(item.labelKey)}</span>
                </Link>
              );
            })}

            <button
              type="button"
              onClick={() => {
                logout();
                if (typeof window !== "undefined") window.location.replace("/sign-in");
              }}
              className={cn(
                "shrink-0",
                "inline-flex items-center gap-2",
                "px-3 py-2",
                "border border-black/10",
                "text-sm font-semibold",
                "bg-white text-black hover:bg-black/5 cursor-pointer",
              )}
            >
              <LogOut className="h-5 w-5" />
              <span className="whitespace-nowrap">{t("account.sidebar.logout")}</span>
            </button>
          </div>
        </div>
      </div>

      <aside className="hidden lg:block border-0 shadow-[0px_0px_10px_rgba(0,0,0,0.12)] bg-white h-[80dvh] sticky top-20">
        <div className="pt-1">
          <nav className="space-y-2">
            {NAV.map((item) => {
              const active = item.key === activeKey;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm font-semibold transition",
                    active ? "bg-black text-white" : "bg-white text-black hover:bg-black/5",
                  )}
                >
                  {item.icon}
                  <span>{t(item.labelKey)}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-10 border-t border-[#F1F1F1] pt-6">
            <button
              type="button"
              onClick={() => {
                logout();
                if (typeof window !== "undefined") window.location.replace("/sign-in");
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-black hover:bg-black/5"
            >
              <LogOut className="h-5 w-5" />
              {t("account.sidebar.logout")}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AccountSidebar;
