"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, type ReactElement } from "react";
import {
  BOTTOM_NAV_ITEMS,
  type BottomNavItem,
} from "@/lib/nav/siteNav";
import { HEADER_CHROME } from "@/lib/layout/breakpoints";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/utils";

type HeaderBottomNavProps = Readonly<{
  onOpenCategories: () => void;
  /** When true, Categories tab looks active (drawer open). */
  categoriesOpen?: boolean;
}>;

type BottomNavBadgeProps = Readonly<{
  count: number;
}>;

function BottomNavBadge({ count }: BottomNavBadgeProps): ReactElement | null {
  if (count <= 0) return null;
  const label = count > 99 ? "99+" : String(count);
  return (
    <span className="absolute -right-1 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-0.5 text-[9px] font-bold text-accent-foreground">
      {label}
    </span>
  );
}

type BottomNavButtonProps = Readonly<{
  item: BottomNavItem;
  active: boolean;
  badgeCount?: number;
  onClick?: () => void;
  href?: string;
}>;

function BottomNavButton({
  item,
  active,
  badgeCount = 0,
  onClick,
  href,
}: BottomNavButtonProps): ReactElement {
  const Icon = item.icon;
  const className = cn(
    "relative flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 px-1 pt-1 text-[10px] font-medium transition-colors",
    active
      ? "text-primary"
      : "text-muted-foreground hover:text-foreground",
  );

  const content = (
    <>
      <span className="relative inline-flex">
        <Icon
          className={cn("h-5 w-5", active && "stroke-[2.25]")}
          aria-hidden
        />
        <BottomNavBadge count={badgeCount} />
      </span>
      <span className={cn(active && "font-semibold")}>{item.label}</span>
      {active ? (
        <span
          className="absolute inset-x-3 top-0 h-0.5 rounded-b-sm bg-primary"
          aria-hidden
        />
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        prefetch
        className={className}
        aria-current={active ? "page" : undefined}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      aria-pressed={active || undefined}
      onClick={onClick}
    >
      {content}
    </button>
  );
}

/**
 * Mobile / tablet bottom navigation (`lg:hidden`).
 * Categories opens the drawer; Cart opens the cart drawer.
 */
export function HeaderBottomNav({
  onOpenCategories,
  categoriesOpen = false,
}: HeaderBottomNavProps): ReactElement {
  const pathname = usePathname() ?? "/";
  const { totalItems, setIsCartOpen, isCartHydrated } = useCart();

  const cartBadge = isCartHydrated ? totalItems : 0;

  const handleAction = useCallback(
    (action: "categories" | "cart") => {
      if (action === "categories") {
        onOpenCategories();
        return;
      }
      setIsCartOpen(true);
    },
    [onOpenCategories, setIsCartOpen],
  );

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-md",
        HEADER_CHROME.bottomNav,
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-lg items-stretch">
        {BOTTOM_NAV_ITEMS.map((item) => {
          if (item.kind === "action") {
            const active =
              item.action === "categories" ? categoriesOpen : false;
            return (
              <BottomNavButton
                key={item.id}
                item={item}
                active={active}
                badgeCount={item.action === "cart" ? cartBadge : 0}
                onClick={() => handleAction(item.action)}
              />
            );
          }

          return (
            <BottomNavButton
              key={item.id}
              item={item}
              active={item.isActive(pathname)}
              href={item.href}
            />
          );
        })}
      </div>
    </nav>
  );
}

export default HeaderBottomNav;
