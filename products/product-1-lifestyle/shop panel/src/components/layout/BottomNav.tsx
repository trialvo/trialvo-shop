"use client";

import CartDrawer from "@/components/cart/CartDrawer";
import { MobileNavDrawer } from "@/components/layout/MobileNavDrawer";
import { buildNavCategories } from "@/components/layout/navigation";
import SearchOverlay from "@/components/shared/SearchOverlay";
import { useAuth } from "@/hooks/useAuth";
import { useCategory } from "@/hooks/useCategory";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store";
import { selectTotalItems } from "@/store/slices/cartSlice";
import { selectWishlistIds } from "@/store/slices/wishlistSlice";
import { Heart, Home, LayoutGrid, Search, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

/* ── BottomNav ──────────────────────────────────────────────────────── */
export function BottomNav() {
  const pathname       = usePathname();
  const totalItems     = useAppSelector(selectTotalItems);
  const wishlistIds    = useAppSelector(selectWishlistIds);
  const wishlistCount  = wishlistIds.length;
  const { categories: apiCategories } = useCategory();
  const { isAuthenticated } = useAuth();
  const navCategories = useMemo(
    () => buildNavCategories(apiCategories),
    [apiCategories],
  );

  const [menuOpen,   setMenuOpen]   = useState(false);
  const [cartOpen,   setCartOpen]   = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const closeCart = useCallback(() => setCartOpen(false), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  const tabs = [
    {
      id: "home",
      icon: Home,
      label: "Home",
      href: "/",
      active: pathname === "/",
      onClick: undefined as (() => void) | undefined,
    },
    {
      id: "categories",
      icon: LayoutGrid,
      label: "Categories",
      href: undefined,
      active: menuOpen,
      onClick: () => setMenuOpen((v) => !v),
    },
    {
      id: "search",
      icon: Search,
      label: "Search",
      href: undefined,
      active: searchOpen,
      onClick: () => setSearchOpen(true),
    },
    {
      id: "wishlist",
      icon: Heart,
      label: "Wishlist",
      href: isAuthenticated ? "/wishlist" : "/auth",
      active: pathname === "/wishlist",
      onClick: undefined,
      badge: wishlistCount,
    },
    {
      id: "cart",
      icon: ShoppingBag,
      label: "Cart",
      href: undefined,
      active: cartOpen,
      onClick: () => setCartOpen(true),
      badge: totalItems,
    },
  ] as const;

  return (
    <>
      {/* ── Bar — only visible below md (768px) ── */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-background border-t border-border/60 safe-area-bottom"
        aria-label="Bottom navigation"
      >
        <div className="grid grid-cols-5 h-14">
          {tabs.map(({ id, icon: Icon, label, href, active, onClick, ...rest }) => {
            const badge = "badge" in rest ? (rest as { badge: number }).badge : 0;
            const cls = cn(
              "relative flex flex-col items-center justify-center gap-0.5 transition-colors",
              active ? "text-accent" : "text-muted-foreground hover:text-foreground"
            );

            const inner = (
              <>
                <span className="relative">
                  <Icon size={20} strokeWidth={active ? 2 : 1.75} />
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[14px] h-[14px] rounded-full bg-accent text-accent-foreground text-[9px] font-bold flex items-center justify-center px-0.5 leading-none">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </span>
                <span className="text-[9px] tracking-[0.08em] font-medium leading-none">{label}</span>
              </>
            );

            return href ? (
              <Link key={id} href={href} className={cls} aria-label={label}>
                {inner}
              </Link>
            ) : (
              <button
                key={id}
                type="button"
                onClick={onClick}
                className={cn(cls, "cursor-pointer")}
                aria-label={label}
              >
                {inner}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Drawers / overlays triggered from bottom nav */}
      <MobileNavDrawer
        isOpen={menuOpen}
        onClose={closeMenu}
        categories={navCategories}
        wishlistCount={wishlistCount}
        isAuthenticated={isAuthenticated}
      />
      <CartDrawer   isOpen={cartOpen}   onClose={closeCart}   />
      <SearchOverlay isOpen={searchOpen} onClose={closeSearch} />
    </>
  );
}
