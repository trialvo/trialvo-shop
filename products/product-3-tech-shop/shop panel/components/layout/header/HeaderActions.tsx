"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { GitCompare, Heart, ShoppingCart } from "lucide-react";
import { AppButton } from "@/components/shared/AppButton";
import { useCart } from "@/hooks/useCart";
import { useCompare } from "@/hooks/useCompare";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/hooks/useAuth";
import { HeaderAccountControl } from "@/components/layout/header/HeaderAccountControl";
import { cn } from "@/lib/utils";

/**
 * - `phone`: account only (cart / wishlist / compare → bottom nav or hidden)
 * - `tablet`: account + compare + cart/wishlist (768–1023, more room)
 * - `laptop`: full cluster
 * - `full`: always show everything
 */
export type HeaderActionsDensity = "phone" | "tablet" | "laptop" | "full";

type HeaderActionsProps = Readonly<{
  density?: HeaderActionsDensity;
  className?: string;
}>;

type CountBadgeProps = Readonly<{
  count: number;
}>;

function CountBadge({ count }: CountBadgeProps): ReactElement | null {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
      {count > 99 ? "99+" : count}
    </span>
  );
}

type Visibility = Readonly<{
  wishlist: boolean;
  compare: boolean;
  cart: boolean;
}>;

function visibilityForDensity(density: HeaderActionsDensity): Visibility {
  switch (density) {
    case "phone":
      return { wishlist: false, compare: false, cart: false };
    case "tablet":
      return { wishlist: true, compare: true, cart: true };
    case "laptop":
    case "full":
      return { wishlist: true, compare: true, cart: true };
    default: {
      const _exhaustive: never = density;
      return _exhaustive;
    }
  }
}

/**
 * Header cart / wishlist / compare / account cluster.
 */
export function HeaderActions({
  density = "full",
  className,
}: HeaderActionsProps): ReactElement {
  const { totalItems, setIsCartOpen, isCartHydrated } = useCart();
  const { filledCount, isHydrated: isCompareHydrated } = useCompare();
  const { wishlist, isReady: isWishlistReady } = useWishlist();
  const { isAuthenticated } = useAuth();

  const wishlistHref = isAuthenticated
    ? "/account?tab=wishlist"
    : "/wishlist";

  const cartBadgeCount = isCartHydrated ? totalItems : 0;
  const wishlistBadgeCount = isWishlistReady ? wishlist.length : 0;
  const compareBadgeCount = isCompareHydrated ? filledCount : 0;

  const visible = visibilityForDensity(density);

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 sm:gap-1",
        density === "phone" ? "" : "md:gap-1.5",
        className,
      )}
    >
      <HeaderAccountControl />

      {visible.wishlist ? (
        <Link href={wishlistHref} className="relative" aria-label="Wishlist">
          <AppButton variant="ghost" size="icon">
            <Heart className="h-5 w-5" aria-hidden />
            <CountBadge count={wishlistBadgeCount} />
          </AppButton>
        </Link>
      ) : null}

      {visible.compare ? (
        <Link
          href="/compare"
          className="relative"
          aria-label="Compare products"
        >
          <AppButton variant="ghost" size="icon">
            <GitCompare className="h-5 w-5" aria-hidden />
            <CountBadge count={compareBadgeCount} />
          </AppButton>
        </Link>
      ) : null}

      {visible.cart ? (
        <AppButton
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Open cart"
          onClick={() => setIsCartOpen(true)}
        >
          <ShoppingCart className="h-5 w-5" aria-hidden />
          <CountBadge count={cartBadgeCount} />
        </AppButton>
      ) : null}
    </div>
  );
}

export default HeaderActions;
