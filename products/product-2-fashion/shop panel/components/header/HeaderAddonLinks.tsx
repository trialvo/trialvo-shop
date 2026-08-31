"use client";

import { Skeleton } from "@/components/ui/skeleton";
import ScrollToTopButton from "@/components/common/ScrollToTopButton";
import { useCategory } from "@/hooks/useCategory";
import { useScrollTopVisibleListener } from "@/hooks/useScrollTopVisible";
import { useStorefrontVisibility } from "@/hooks/useStorefrontVisibility";
import { useTranslation } from "@/hooks/useTranslation";
import { shouldHideBottomNav } from "@/lib/routeMatchers";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { FaWhatsapp } from "react-icons/fa";
import {
  FiGitCommit,
  FiGrid,
  FiHelpCircle,
  FiLayers,
  FiMessageSquare,
  FiTag,
  FiX,
} from "react-icons/fi";

const WHATSAPP_HREF = "https://wa.me/+8801970680283";
const ICON = "h-4 w-4 min-[576px]:h-[18px] min-[576px]:w-[18px] min-[768px]:h-5 min-[768px]:w-5";
const MOTION = "duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]";
const ITEM_BOX =
  "h-11 w-11 min-[576px]:h-12 min-[576px]:w-12 min-[768px]:h-14 min-[768px]:w-14";
const RAIL_W = "w-11 min-[576px]:w-12 min-[768px]:w-14";

type AddonLink = {
  key: string;
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  show: boolean;
  external?: boolean;
};

function DesktopAddonItem({
  href,
  label,
  icon,
  isActive,
  external,
}: Omit<AddonLink, "key" | "show">) {
  const className = cn(
    "group relative z-0 flex items-center justify-center",
    ITEM_BOX,
    "border-b border-black/6 last:border-b-0",
    "transition-colors",
    MOTION,
    "focus-visible:z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40",
    isActive
      ? "bg-primary text-primary-foreground"
      : "bg-transparent text-[#191919] hover:bg-[#FAF8F5] hover:text-black",
  );

  const inner = (
    <>
      <span
        className={cn(
          "pointer-events-none absolute top-0 right-full hidden items-center whitespace-nowrap rounded-l-lg pl-3.5 pr-3",
          "h-11 min-[576px]:h-12 min-[768px]:flex min-[768px]:h-14",
          "text-[13px] font-semibold tracking-tight",
          "translate-x-2 opacity-0",
          "transition-[transform,opacity]",
          MOTION,
          "min-[768px]:group-hover:pointer-events-auto min-[768px]:group-hover:translate-x-0 min-[768px]:group-hover:opacity-100",
          "min-[768px]:group-focus-visible:pointer-events-auto min-[768px]:group-focus-visible:translate-x-0 min-[768px]:group-focus-visible:opacity-100",
          isActive
            ? "bg-primary text-primary-foreground"
            : "bg-white text-[#191919] shadow-[-8px_4px_20px_rgba(20,16,12,0.08)] group-hover:bg-[#FAF8F5]",
        )}
      >
        {label}
      </span>
      <span className="relative z-10 grid place-items-center">{icon}</span>
    </>
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className={className}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link href={href} aria-label={label} className={className}>
      {inner}
    </Link>
  );
}

function MobileAddonRow({
  href,
  label,
  icon,
  isActive,
  external,
  onNavigate,
  style,
}: Omit<AddonLink, "key" | "show"> & {
  onNavigate: () => void;
  style?: React.CSSProperties;
}) {
    const className = cn(
    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-[colors,transform,opacity]",
    MOTION,
    isActive
      ? "bg-[#191919] text-white"
      : "bg-transparent text-[#191919] active:bg-[#F3F1ED]",
  );

  const inner = (
    <>
      <span
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
          isActive ? "bg-white/10" : "bg-[#F3F1ED]",
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 truncate text-[13px] font-semibold tracking-tight">
        {label}
      </span>
    </>
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        style={style}
        onClick={onNavigate}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link href={href} className={className} style={style} onClick={onNavigate}>
      {inner}
    </Link>
  );
}

