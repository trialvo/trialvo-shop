"use client";

import HeaderAction from "@/components/header/HeaderAction";
import HeaderLogo from "@/components/header/HeaderLogo";
import LangToggleButton from "@/components/header/LangToggleButton";
import NavigationMenuMain from "@/components/navigation/navigation-menu";
import * as React from "react";
import { CiSearch } from "react-icons/ci";
import { FiX } from "react-icons/fi";

import type { ProductSearchSuggestion } from "@/components/header-search/SearchField";
import { useAuth } from "@/hooks/useAuth";
import { useCategory } from "@/hooks/useCategory";
import { useLogout } from "@/hooks/useLogout";
import { useProduct } from "@/hooks/useProduct";
import { cn, toPublicUrl } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectCartCounts } from "@/redux/selectors/cartSelectors";
import { setIsCartOpen } from "@/redux/slices/cartSlice";
import { openDrawer } from "@/redux/slices/drawerManagerSlice";
import { setSearchOpen, toggleSearchOpen } from "@/redux/slices/uiSlice";
import { useRouter } from "next/navigation";
import { Product } from "./header.types";
import SearchPopup from "./SearchPopup";

const PROMO_DISMISS_KEY = "shop-promo-dismissed";
const SCROLL_TO_TOP_EVENT = "shop:scroll-to-top";
const headerSlideEase = "duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";
const AT_TOP_ENTER = 8;
const AT_TOP_LEAVE = 48;
const HEADER_EXPAND_LOCK_MS = 480;

