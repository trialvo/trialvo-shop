"use client";

import CartDrawer from "@/components/cart/CartDrawer";
import { AnnouncementBar, ANNOUNCEMENT_MESSAGE_COUNT } from "@/components/layout/AnnouncementBar";
import { HeaderActions } from "@/components/layout/HeaderActions";
import { HeaderBrand } from "@/components/layout/HeaderBrand";
import { HeaderNavBar } from "@/components/layout/HeaderNavBar";
import { HeaderSearchBar } from "@/components/layout/HeaderSearchBar";
import { MegaMenuPanel } from "@/components/layout/MegaMenuPanel";
import { MobileNavDrawer } from "@/components/layout/MobileNavDrawer";
import { buildNavCategories } from "@/components/layout/navigation";
import SearchOverlay from "@/components/shared/SearchOverlay";
import { useAuth } from "@/hooks/useAuth";
import { useCategory } from "@/hooks/useCategory";
import { useWishlistSync } from "@/hooks/useWishlist";
import { toHeaderUser } from "@/lib/auth/user-display";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store";
import { selectTotalItems } from "@/store/slices/cartSlice";
import { selectWishlistIds } from "@/store/slices/wishlistSlice";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const DESKTOP_BREAKPOINT_PX = 1024;

/* ── Header — state orchestrator ─────────────────────────────────────── */
const Header = () => {
  const { categories: apiCategories } = useCategory();

  const navCategories = useMemo(
    () => buildNavCategories(apiCategories),
    [apiCategories],
  );

  /* Panel state */
  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [searchOpen,    setSearchOpen]    = useState(false);
  const [accountOpen,   setAccountOpen]   = useState(false);
  const [cartOpen,      setCartOpen]      = useState(false);
  const [megaMenuOpen,  setMegaMenuOpen]  = useState(false);

  /* Scroll / hide state */
  const [scrolled,      setScrolled]      = useState(false);
  const [hidden,        setHidden]        = useState(false);

  /* Announcement state */
  const [announcementIdx,     setAnnouncementIdx]     = useState(0);
  const [announcementVisible, setAnnouncementVisible] = useState(true);

  /* Refs */
  const lastScrollY = useRef(0);

  /* Redux */
  const totalItems    = useAppSelector(selectTotalItems);
  const wishlistIds   = useAppSelector(selectWishlistIds);
  const wishlistCount = wishlistIds.length;
  const {
    isAuthenticated,
    isInitialized: authInitialized,
    isLoading: authLoading,
    user,
  } = useAuth();
  const headerUser = useMemo(() => toHeaderUser(user), [user]);
  const wishlistUserKey = user?.id ?? "current";
  const isAuthPending = !authInitialized || authLoading;

  useWishlistSync({
    enabled: isAuthenticated,
    userKey: wishlistUserKey,
  });

  /* ── Effects ─────────────────────────────────────────────────────── */

  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const closeAccount = useCallback(() => setAccountOpen(false), []);
  const closeCart = useCallback(() => setCartOpen(false), []);
  const closeMegaMenu = useCallback(() => setMegaMenuOpen(false), []);

  const toggleMobile = useCallback(() => {
    setMobileOpen((isOpen) => !isOpen);
    setSearchOpen(false);
    setAccountOpen(false);
    setCartOpen(false);
    setMegaMenuOpen(false);
  }, []);

  const openSearch = useCallback(() => {
    setSearchOpen(true);
    setMobileOpen(false);
    setAccountOpen(false);
    setCartOpen(false);
    setMegaMenuOpen(false);
  }, []);

  const toggleAccount = useCallback(() => {
    setAccountOpen((isOpen) => !isOpen);
    setMobileOpen(false);
    setSearchOpen(false);
    setCartOpen(false);
    setMegaMenuOpen(false);
  }, []);

  const openCart = useCallback(() => {
    setCartOpen(true);
    setMobileOpen(false);
    setSearchOpen(false);
    setAccountOpen(false);
    setMegaMenuOpen(false);
  }, []);

  const toggleMegaMenu = useCallback(() => {
    setMegaMenuOpen((isOpen) => !isOpen);
    setMobileOpen(false);
    setSearchOpen(false);
    setAccountOpen(false);
    setCartOpen(false);
  }, []);

  const anyPanelOpen = mobileOpen || searchOpen || accountOpen || cartOpen || megaMenuOpen;

  /* Scroll detection */
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 10);
      setHidden(y > lastScrollY.current && y > 160);
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  /* Close mobile drawer on resize to lg */
  useEffect(() => {
    const fn = () => { if (window.innerWidth >= DESKTOP_BREAKPOINT_PX) setMobileOpen(false); };
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  /* Announcement ticker */
  useEffect(() => {
    const id = setInterval(
      () => setAnnouncementIdx((i) => (i + 1) % ANNOUNCEMENT_MESSAGE_COUNT),
      4000,
    );
    return () => clearInterval(id);
  }, []);

  /* ── Derived spacer heights ──────────────────────────────────────── */
  const topBarH   = announcementVisible ? "h-[calc(2rem+3rem)]"            : "h-12";
  const topBarHMd = announcementVisible
    ? "lg:h-[calc(2rem+5rem+2.75rem)]"
    : "lg:h-[calc(5rem+2.75rem)]";

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <>
      {/* Spacer — prevents content jumping under fixed header */}
      <div className={cn(topBarH, topBarHMd, "transition-all duration-300")} />

      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-out",
          hidden && !anyPanelOpen ? "-translate-y-full" : "translate-y-0"
        )}
      >
        {/* ROW 1 — Announcement bar */}
        {announcementVisible && (
          <AnnouncementBar
            activeIdx={announcementIdx}
            onClose={() => setAnnouncementVisible(false)}
          />
        )}

        {/* ROW 2 — Brand + Search + Actions */}
        <div className={cn(
          "bg-header text-header-foreground border-b border-header-border transition-all duration-300",
          scrolled && "md:shadow-md md:shadow-foreground/5"
        )}>
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className={cn(
              "flex items-center transition-all duration-300 gap-2 sm:gap-3",
              scrolled ? "h-11 lg:h-16" : "h-12 lg:h-20"
            )}>
              <HeaderBrand
                scrolled={scrolled}
                mobileOpen={mobileOpen}
                onMenuToggle={toggleMobile}
              />

              {/* Search bar — desktop only */}
              <div className="hidden lg:flex flex-1 items-center">
                <HeaderSearchBar />
              </div>

              <HeaderActions
                totalItems={totalItems}
                wishlistCount={wishlistCount}
                isAuthenticated={isAuthenticated}
                isAuthPending={isAuthPending}
                user={headerUser}
                accountOpen={accountOpen}
                onAccountToggle={toggleAccount}
                onAccountClose={closeAccount}
                onSearchOpen={openSearch}
                onCartOpen={openCart}
              />
            </div>
          </div>
        </div>

        {/* ROW 3 — Desktop category nav */}
        <HeaderNavBar
          megaMenuOpen={megaMenuOpen}
          onMegaMenuToggle={toggleMegaMenu}
        />
      </header>

      {/* ── Panels (outside header to avoid transform stacking context) ── */}
      <MobileNavDrawer
        isOpen={mobileOpen}
        onClose={closeMobile}
        categories={navCategories}
        wishlistCount={wishlistCount}
        isAuthenticated={isAuthenticated}
      />
      <MegaMenuPanel
        isOpen={megaMenuOpen}
        onClose={closeMegaMenu}
      />
      <SearchOverlay isOpen={searchOpen} onClose={closeSearch} />
      <CartDrawer   isOpen={cartOpen}   onClose={closeCart}   />
    </>
  );
};

export default Header;