export default function HeaderAddonLinks() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { subCategories } = useCategory();
  const { showMegaSale, visibilityLoading } = useStorefrontVisibility();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const liftForNav = !shouldHideBottomNav(pathname);
  const scrollTopVisible = useScrollTopVisibleListener();

  const hasCategories = subCategories.length > 0;

  const isCompareActive =
    pathname === "/compare" || pathname?.startsWith("/compare/");
  const isOffersActive =
    pathname === "/offers" || pathname?.startsWith("/offers/");
  const isMegaSaleActive =
    pathname === "/megasale" || pathname?.startsWith("/megasale/");
  const isContactActive =
    pathname === "/contact-us" || pathname?.startsWith("/contact-us/");
  const isFaqsActive =
    pathname === "/faqs" || pathname?.startsWith("/faqs/");

  const links: AddonLink[] = React.useMemo(
    () => [
      {
        key: "whatsapp",
        href: WHATSAPP_HREF,
        label: t("header.addon.whatsapp"),
        icon: <FaWhatsapp className={cn(ICON, "text-[#25D366]")} />,
        isActive: false,
        show: true,
        external: true,
      },
      {
        key: "contact",
        href: "/contact-us",
        label: t("header.addon.contact"),
        icon: <FiMessageSquare className={ICON} strokeWidth={2} />,
        isActive: isContactActive,
        show: true,
      },
      {
        key: "compare",
        href: "/compare",
        label: t("header.addon.compare"),
        icon: <FiGitCommit className={ICON} strokeWidth={2} />,
        isActive: isCompareActive,
        show: hasCategories,
      },
      {
        key: "offers",
        href: "/offers",
        label: t("header.addon.offers"),
        icon: <FiLayers className={ICON} strokeWidth={2} />,
        isActive: isOffersActive,
        show: hasCategories,
      },
      {
        key: "megasale",
        href: "/megasale",
        label: t("header.addon.megaSale"),
        icon: <FiTag className={ICON} strokeWidth={2} />,
        isActive: isMegaSaleActive,
        show: hasCategories && showMegaSale,
      },
      {
        key: "faqs",
        href: "/faqs",
        label: t("header.addon.help"),
        icon: <FiHelpCircle className={ICON} strokeWidth={2} />,
        isActive: isFaqsActive,
        show: true,
      },
    ],
    [
      t,
      hasCategories,
      showMegaSale,
      isCompareActive,
      isOffersActive,
      isMegaSaleActive,
      isContactActive,
      isFaqsActive,
    ],
  );

  const visibleLinks = links.filter((l) => l.show);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!mobileOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  if (visibleLinks.length === 0 && !visibilityLoading) return null;

  return (
    <>
      {/* Desktop / tablet rail — unchanged above 500px */}
      <div className="fixed right-0 top-1/2 z-50 hidden -translate-y-1/2 min-[501px]:block">
        <nav
          aria-label="Quick links"
          className="relative flex flex-col items-end rounded-l-xl min-[768px]:rounded-l-2xl"
        >
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-y-0 right-0 rounded-l-xl border border-r-0 border-black/8 bg-white shadow-[-8px_12px_28px_rgba(20,16,12,0.12)]",
              "min-[768px]:rounded-l-2xl",
              RAIL_W,
            )}
          />

          {visibleLinks.map((link) => (
            <DesktopAddonItem
              key={link.key}
              href={link.href}
              label={link.label}
              icon={link.icon}
              isActive={link.isActive}
              external={link.external}
            />
          ))}

          {visibilityLoading ? (
            <div
              className={cn(
                "relative z-10 flex items-center justify-center border-t border-black/6 bg-white",
                ITEM_BOX,
              )}
            >
              <Skeleton className="h-4 w-4 rounded-full min-[768px]:h-5 min-[768px]:w-5" />
            </div>
          ) : null}
        </nav>
      </div>

      {/* Mobile expandable quick menu — ≤500px only */}
      <div className="pointer-events-none fixed inset-0 z-[55] max-[500px]:block min-[501px]:hidden">
        <button
          type="button"
          aria-hidden={!mobileOpen}
          tabIndex={mobileOpen ? 0 : -1}
          className={cn(
            "absolute inset-0 bg-black/30 transition-opacity",
            MOTION,
            mobileOpen
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0",
          )}
          onClick={() => setMobileOpen(false)}
        />

        <div
          className={cn(
            "absolute z-[1] flex flex-col items-end gap-2.5 pointer-events-none",
            "right-3",
            "transition-[bottom]",
            MOTION,
            liftForNav
              ? "bottom-[calc(3.8125rem+0.75rem+env(safe-area-inset-bottom))]"
              : "bottom-[calc(0.75rem+env(safe-area-inset-bottom))]",
          )}
        >
          <div
            id="mobile-quick-links"
            role="menu"
            aria-label={t("header.addon.quickLinks")}
            className={cn(
              "origin-bottom-right overflow-hidden rounded-2xl border border-black/8 bg-white shadow-[0_12px_32px_rgba(20,16,12,0.16)]",
              "transition-[opacity,transform,max-height]",
              MOTION,
              mobileOpen
                ? "pointer-events-auto max-h-[70vh] translate-y-0 scale-100 opacity-100"
                : "pointer-events-none max-h-0 translate-y-2 scale-95 opacity-0",
            )}
          >
            <div className="w-[min(calc(100vw-1.5rem),16.5rem)] p-1.5">
              <div className="flex flex-col">
                {visibleLinks.map((link, index) => (
                  <MobileAddonRow
                    key={link.key}
                    href={link.href}
                    label={link.label}
                    icon={link.icon}
                    isActive={link.isActive}
                    external={link.external}
                    onNavigate={() => setMobileOpen(false)}
                    style={{
                      transitionDelay: mobileOpen ? `${40 + index * 30}ms` : "0ms",
                    }}
                  />
                ))}

                {visibilityLoading ? (
                  <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
                    <Skeleton className="h-9 w-9 rounded-lg" />
                    <Skeleton className="h-3.5 w-24 rounded" />
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="pointer-events-auto flex flex-col items-end gap-2.5">
            <button
              type="button"
              aria-expanded={mobileOpen}
              aria-controls="mobile-quick-links"
              aria-label={
                mobileOpen
                  ? t("header.addon.closeQuickLinks")
                  : t("header.addon.openQuickLinks")
              }
              onClick={() => setMobileOpen((open) => !open)}
              className={cn(
                "grid h-11 w-11 place-items-center rounded-full bg-[#191919] text-white shadow-[0_8px_24px_rgba(20,16,12,0.18)]",
                "transition-[transform,background-color]",
                MOTION,
                "active:scale-95",
              )}
            >
              <span className="relative grid h-5 w-5 place-items-center">
                <FiGrid
                  className={cn(
                    "absolute h-5 w-5 transition-[opacity,transform]",
                    MOTION,
                    mobileOpen
                      ? "scale-75 rotate-45 opacity-0"
                      : "scale-100 rotate-0 opacity-100",
                  )}
                />
                <FiX
                  className={cn(
                    "absolute h-5 w-5 transition-[opacity,transform]",
                    MOTION,
                    mobileOpen
                      ? "scale-100 rotate-0 opacity-100"
                      : "scale-75 -rotate-45 opacity-0",
                  )}
                />
              </span>
            </button>

            <div
              className={cn(
                "grid transition-[grid-template-rows,opacity]",
                MOTION,
                scrollTopVisible
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0",
              )}
              aria-hidden={!scrollTopVisible}
            >
              <div className="min-h-0 overflow-hidden">
                <ScrollToTopButton stacked className="pointer-events-auto" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