type SubCategory = {
  id: number;
  name: string;
  img_path?: string | null;
};

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function toNumberOrZero(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function extractPriceInfo(product: Product): {
  price: number;
} {
  const priceDirect =
    toNumberOrZero(product?.price_range?.min);

  if (priceDirect > 0) {
    return { price: priceDirect };
  }

  return { price: 0 };
}

function parseSubCategoryId(value: string): number | undefined {
  if (!value || value === "all") return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = React.useState<T>(value);

  React.useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}

const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const counts = useAppSelector(selectCartCounts);
  const router = useRouter();

  const { isAuthenticated, user, isLoading } = useAuth();
  const [localAuthed, setLocalAuthed] = React.useState<boolean>(isAuthenticated);

  const logout = useLogout();

  React.useEffect(() => {
    setLocalAuthed(isAuthenticated);
  }, [isAuthenticated]);

  const searchOpen = useAppSelector((state) => state.ui.searchOpen);

  const [category, setCategory] = React.useState<string>("all");
  const [query, setQuery] = React.useState<string>("");

  const debouncedQuery = useDebouncedValue(query, 250);

  const selectedSubCategoryId = React.useMemo(() => parseSubCategoryId(category), [category]);

  const { subCategories, subCategoriesLoading } = useCategory() as {
    subCategories: SubCategory[];
    subCategoriesLoading: boolean;
  };

  const apiCategories = React.useMemo(() => {
    const base = [{ value: "all", label: "Choose Categories" }];

    const list = Array.isArray(subCategories)
      ? subCategories
        .map((c) => ({
          value: String(c.id),
          label: c.name,
          image: c.img_path ? toPublicUrl(c.img_path) : null,
        }))
        .filter((c) => c.value && c.label)
      : [];

    return [...base, ...list];
  }, [subCategories]);

  const { products, productsLoading } = useProduct(
    {
      limit: 6,
      offset: 0,
      search: debouncedQuery.trim(),
      sub_category_id: selectedSubCategoryId,
    },
    { enabled: searchOpen },
  ) as {
    products: Product[];
    productsLoading: boolean;
  };

  const suggestions: ProductSearchSuggestion[] = React.useMemo(() => {
    if (!Array.isArray(products)) return [];

    return products
      .map((p) => {
        const id = p.id != null ? String(p.id) : "";
        const name = String(p.name ?? p.title ?? "").trim();
        if (!id || !name) return null;

        const { price } = extractPriceInfo(p);

        const rawImg =
          (Array.isArray(p?.images) &&
            p.images.length > 0 &&
            typeof p.images[0]?.path === "string" &&
            p.images[0].path.trim().length > 0
            ? p.images[0].path
            : null) ??
          (typeof p.thumbnail === "string" && p.thumbnail.trim().length > 0 ? p.thumbnail : null) ??
          (typeof p.img_path === "string" && p.img_path.trim().length > 0 ? p.img_path : null) ??
          (typeof p.image === "string" && p.image.trim().length > 0 ? p.image : null);

        const img = rawImg ? toPublicUrl(rawImg) : undefined;

        const slug = typeof p.slug === "string" && p.slug.trim().length > 0 ? p.slug : "product";
        const href = `/products/${encodeURIComponent(slug)}/${encodeURIComponent(id)}/`;

        const mapped: ProductSearchSuggestion = {
          id,
          name,
          image: img,
          price: isFiniteNumber(price) ? price : 0,
          href,
          isFavourite: p.is_favourite === true,
        };

        return mapped;
      })
      .filter((x): x is ProductSearchSuggestion => x !== null);
  }, [products]);


  const headerFont =
    "var(--font-open-sans), 'Helvetica Neue', Helvetica, Tahoma, Arial, sans-serif";

  const headerRef = React.useRef<HTMLElement>(null);
  const promoInnerRef = React.useRef<HTMLDivElement>(null);
  const utilityRef = React.useRef<HTMLDivElement>(null);
  const navInnerRef = React.useRef<HTMLDivElement>(null);
  const lastScrollY = React.useRef(0);
  const scrollLockUntil = React.useRef(0);
  const atTopRef = React.useRef(true);
  const [promoDismissed, setPromoDismissed] = React.useState(false);
  const [atTop, setAtTop] = React.useState(true);
  const [navCollapsed, setNavCollapsed] = React.useState(false);

  React.useEffect(() => {
    try {
      if (sessionStorage.getItem(PROMO_DISMISS_KEY) === "1") {
        setPromoDismissed(true);
      }
    } catch {
      // sessionStorage may be unavailable
    }
  }, []);

  React.useEffect(() => {
    lastScrollY.current = window.scrollY;

    const lockAfterHeaderResize = (now: number, extraMs = 0) => {
      scrollLockUntil.current = Math.max(
        scrollLockUntil.current,
        now + HEADER_EXPAND_LOCK_MS + extraMs,
      );
    };

    const settleExpandedAtTop = (now = Date.now()) => {
      if (!atTopRef.current) {
        atTopRef.current = true;
        setAtTop(true);
        lockAfterHeaderResize(now);
      }
      setNavCollapsed((prev) => {
        if (prev) lockAfterHeaderResize(now);
        return false;
      });
    };

    const onScroll = () => {
      // Modal body-scroll lock can fire scroll jitter and collapse the header.
      if (document.documentElement.classList.contains("modal-scroll-lock")) {
        return;
      }

      const y = window.scrollY;
      const now = Date.now();
      const delta = y - lastScrollY.current;
      lastScrollY.current = y;

      if (now < scrollLockUntil.current) {
        if (y <= AT_TOP_ENTER) settleExpandedAtTop(now);
        return;
      }

      if (y <= AT_TOP_ENTER) {
        settleExpandedAtTop(now);
        return;
      }

      if (atTopRef.current && y > AT_TOP_LEAVE) {
        atTopRef.current = false;
        setAtTop(false);
        lockAfterHeaderResize(now);
      }

      // Ignore tiny jitter and lock briefly after a toggle so header
      // height changes (--shop-header-offset) don't re-trigger scroll.
      if (Math.abs(delta) < 14) return;

      if (delta > 28) {
        setNavCollapsed((prev) => {
          if (!prev) lockAfterHeaderResize(now);
          return true;
        });
      } else if (delta < -28) {
        setNavCollapsed((prev) => {
          if (prev) lockAfterHeaderResize(now);
          return false;
        });
      }
    };

    const onScrollToTop = () => {
      // Hold promo/nav/offset still while smooth-scroll runs. Expand once
      // on arrival so header growth cannot bounce scrollY and retrigger.
      lockAfterHeaderResize(Date.now(), 700);
    };

    const onScrollEnd = () => {
      if (window.scrollY <= AT_TOP_ENTER) settleExpandedAtTop();
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scrollend", onScrollEnd);
    window.addEventListener(SCROLL_TO_TOP_EVENT, onScrollToTop);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scrollend", onScrollEnd);
      window.removeEventListener(SCROLL_TO_TOP_EVENT, onScrollToTop);
    };
  }, []);

  const showPromo = !promoDismissed && atTop;

  React.useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const desktopQuery = window.matchMedia("(min-width: 768px)");

    const syncOffset = () => {
      if (!desktopQuery.matches) {
        if (document.documentElement.style.getPropertyValue("--shop-header-offset")) {
          document.documentElement.style.removeProperty("--shop-header-offset");
        }
        return;
      }
      const promo = showPromo ? (promoInnerRef.current?.offsetHeight ?? 0) : 0;
      const utility = utilityRef.current?.offsetHeight ?? 0;
      const nav = navCollapsed ? 0 : (navInnerRef.current?.offsetHeight ?? 0);
      const value = `${promo + utility + nav}px`;
      if (el.style.getPropertyValue("--shop-header-offset") === value) return;
      el.style.setProperty("--shop-header-offset", value);
      document.documentElement.style.setProperty("--shop-header-offset", value);
    };

    syncOffset();
    const observer = new ResizeObserver(syncOffset);
    if (promoInnerRef.current) observer.observe(promoInnerRef.current);
    if (utilityRef.current) observer.observe(utilityRef.current);
    if (navInnerRef.current) observer.observe(navInnerRef.current);
    desktopQuery.addEventListener("change", syncOffset);
    return () => {
      observer.disconnect();
      desktopQuery.removeEventListener("change", syncOffset);
    };
  }, [showPromo, navCollapsed]);

  const dismissPromo = () => {
    setPromoDismissed(true);
    try {
      sessionStorage.setItem(PROMO_DISMISS_KEY, "1");
    } catch {
      // sessionStorage may be unavailable
    }
  };

  return (
    <>
      <header
        ref={headerRef}
        className="w-full bg-background"
        style={{ ["--shop-header-offset" as string]: "9.25rem" }}
      >
        <div
          className={cn(
            "grid transition-[grid-template-rows]",
            headerSlideEase,
            showPromo ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <div
              ref={promoInnerRef}
              className="relative flex h-8 items-center justify-center bg-[#f6f6f6] px-10 text-center text-[11px] tracking-[0.04em] text-[#191919]"
              style={{ fontFamily: headerFont }}
            >
              Complimentary shipping and easy returns
              <button
                type="button"
                aria-label="Dismiss announcement"
                onClick={dismissPromo}
                className="absolute right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-[#191919]/50 transition-colors duration-200 hover:bg-black/[0.08] hover:text-[#191919]"
              >
                <FiX className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div
          ref={utilityRef}
          className="relative mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-5 min-[992px]:h-[72px] min-[992px]:px-8 min-[1200px]:h-20 min-[1200px]:px-10"
        >
          <div className="flex min-w-0 flex-1 items-center gap-4 min-[992px]:gap-5">
            <button
              type="button"
              aria-label={searchOpen ? "Close search" : "Search"}
              onClick={() => dispatch(toggleSearchOpen())}
              data-search-toggle
              className="inline-flex cursor-pointer items-center gap-2 text-[#191919] transition-opacity hover:opacity-60"
              style={{ fontFamily: headerFont }}
            >
              {searchOpen ? (
                <FiX className="h-5 w-5" />
              ) : (
                <CiSearch className="h-5 w-5" />
              )}
              <span className="hidden text-[13px] font-normal min-[992px]:inline">
                Search
              </span>
            </button>
            <LangToggleButton />
          </div>

          <div className="absolute left-1/2 -translate-x-1/2 overflow-hidden">
            <HeaderLogo
              src="/logo-default.svg"
              alt="Shop"
              width={160}
              height={40}
              className="h-9! w-auto! min-[992px]:h-10! min-[1200px]:h-11!"
            />
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-end">
            <HeaderAction
              key={localAuthed ? "authed" : "guest"}
              showSearch={false}
              userName={`${user?.first_name}  ${user?.last_name}`}
              firstName={user?.first_name}
              avatarSrc={toPublicUrl(user?.img_path) ?? ""}
              isAuthLoading={isLoading}
              isAuthenticated={localAuthed}
              searchOpen={searchOpen}
              cartCount={counts.itemsCount}
              onCartClick={() => {
                dispatch(setSearchOpen(false));
                dispatch(openDrawer({ key: "cart" }));
                dispatch(setIsCartOpen(true));
              }}
              onSearchClick={() => dispatch(toggleSearchOpen())}
              onLogout={() => {
                setLocalAuthed(false);
                logout();

                requestAnimationFrame(() => {
                  router.push("/sign-in");
                });
              }}
            />
          </div>
        </div>

        <div
          className={cn(
            "grid transition-[grid-template-rows]",
            headerSlideEase,
            navCollapsed ? "grid-rows-[0fr]" : "grid-rows-[1fr]",
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <div
              ref={navInnerRef}
              className="flex w-full max-w-full justify-center overflow-x-auto border-t border-black/[0.06]"
            >
              <NavigationMenuMain />
            </div>
          </div>
        </div>
      </header>

      <SearchPopup
        viewport="desktop"
        open={searchOpen}
        onClose={() => dispatch(setSearchOpen(false))}
        categories={subCategoriesLoading ? [{ value: "all", label: "Choose Categories" }] : apiCategories}
        suggestions={suggestions}
        isLoading={productsLoading}
        query={query}
        onQueryChange={setQuery}
        category={category}
        onCategoryChange={setCategory}
      />
    </>
  );
};

export default Header;
