"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useCategory } from "@/hooks/useCategory";
import { useStorefrontVisibility } from "@/hooks/useStorefrontVisibility";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { FaWhatsapp } from "react-icons/fa";
import { FiGitCommit, FiHelpCircle, FiLayers, FiMessageSquare, FiTag } from "react-icons/fi";

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

function AddonItem({
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

export default function HeaderAddonLinks() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { subCategories } = useCategory();
  const { showMegaSale, visibilityLoading } = useStorefrontVisibility();

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

  if (visibleLinks.length === 0 && !visibilityLoading) return null;

  return (
    <div className="fixed right-0 top-[45%] z-40 -translate-y-1/2 max-[500px]:top-[42%] min-[768px]:top-1/2 min-[768px]:z-50">
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
          <AddonItem
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
  );
}
